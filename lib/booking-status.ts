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

export function statusBadgeClass(s: StatusBooking) {
  if (s === "SELESAI" || s === "DIBAYAR") return "badge-on";
  if (s === "MENUNGGU_PEMBAYARAN") return "badge-warn";
  if (s === "KEDALUWARSA" || s === "DIBATALKAN" || s === "DIREFUND") return "badge-off";
  return "badge-soft";
}

export const rp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

/** Dates are stored as UTC midnight (@db.Date), so format them in UTC. */
export const tanggalId = (d: Date) =>
  d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export const waktuId = (d: Date) =>
  d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
