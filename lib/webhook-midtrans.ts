import { createHash, timingSafeEqual } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { kedaluwarsakanDalamTx } from "./kedaluwarsa";
import { prisma } from "./prisma";

export type Notifikasi = {
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
export function signatureValid(n: Notifikasi, signatureKey: string): boolean {
  const given = str(n.signature_key);
  if (!given) return false;
  const expected = createHash("sha512")
    .update(str(n.order_id) + str(n.status_code) + str(n.gross_amount) + signatureKey)
    .digest("hex");
  const a = Buffer.from(given.toLowerCase());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type HasilWebhook =
  | { ok: true; aksi: "dibayar" | "kedaluwarsa" | "pending" | "diabaikan" | "duplikat" }
  | { ok: false; alasan: "order-tidak-ditemukan" | "jumlah-tidak-cocok" };

/** "2026-11-10 10:00:00" (WIB) to a Date; falls back to now. */
function waktuTransaksi(v: unknown): Date {
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
export async function prosesNotifikasi(n: Notifikasi): Promise<HasilWebhook> {
  const orderId = str(n.order_id);
  const status = str(n.transaction_status);
  const payload = n as unknown as Prisma.InputJsonValue;

  return prisma.$transaction(async (tx): Promise<HasilWebhook> => {
    const p = await tx.pembayaran.findUnique({ where: { order_id: orderId } });
    if (!p) return { ok: false, alasan: "order-tidak-ditemukan" };

    // Defence in depth: the amount must match what we charged.
    if (Math.round(Number(str(n.gross_amount))) !== p.jumlah) return { ok: false, alasan: "jumlah-tidak-cocok" };

    const metode = str(n.payment_type) || undefined;
    const sukses = status === "settlement" || (status === "capture" && str(n.fraud_status) === "accept");
    const gagal = status === "expire" || status === "cancel" || status === "deny";

    if (sukses) {
      const changed = await tx.booking.updateMany({
        where: { id_booking: p.id_booking, status: "MENUNGGU_PEMBAYARAN" },
        data: { status: "DIBAYAR" },
      });
      if (changed.count === 0) {
        // Duplicate, or the booking already expired before the money arrived.
        const b = await tx.booking.findUniqueOrThrow({ where: { id_booking: p.id_booking }, select: { status: true } });
        if (b.status === "KEDALUWARSA") {
          console.error("[webhook] pembayaran sukses untuk booking yang sudah KEDALUWARSA, perlu penanganan manual", orderId);
          await tx.pembayaran.update({ where: { id_pembayaran: p.id_pembayaran }, data: { payload_webhook: payload } });
        }
        return { ok: true, aksi: "duplikat" };
      }
      await tx.pembayaran.update({
        where: { id_pembayaran: p.id_pembayaran },
        data: { status_bayar: "settlement", metode_bayar: metode, waktu_bayar: waktuTransaksi(n.transaction_time), payload_webhook: payload },
      });
      return { ok: true, aksi: "dibayar" };
    }

    if (gagal) {
      const done = await kedaluwarsakanDalamTx(tx, p.id_booking);
      if (!done) return { ok: true, aksi: "duplikat" };
      await tx.pembayaran.update({ where: { id_pembayaran: p.id_pembayaran }, data: { payload_webhook: payload } });
      return { ok: true, aksi: "kedaluwarsa" };
    }

    if (status === "pending") {
      // Only records the chosen payment method. Never downgrades a settled payment.
      const changed = await tx.pembayaran.updateMany({
        where: { id_pembayaran: p.id_pembayaran, status_bayar: "pending" },
        data: { metode_bayar: metode, payload_webhook: payload },
      });
      return { ok: true, aksi: changed.count ? "pending" : "duplikat" };
    }

    return { ok: true, aksi: "diabaikan" };
  });
}
