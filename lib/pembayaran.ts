import { randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { createSnapToken } from "./midtrans";
import { prisma } from "./prisma";

export type SnapResult = { ok: true; token: string } | { ok: false; error: string };

/**
 * Returns a Snap token for the customer's own unpaid booking. The amount comes
 * from booking.total_harga (set server-side from layanan.harga); nothing from
 * the client is trusted except the booking code, which is ownership-checked.
 * Calling it again reuses the pending payment's token.
 */
export async function siapkanPembayaran(kode: string, userId: number): Promise<SnapResult> {
  const booking = await prisma.booking.findFirst({
    where: { kode_booking: kode.toUpperCase(), id_pelanggan: userId },
    include: { layanan: true, pelanggan: true, pembayaran: true },
  });
  if (!booking) return { ok: false, error: "Booking tidak ditemukan" };
  if (booking.status !== "MENUNGGU_PEMBAYARAN") return { ok: false, error: "Booking ini tidak menunggu pembayaran" };

  const sisaMs = booking.batas_bayar.getTime() - Date.now();
  if (sisaMs <= 0) return { ok: false, error: "Batas pembayaran sudah lewat" };

  const ada = booking.pembayaran;
  if (ada) {
    return ada.status_bayar === "pending" && ada.payment_url
      ? { ok: true, token: ada.payment_url }
      : { ok: false, error: "Pembayaran untuk booking ini sudah diproses" };
  }

  const orderId = `GC-${booking.kode_booking}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const token = await createSnapToken({
    orderId,
    grossAmount: booking.total_harga,
    itemName: booking.layanan.nama_layanan,
    customer: { nama: booking.pelanggan.nama, email: booking.pelanggan.email, hp: booking.pelanggan.no_hp },
    // Snap expiry is at least 1 minute; it ends at batas_bayar.
    expiryMinutes: Math.max(1, Math.floor(sisaMs / 60_000)),
    finishUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/akun/booking/${booking.kode_booking}`,
  });

  try {
    await prisma.pembayaran.create({
      data: {
        id_booking: booking.id_booking,
        order_id: orderId,
        jumlah: booking.total_harga,
        status_bayar: "pending",
        payment_url: token,
      },
    });
    return { ok: true, token };
  } catch (e) {
    // Double click: another request saved a payment first. Use that one.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const p = await prisma.pembayaran.findUnique({ where: { id_booking: booking.id_booking } });
      if (p?.status_bayar === "pending" && p.payment_url) return { ok: true, token: p.payment_url };
    }
    throw e;
  }
}
