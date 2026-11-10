import { createHash, timingSafeEqual } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { expireInTx } from "./kedaluwarsa";
import { prisma } from "./prisma";

export type Notification = {
  order_id?: unknown;
  status_code?: unknown;
  gross_amount?: unknown;
  signature_key?: unknown;
  transaction_status?: unknown;
  fraud_status?: unknown;
  payment_type?: unknown;
  transaction_time?: unknown;
};

const str = (v: unknown) => (typeof v === "string" ? v : "");

/** SPEC 6: signature_key = sha512(order_id + status_code + gross_amount + signature secret key). */
export function signatureValid(n: Notification, signatureKey: string): boolean {
  const given = str(n.signature_key);
  if (!given) return false;
  const expected = createHash("sha512")
    .update(str(n.order_id) + str(n.status_code) + str(n.gross_amount) + signatureKey)
    .digest("hex");
  const a = Buffer.from(given.toLowerCase());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type WebhookResult =
  | { ok: true; outcome: "paid" | "expired" | "pending" | "ignored" | "duplicate" }
  | { ok: false; reason: "order-tidak-ditemukan" | "jumlah-tidak-cocok" };

/** "2026-11-10 10:00:00" (WIB) to a Date; falls back to now. */
function transactionTime(v: unknown): Date {
  const m = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/.exec(str(v));
  const d = m ? new Date(`${m[1]}T${m[2]}+07:00`) : null;
  return d && !Number.isNaN(d.getTime()) ? d : new Date();
}

/**
 * Applies a notification whose signature has ALREADY been verified.
 * Idempotent: every state change is a conditional UPDATE from the one valid
 * origin state, so the same notification arriving twice (or at the same time)
 * changes nothing the second time.
 */
export async function processNotification(n: Notification): Promise<WebhookResult> {
  const orderId = str(n.order_id);
  const status = str(n.transaction_status);
  const payload = n as unknown as Prisma.InputJsonValue;

  return prisma.$transaction(async (tx): Promise<WebhookResult> => {
    const p = await tx.payment.findUnique({ where: { order_id: orderId } });
    if (!p) return { ok: false, reason: "order-tidak-ditemukan" };

    // Defence in depth: the amount must match what we charged.
    if (Math.round(Number(str(n.gross_amount))) !== p.amount) return { ok: false, reason: "jumlah-tidak-cocok" };

    const method = str(n.payment_type) || undefined;
    const success = status === "settlement" || (status === "capture" && str(n.fraud_status) === "accept");
    const failed = status === "expire" || status === "cancel" || status === "deny";

    if (success) {
      const changed = await tx.booking.updateMany({
        where: { id_booking: p.id_booking, status: "PENDING_PAYMENT" },
        data: { status: "PAID" },
      });
      if (changed.count === 0) {
        // Duplicate, or the booking already expired before the money arrived.
        const b = await tx.booking.findUniqueOrThrow({ where: { id_booking: p.id_booking }, select: { status: true } });
        if (b.status === "EXPIRED") {
          console.error("[webhook] pembayaran sukses untuk booking yang sudah KEDALUWARSA, perlu penanganan manual", orderId);
          await tx.payment.update({ where: { id_payment: p.id_payment }, data: { webhook_payload: payload } });
        }
        return { ok: true, outcome: "duplicate" };
      }
      await tx.payment.update({
        where: { id_payment: p.id_payment },
        data: { payment_status: "settlement", payment_method: method, paid_at: transactionTime(n.transaction_time), webhook_payload: payload },
      });
      return { ok: true, outcome: "paid" };
    }

    if (failed) {
      const done = await expireInTx(tx, p.id_booking);
      if (!done) return { ok: true, outcome: "duplicate" };
      await tx.payment.update({ where: { id_payment: p.id_payment }, data: { webhook_payload: payload } });
      return { ok: true, outcome: "expired" };
    }

    if (status === "pending") {
      // Only records the chosen payment method. Never downgrades a settled payment.
      const changed = await tx.payment.updateMany({
        where: { id_payment: p.id_payment, payment_status: "pending" },
        data: { payment_method: method, webhook_payload: payload },
      });
      return { ok: true, outcome: changed.count ? "pending" : "duplicate" };
    }

    return { ok: true, outcome: "ignored" };
  });
}
