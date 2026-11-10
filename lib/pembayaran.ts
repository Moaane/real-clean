import { randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { createSnapToken, type SnapItem } from "./midtrans";
import { prisma } from "./prisma";

export type SnapResult = { ok: true; token: string } | { ok: false; error: string };

/**
 * Snap item_details from the booking's price snapshot: base fee (qty 1) plus the
 * per-room fee (qty room_count). Zero-priced lines are skipped. The total of
 * the lines must equal total_price, otherwise nothing is sent to Midtrans.
 */
export function itemBooking(b: {
  room_count: number;
  base_price: number;
  price_per_room: number;
  total_price: number;
  service: { service_name: string };
}): SnapItem[] {
  const items: SnapItem[] = [];
  if (b.base_price > 0) items.push({ id: "base", name: `Biaya dasar ${b.service.service_name}`, price: b.base_price, quantity: 1 });
  if (b.price_per_room > 0) items.push({ id: "room", name: `Per kamar (${b.service.service_name})`, price: b.price_per_room, quantity: b.room_count });
  return items;
}

/**
 * Returns a Snap token for the customer's own unpaid booking. The amount comes
 * from booking.total_harga (computed server-side from the package price per
 * room when the booking was created); nothing from
 * the client is trusted except the booking code, which is ownership-checked.
 * Calling it again reuses the pending payment's token.
 */
export async function preparePayment(code: string, userId: number): Promise<SnapResult> {
  const booking = await prisma.booking.findFirst({
    where: { booking_code: code.toUpperCase(), id_customer: userId },
    include: { service: true, customer: true, payment: true },
  });
  if (!booking) return { ok: false, error: "Booking tidak ditemukan" };
  if (booking.status !== "PENDING_PAYMENT") return { ok: false, error: "Booking ini tidak menunggu pembayaran" };

  const remainingMs = booking.payment_deadline.getTime() - Date.now();
  if (remainingMs <= 0) return { ok: false, error: "Batas pembayaran sudah lewat" };

  const exists = booking.payment;
  if (exists) {
    return exists.payment_status === "pending" && exists.payment_url
      ? { ok: true, token: exists.payment_url }
      : { ok: false, error: "Pembayaran untuk booking ini sudah diproses" };
  }

  const orderId = `GC-${booking.booking_code}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const token = await createSnapToken({
    orderId,
    grossAmount: booking.total_price,
    items: itemBooking(booking),
    customer: { name: booking.customer.name, email: booking.customer.email, phone: booking.customer.phone },
    // Snap expiry is at least 1 minute; it ends at batas_bayar.
    expiryMinutes: Math.max(1, Math.floor(remainingMs / 60_000)),
    finishUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/akun/booking/${booking.booking_code}`,
  });

  try {
    await prisma.payment.create({
      data: {
        id_booking: booking.id_booking,
        order_id: orderId,
        amount: booking.total_price,
        payment_status: "pending",
        payment_url: token,
      },
    });
    return { ok: true, token };
  } catch (e) {
    // Double click: another request saved a payment first. Use that one.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const p = await prisma.payment.findUnique({ where: { id_booking: booking.id_booking } });
      if (p?.payment_status === "pending" && p.payment_url) return { ok: true, token: p.payment_url };
    }
    throw e;
  }
}
