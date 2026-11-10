import { durationLabel, slotLengthMinutes } from "./harga";
import { expireOverdue } from "./kedaluwarsa";
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

/** True once the slot's start (start_time on its date, WIB) has been reached. Slot dates are UTC-midnight @db.Date. */
export function slotStarted(date: Date, startTime: string) {
  const now = nowWib();
  const slotDate = date.toISOString().slice(0, 10);
  return slotDate < now.date || (slotDate === now.date && startTime <= now.time);
}

/** Parses "YYYY-MM-DD" to a UTC-midnight Date (how Prisma stores @db.Date). */
export function parseDate(value: string | undefined): Date | null {
  if (!value || !DATE_RE.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value ? null : d;
}


export type SlotInfo = {
  start_time: string;
  end_time: string;
  /** Sisa kapasitas efektif (min(kuota, karyawan aktif) dikurangi terisi), tidak pernah negatif. */
  remaining: number;
  /** true bila slot bisa dipesan untuk durasi yang diminta. */
  fits: boolean;
  /** Alasan slot tidak muat (hanya bila `muat` false). */
  reason?: string;
};

export type SlotResult =
  | { ok: true; slots: SlotInfo[] }
  | { ok: false; error: string };

/** YYYY-MM-DD + n hari. */
export function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Jumlah karyawan aktif: batas atas berapa tim yang bisa bekerja paralel (SPEC 5.1). */
export async function activeStaffCount(db: Pick<typeof prisma, "user"> = prisma) {
  return db.user.count({ where: { role: "staff", is_active: true } });
}

/**
 * Slots for `hari` consecutive dates starting at `mulai` (SPEC 5.1), keyed by date.
 * Capacity per slot = min(quota of the operating hour, active employees) - terisi.
 * With `durasiMenit`, a slot is `muat` only if it has capacity AND is long enough;
 * otherwise it stays in the list with the reason. Slots that already started today
 * are dropped. One sweep and three queries however many days are asked for.
 */
export async function getSlotRange(start: string, dayEntry: number, durationMinutes?: number): Promise<Map<string, SlotInfo[]>> {
  // Unpaid bookings past batas_bayar must not keep holding quota (SPEC 6).
  await expireOverdue();

  const out = new Map<string, SlotInfo[]>();
  const initial = parseDate(start);
  if (!initial || dayEntry < 1) return out;
  const today = nowWib();
  const dates = Array.from({ length: dayEntry }, (_, i) => addDays(start, i)).filter((d) => d >= today.date);
  if (dates.length === 0) return out;

  const [timeSlot, filledRows, staff] = await Promise.all([
    prisma.operatingHour.findMany({ where: { active: true }, orderBy: { start_time: "asc" } }),
    prisma.scheduleSlot.findMany({
      where: { date: { gte: parseDate(dates[0])!, lte: parseDate(dates[dates.length - 1])! } },
      select: { date: true, start_time: true, filled: true },
    }),
    activeStaffCount(),
  ]);
  const filled = new Map(filledRows.map((s) => [`${s.date.toISOString().slice(0, 10)}|${s.start_time}`, s.filled]));

  for (const date of dates) {
    const slots: SlotInfo[] = timeSlot
      // Today: a slot that has already started can no longer be booked.
      .filter((j) => date > today.date || j.start_time > today.time)
      .map((j) => {
        // The template's quota (capped by staff) is the source of truth, so lowering it takes effect immediately.
        const remaining = Math.max(0, Math.min(j.quota, staff) - (filled.get(`${date}|${j.start_time}`) ?? 0));
        const slotSpan = slotLengthMinutes(j.start_time, j.end_time);
        if (durationMinutes !== undefined && durationMinutes > slotSpan) {
          return {
            start_time: j.start_time,
            end_time: j.end_time,
            remaining,
            fits: false,
            reason: `Durasi ${durationLabel(durationMinutes)} melebihi slot ${durationLabel(slotSpan)}`,
          };
        }
        if (remaining === 0) return { start_time: j.start_time, end_time: j.end_time, remaining, fits: false, reason: "Penuh" };
        return { start_time: j.start_time, end_time: j.end_time, remaining, fits: true };
      });
    out.set(date, slots);
  }
  return out;
}

/** Open slots (only those that fit) for one date. With `durasiMenit`, too-short slots are left out. */
export async function getAvailableSlots(date: string | undefined, durationMinutes?: number): Promise<SlotResult> {
  const parsedDate = parseDate(date);
  if (!parsedDate) return { ok: false, error: "Tanggal tidak valid" };
  if (date! < nowWib().date) return { ok: false, error: "Tanggal yang sudah lewat tidak bisa dipilih" };

  const range = await getSlotRange(date!, 1, durationMinutes);
  return { ok: true, slots: (range.get(date!) ?? []).filter((s) => s.fits) };
}

/** First date from `dari` (inclusive) within `maxHari` days that has a slot fitting `durasiMenit`, or null. */
export async function findNearestDate(from: string, durationMinutes: number, maxDays = 60): Promise<string | null> {
  const range = await getSlotRange(from, maxDays, durationMinutes);
  for (const [date, slots] of range) if (slots.some((s) => s.fits)) return date;
  return null;
}
