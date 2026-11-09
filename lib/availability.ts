import { durasiLabel, panjangSlotMenit } from "./harga";
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
  /** Sisa kapasitas efektif (min(kuota, karyawan aktif) dikurangi terisi), tidak pernah negatif. */
  sisa: number;
  /** true bila slot bisa dipesan untuk durasi yang diminta. */
  muat: boolean;
  /** Alasan slot tidak muat (hanya bila `muat` false). */
  alasan?: string;
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
export async function jumlahKaryawanAktif(db: Pick<typeof prisma, "user"> = prisma) {
  return db.user.count({ where: { role: "karyawan", status_aktif: true } });
}

/**
 * Slots for `hari` consecutive dates starting at `mulai` (SPEC 5.1), keyed by date.
 * Capacity per slot = min(quota of the operating hour, active employees) - terisi.
 * With `durasiMenit`, a slot is `muat` only if it has capacity AND is long enough;
 * otherwise it stays in the list with the reason. Slots that already started today
 * are dropped. One sweep and three queries however many days are asked for.
 */
export async function getSlotRange(mulai: string, hari: number, durasiMenit?: number): Promise<Map<string, SlotInfo[]>> {
  // Unpaid bookings past batas_bayar must not keep holding quota (SPEC 6).
  await kedaluwarsakanLewatBatas();

  const out = new Map<string, SlotInfo[]>();
  const awal = parseDate(mulai);
  if (!awal || hari < 1) return out;
  const today = nowWib();
  const dates = Array.from({ length: hari }, (_, i) => addDays(mulai, i)).filter((d) => d >= today.date);
  if (dates.length === 0) return out;

  const [jam, terisiRows, karyawan] = await Promise.all([
    prisma.jamOperasional.findMany({ where: { aktif: true }, orderBy: { jam_mulai: "asc" } }),
    prisma.jadwalSlot.findMany({
      where: { tanggal: { gte: parseDate(dates[0])!, lte: parseDate(dates[dates.length - 1])! } },
      select: { tanggal: true, jam_mulai: true, terisi: true },
    }),
    jumlahKaryawanAktif(),
  ]);
  const terisi = new Map(terisiRows.map((s) => [`${s.tanggal.toISOString().slice(0, 10)}|${s.jam_mulai}`, s.terisi]));

  for (const date of dates) {
    const slots: SlotInfo[] = jam
      // Today: a slot that has already started can no longer be booked.
      .filter((j) => date > today.date || j.jam_mulai > today.time)
      .map((j) => {
        // The template's quota (capped by staff) is the source of truth, so lowering it takes effect immediately.
        const sisa = Math.max(0, Math.min(j.kuota, karyawan) - (terisi.get(`${date}|${j.jam_mulai}`) ?? 0));
        const panjang = panjangSlotMenit(j.jam_mulai, j.jam_selesai);
        if (durasiMenit !== undefined && durasiMenit > panjang) {
          return {
            jam_mulai: j.jam_mulai,
            jam_selesai: j.jam_selesai,
            sisa,
            muat: false,
            alasan: `Durasi ${durasiLabel(durasiMenit)} melebihi slot ${durasiLabel(panjang)}`,
          };
        }
        if (sisa === 0) return { jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai, sisa, muat: false, alasan: "Penuh" };
        return { jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai, sisa, muat: true };
      });
    out.set(date, slots);
  }
  return out;
}

/** Open slots (only those that fit) for one date. With `durasiMenit`, too-short slots are left out. */
export async function getSlotTersedia(tanggal: string | undefined, durasiMenit?: number): Promise<SlotResult> {
  const date = parseDate(tanggal);
  if (!date) return { ok: false, error: "Tanggal tidak valid" };
  if (tanggal! < nowWib().date) return { ok: false, error: "Tanggal yang sudah lewat tidak bisa dipilih" };

  const range = await getSlotRange(tanggal!, 1, durasiMenit);
  return { ok: true, slots: (range.get(tanggal!) ?? []).filter((s) => s.muat) };
}

/** First date from `dari` (inclusive) within `maxHari` days that has a slot fitting `durasiMenit`, or null. */
export async function cariTanggalTerdekat(dari: string, durasiMenit: number, maxHari = 60): Promise<string | null> {
  const range = await getSlotRange(dari, maxHari, durasiMenit);
  for (const [date, slots] of range) if (slots.some((s) => s.muat)) return date;
  return null;
}
