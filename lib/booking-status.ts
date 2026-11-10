import type { BookingStatus } from "@/generated/prisma/enums";

export const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "Menunggu pembayaran",
  EXPIRED: "Kedaluwarsa",
  PAID: "Dibayar",
  ASSIGNED: "Petugas ditugaskan",
  ON_THE_WAY: "Petugas dalam perjalanan",
  IN_PROGRESS: "Sedang dikerjakan",
  AWAITING_VERIFICATION: "Menunggu verifikasi",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  REFUNDED: "Dana dikembalikan",
};

export type StatusTone = "ok" | "ok-solid" | "warn" | "danger" | "info" | "neutral";

export const STATUS_TONE: Record<BookingStatus, StatusTone> = {
  PENDING_PAYMENT: "warn",
  PAID: "ok",
  ASSIGNED: "info",
  ON_THE_WAY: "info",
  IN_PROGRESS: "info",
  AWAITING_VERIFICATION: "warn",
  COMPLETED: "ok-solid",
  EXPIRED: "neutral",
  CANCELLED: "danger",
  REFUNDED: "neutral",
};

export const rp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

/** Dates are stored as UTC midnight (@db.Date), so format them in UTC. */
export const dateId = (d: Date) =>
  d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export const timeId = (d: Date) =>
  d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

/** Booking yang lewat batas bayar tampil sebagai kedaluwarsa (status resmi diubah oleh webhook). Panggil setelah `connection()`. */
export function displayStatus(status: BookingStatus, paymentDeadline: Date): BookingStatus {
  return status === "PENDING_PAYMENT" && paymentDeadline.getTime() < Date.now() ? "EXPIRED" : status;
}
