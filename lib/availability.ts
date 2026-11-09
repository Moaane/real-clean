import { kedaluwarsakanLewatBatas } from "./kedaluwarsa";
import { prisma } from "./prisma";

const TZ = "Asia/Jakarta";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date (YYYY-MM-DD) and current "HH:mm" in WIB. */
export function nowWib() {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  return { date, time };
}

/** Parses "YYYY-MM-DD" to a UTC-midnight Date (how Prisma stores @db.Date). */
export function parseDate(value: string | undefined): Date | null {
  if (!value || !DATE_RE.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value ? null : d;
}


export type SlotInfo = {
  jam_mulai: string;
  jam_selesai: string;
  sisa: number;
};

export type SlotResult =
  | { ok: true; slots: SlotInfo[] }
  | { ok: false; error: string };

/** Open cleaning slots for a date (SPEC 5.1). */
export async function getSlotTersedia(tanggal: string | undefined): Promise<SlotResult> {
  // Unpaid bookings past batas_bayar must not keep holding quota (SPEC 6).
  await kedaluwarsakanLewatBatas();

  const date = parseDate(tanggal);
  if (!date) return { ok: false, error: "Tanggal tidak valid" };

  const today = nowWib();
  if (tanggal! < today.date) return { ok: false, error: "Tanggal yang sudah lewat tidak bisa dipilih" };

  const [jam, terisiRows] = await Promise.all([
    prisma.jamOperasional.findMany({ where: { aktif: true }, orderBy: { jam_mulai: "asc" } }),
    prisma.jadwalSlot.findMany({ where: { tanggal: date }, select: { jam_mulai: true, terisi: true } }),
  ]);
  const terisi = new Map(terisiRows.map((s) => [s.jam_mulai, s.terisi]));

  const slots = jam
    // Today: a slot that has already started can no longer be booked.
    .filter((j) => tanggal! > today.date || j.jam_mulai > today.time)
    .map((j) => ({
      jam_mulai: j.jam_mulai,
      jam_selesai: j.jam_selesai,
      // The template's quota is the source of truth, so lowering it takes effect immediately.
      sisa: j.kuota - (terisi.get(j.jam_mulai) ?? 0),
    }))
    .filter((s) => s.sisa > 0);

  return { ok: true, slots };
}
