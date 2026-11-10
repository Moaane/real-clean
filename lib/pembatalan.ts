import { refundTransaction } from "./midtrans";
import { prisma } from "./prisma";

/** Booking statuses from which a customer may ask to cancel (SPEC 7). */
export const CANCELLABLE_STATUSES = ["PAID", "ASSIGNED"] as const;

const FULL_REFUND_HOURS = 24;

/** Start of the slot (start_time on its date, WIB). Slot dates are UTC-midnight @db.Date. */
export function scheduleStart(date: Date, startTime: string) {
  return new Date(`${date.toISOString().slice(0, 10)}T${startTime}:00+07:00`);
}

/** SPEC 7: full refund only if the request was made >= 24 hours before the slot starts. */
export function isRefundEligible(date: Date, startTime: string, requestedAt: Date) {
  return scheduleStart(date, startTime).getTime() - requestedAt.getTime() >= FULL_REFUND_HOURS * 3600_000;
}

export type CancelResult = { ok: true } | { ok: false; error: string };

/** A request that is waiting for the admin's decision. */
const AWAITING_DECISION = { cancel_requested_at: { not: null }, cancel_rejected: false } as const;

/** Customer asks to cancel. One request per booking; only the owner, only DIBAYAR/DITUGASKAN. */
export async function requestCancel(input: { idBooking: number; idCustomer: number; reason: string }): Promise<CancelResult> {
  const changed = await prisma.booking.updateMany({
    where: {
      id_booking: input.idBooking,
      id_customer: input.idCustomer,
      status: { in: [...CANCELLABLE_STATUSES] },
      cancel_requested_at: null,
    },
    data: { cancel_reason: input.reason, cancel_requested_at: new Date() },
  });
  if (changed.count === 0) return { ok: false, error: "Booking ini tidak bisa diajukan pembatalan (status berubah atau sudah pernah diajukan)" };
  return { ok: true };
}

/** Admin rejects: status stays as is, the request is marked rejected. */
export async function rejectCancel(idBooking: number): Promise<CancelResult> {
  const changed = await prisma.booking.updateMany({
    where: { id_booking: idBooking, status: { in: [...CANCELLABLE_STATUSES] }, ...AWAITING_DECISION },
    data: { cancel_rejected: true },
  });
  if (changed.count === 0) return { ok: false, error: "Tidak ada pengajuan batal yang menunggu keputusan" };
  return { ok: true };
}

export type ApproveCancelResult = { ok: true; idRefund: number; refund: "success" | "failed" } | { ok: false; error: string };

/**
 * Admin approves (SPEC 7). Step 1, one transaction: booking -> DIBATALKAN
 * (conditional UPDATE, so a double click or a concurrent change wins only once),
 * slot released, active tasks cancelled, refund row `diproses` created.
 * Step 2, after commit: Midtrans refund. Success -> refund `sukses`, payment
 * `refund`, booking DIREFUND. Failure -> refund `gagal` with the reason; the
 * booking stays DIBATALKAN. The gateway is only called by the request that won step 1.
 */
export async function approveCancel(input: { idBooking: number; idAdmin: number }): Promise<ApproveCancelResult> {
  const initial = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.findUnique({ where: { id_booking: input.idBooking }, include: { payment: true } });
    if (!b) return { error: "Booking tidak ditemukan" } as const;
    if (!b.payment || b.payment.payment_status !== "settlement") return { error: "Pembayaran booking ini belum lunas, tidak ada yang bisa direfund" } as const;

    const changed = await tx.booking.updateMany({
      where: { id_booking: b.id_booking, status: { in: [...CANCELLABLE_STATUSES] }, ...AWAITING_DECISION },
      data: { status: "CANCELLED" },
    });
    if (changed.count === 0) return { error: "Tidak ada pengajuan batal yang menunggu keputusan (status booking sudah berubah)" } as const;

    await tx.scheduleSlot.updateMany({ where: { id_slot: b.id_slot, filled: { gt: 0 } }, data: { filled: { decrement: 1 } } });
    await tx.assignment.updateMany({
      where: { id_booking: b.id_booking, task_status: { notIn: ["completed", "cancelled"] } },
      data: { task_status: "cancelled" },
    });
    const refund = await tx.refund.create({
      data: { id_payment: b.payment.id_payment, id_admin: input.idAdmin, amount: b.payment.amount, reason: b.cancel_reason },
    });
    return { refund, orderId: b.payment.order_id, idPayment: b.payment.id_payment } as const;
  });
  if (!initial.refund) return { ok: false, error: initial.error ?? "Pembatalan gagal diproses" };

  const { refund, orderId, idPayment } = initial;
  const gw = await refundTransaction({
    orderId,
    refundKey: `RF-${refund.id_refund}`,
    amount: refund.amount,
    reason: refund.reason ?? "Pembatalan booking",
  });

  if (gw.ok) {
    await prisma.$transaction([
      prisma.refund.update({ where: { id_refund: refund.id_refund }, data: { refund_status: "success" } }),
      prisma.payment.update({ where: { id_payment: idPayment }, data: { payment_status: "refund" } }),
      prisma.booking.updateMany({ where: { id_booking: input.idBooking, status: "CANCELLED" }, data: { status: "REFUNDED" } }),
    ]);
    return { ok: true, idRefund: refund.id_refund, refund: "success" };
  }

  await prisma.refund.update({ where: { id_refund: refund.id_refund }, data: { refund_status: "failed", failure_message: gw.message.slice(0, 500) } });
  return { ok: true, idRefund: refund.id_refund, refund: "failed" };
}
