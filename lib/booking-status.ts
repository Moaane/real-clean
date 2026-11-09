import type { StatusBooking } from "@/generated/prisma/enums";

export const STATUS_LABEL: Record<StatusBooking, string> = {
  MENUNGGU_PEMBAYARAN: "Menunggu pembayaran",
  KEDALUWARSA: "Kedaluwarsa",
  DIBAYAR: "Dibayar",
  DITUGASKAN: "Petugas ditugaskan",
  DALAM_PERJALANAN: "Petugas dalam perjalanan",
  DIKERJAKAN: "Sedang dikerjakan",
  MENUNGGU_VERIFIKASI: "Menunggu verifikasi",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
  DIREFUND: "Dana dikembalikan",
};

export type StatusTone = "ok" | "ok-solid" | "warn" | "danger" | "info" | "neutral";

export const STATUS_TONE: Record<StatusBooking, StatusTone> = {
  MENUNGGU_PEMBAYARAN: "warn",
  DIBAYAR: "ok",
  DITUGASKAN: "info",
  DALAM_PERJALANAN: "info",
  DIKERJAKAN: "info",
  MENUNGGU_VERIFIKASI: "warn",
  SELESAI: "ok-solid",
  KEDALUWARSA: "neutral",
  DIBATALKAN: "danger",
  DIREFUND: "neutral",
};

export const rp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

/** Dates are stored as UTC midnight (@db.Date), so format them in UTC. */
export const tanggalId = (d: Date) =>
  d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export const waktuId = (d: Date) =>
  d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });

/** Booking yang lewat batas bayar tampil sebagai kedaluwarsa (status resmi diubah oleh webhook). Panggil setelah `connection()`. */
export function tampilStatus(status: StatusBooking, batasBayar: Date): StatusBooking {
  return status === "MENUNGGU_PEMBAYARAN" && batasBayar.getTime() < Date.now() ? "KEDALUWARSA" : status;
}
