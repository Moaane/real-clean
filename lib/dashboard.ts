import type { StatusBooking } from "@/generated/prisma/enums";
import { prisma } from "./prisma";
import { nowWib } from "./availability";

export type Range = "day" | "week" | "month" | "quarter" | "year";
export const RANGES: Range[] = ["day", "week", "month", "quarter", "year"];
export const RANGE_LABEL: Record<Range, string> = {
  day: "Hari",
  week: "Minggu",
  month: "Bulan",
  quarter: "Kuartal",
  year: "Tahun",
};
export const RANGE_HINT: Record<Range, string> = {
  day: "hari ini, per jam",
  week: "7 hari terakhir",
  month: "30 hari terakhir",
  quarter: "13 minggu terakhir",
  year: "12 bulan terakhir",
};

export const parseRange = (v?: string): Range => (RANGES.includes(v as Range) ? (v as Range) : "week");

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const WIB = 7 * HOUR;
/** Status yang dihitung sebagai nilai terkonfirmasi (sudah dibayar dan tidak batal). */
const TERKONFIRMASI: StatusBooking[] = [
  "DIBAYAR",
  "DITUGASKAN",
  "DALAM_PERJALANAN",
  "DIKERJAKAN",
  "MENUNGGU_VERIFIKASI",
  "SELESAI",
];

type Bucket = { label: string; start: number; end: number };

const fmt = (ms: number, o: Intl.DateTimeFormatOptions) =>
  new Date(ms + WIB).toLocaleDateString("id-ID", { ...o, timeZone: "UTC" });

/** Bucket waktu dalam WIB; `start`/`end` adalah instan UTC (ms). */
function buildBuckets(range: Range): Bucket[] {
  const { date } = nowWib();
  const [y, m, d] = date.split("-").map(Number);
  const todayStart = Date.UTC(y, m - 1, d) - WIB;
  const out: Bucket[] = [];
  if (range === "day") {
    for (let h = 0; h < 24; h++) {
      const start = todayStart + h * HOUR;
      out.push({ label: String(h).padStart(2, "0"), start, end: start + HOUR });
    }
  } else if (range === "week" || range === "month") {
    const n = range === "week" ? 7 : 30;
    for (let i = n - 1; i >= 0; i--) {
      const start = todayStart - i * DAY;
      out.push({ label: fmt(start, { day: "numeric", month: "short" }), start, end: start + DAY });
    }
  } else if (range === "quarter") {
    for (let i = 12; i >= 0; i--) {
      const start = todayStart - (i * 7 + 6) * DAY;
      out.push({ label: fmt(start, { day: "numeric", month: "short" }), start, end: start + 7 * DAY });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const start = Date.UTC(y, m - 1 - i, 1) - WIB;
      const end = Date.UTC(y, m - i, 1) - WIB;
      out.push({ label: fmt(start, { month: "short", year: "2-digit" }), start, end });
    }
  }
  return out;
}

export type Point = { label: string; value: number };

export type Dashboard = {
  range: Range;
  updatedAt: string;
  booking: { total: number; prev: number; series: Point[] };
  nilai: { total: number; prev: number; series: Point[] };
  pendapatan: number;
  status: { status: StatusBooking; count: number }[];
  topLayanan: { nama: string; count: number }[];
  perluTindakan: { belumDitugaskan: number; menungguVerifikasi: number; menungguBayar: number };
  okupansi: { terisi: number; kuota: number };
  jadwalHariIni: {
    id: number;
    kode: string;
    jam: string;
    paket: string;
    pelanggan: string;
    status: StatusBooking;
  }[];
  ringkas: { paketAktif: number; karyawanAktif: number; pelanggan: number };
};

