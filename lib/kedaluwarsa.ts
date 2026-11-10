import { prisma } from "./prisma";

/**
 * Marks PENDING_PAYMENT bookings past `payment_deadline` as EXPIRED and
 * releases their slot quota (SPEC 6: also done lazily when availability is
 * computed or a booking page is opened). Each booking changes state through a
 * conditional UPDATE, so running this concurrently with the webhook (or with
 * itself) releases the slot exactly once.
 */
export async function expireOverdue(): Promise<number> {
  const due = await prisma.booking.findMany({
    where: { status: "PENDING_PAYMENT", payment_deadline: { lt: new Date() } },
    select: { id_booking: true },
    take: 200,
  });

  let n = 0;
  for (const { id_booking } of due) {
    const done = await prisma.$transaction((tx) => expireInTx(tx, id_booking));
    if (done) n++;
  }
  return n;
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Moves one booking to EXPIRED and frees its slot. Returns false if it was no longer waiting for payment. */
export async function expireInTx(tx: Tx, idBooking: number): Promise<boolean> {
  const changed = await tx.booking.updateMany({
    where: { id_booking: idBooking, status: "PENDING_PAYMENT" },
    data: { status: "EXPIRED" },
  });
  if (changed.count === 0) return false;

  const b = await tx.booking.findUniqueOrThrow({ where: { id_booking: idBooking }, select: { id_slot: true } });
  await tx.scheduleSlot.updateMany({ where: { id_slot: b.id_slot, filled: { gt: 0 } }, data: { filled: { decrement: 1 } } });
  await tx.payment.updateMany({ where: { id_booking: idBooking, payment_status: "pending" }, data: { payment_status: "expire" } });
  return true;
}