export async function getDashboard(range: Range): Promise<Dashboard> {
  const buckets = buildBuckets(range);
  const start = buckets[0].start;
  const end = buckets[buckets.length - 1].end;
  const prevStart = start - (end - start);
  const today = nowWib();
  const todayDate = new Date(`${today.date}T00:00:00.000Z`);

  const [rows, settled, paketAktif, karyawanAktif, pelanggan, belumDitugaskan, menungguVerifikasi, menungguBayar, slotHariIni, jamAktif, jadwal] =
    await Promise.all([
      prisma.booking.findMany({
        where: { created_at: { gte: new Date(prevStart), lt: new Date(end) } },
        select: { created_at: true, total_harga: true, status: true, layanan: { select: { nama_layanan: true } } },
      }),
      prisma.pembayaran.aggregate({
        _sum: { jumlah: true },
        where: { status_bayar: "settlement", waktu_bayar: { gte: new Date(start), lt: new Date(end) } },
      }),
      prisma.layanan.count({ where: { status_aktif: true } }),
      prisma.user.count({ where: { role: "karyawan", status_aktif: true } }),
      prisma.user.count({ where: { role: "pelanggan" } }),
      prisma.booking.count({ where: { status: "DIBAYAR" } }),
      prisma.booking.count({ where: { status: "MENUNGGU_VERIFIKASI" } }),
      prisma.booking.count({ where: { status: "MENUNGGU_PEMBAYARAN", batas_bayar: { gt: new Date() } } }),
      prisma.jadwalSlot.aggregate({ _sum: { terisi: true }, where: { tanggal: todayDate } }),
      prisma.jamOperasional.aggregate({ _sum: { kuota: true }, where: { aktif: true } }),
      prisma.booking.findMany({
        where: { slot: { tanggal: todayDate }, status: { in: TERKONFIRMASI.filter((s) => s !== "SELESAI") } },
        orderBy: { slot: { jam_mulai: "asc" } },
        select: {
          id_booking: true,
          kode_booking: true,
          status: true,
          layanan: { select: { nama_layanan: true } },
          slot: { select: { jam_mulai: true, jam_selesai: true } },
          pelanggan: { select: { nama: true } },
        },
      }),
    ]);

  const bookingSeries: Point[] = buckets.map((b) => ({ label: b.label, value: 0 }));
  const nilaiSeries: Point[] = buckets.map((b) => ({ label: b.label, value: 0 }));
  let bookingPrev = 0;
  let nilaiPrev = 0;
  const statusMap = new Map<StatusBooking, number>();
  const layananMap = new Map<string, number>();

  for (const r of rows) {
    const t = r.created_at.getTime();
    const konfirm = TERKONFIRMASI.includes(r.status);
    if (t < start) {
      bookingPrev++;
      if (konfirm) nilaiPrev += r.total_harga;
      continue;
    }
    const i = buckets.findIndex((b) => t >= b.start && t < b.end);
    if (i < 0) continue;
    bookingSeries[i].value++;
    if (konfirm) nilaiSeries[i].value += r.total_harga;
    statusMap.set(r.status, (statusMap.get(r.status) ?? 0) + 1);
    layananMap.set(r.layanan.nama_layanan, (layananMap.get(r.layanan.nama_layanan) ?? 0) + 1);
  }

  const sum = (s: Point[]) => s.reduce((a, p) => a + p.value, 0);

  return {
    range,
    updatedAt: today.time,
    booking: { total: sum(bookingSeries), prev: bookingPrev, series: bookingSeries },
    nilai: { total: sum(nilaiSeries), prev: nilaiPrev, series: nilaiSeries },
    pendapatan: settled._sum.jumlah ?? 0,
    status: [...statusMap].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
    topLayanan: [...layananMap].map(([nama, count]) => ({ nama, count })).sort((a, b) => b.count - a.count).slice(0, 5),
    perluTindakan: { belumDitugaskan, menungguVerifikasi, menungguBayar },
    okupansi: { terisi: slotHariIni._sum.terisi ?? 0, kuota: jamAktif._sum.kuota ?? 0 },
    jadwalHariIni: jadwal.map((j) => ({
      id: j.id_booking,
      kode: j.kode_booking,
      jam: `${j.slot.jam_mulai}–${j.slot.jam_selesai}`,
      paket: j.layanan.nama_layanan,
      pelanggan: j.pelanggan.nama,
      status: j.status,
    })),
    ringkas: { paketAktif, karyawanAktif, pelanggan },
  };
}

/** Selisih persen dibanding periode sebelumnya. `null` bila tidak ada pembanding. */
export function deltaPct(now: number, prev: number): number | null {
  if (prev === 0) return now === 0 ? 0 : null;
  return Math.round(((now - prev) / prev) * 1000) / 10;
}

/** Rupiah ringkas untuk sumbu grafik: 1,2 jt, 350 rb. */
export function rpRingkas(n: number): string {
  if (n >= 1_000_000_000) return `${+(n / 1_000_000_000).toFixed(1)} M`;
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)} jt`;
  if (n >= 1_000) return `${+(n / 1_000).toFixed(0)} rb`;
  return String(n);
}
