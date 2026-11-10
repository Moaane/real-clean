import type { BookingStatus } from "@/generated/prisma/enums";
import { prisma } from "./prisma";
import { nowWib } from "./availability";
import { getTodayBookings } from "./laporan";

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
/** Statuses counted as confirmed value (paid and not cancelled). */
const CONFIRMED: BookingStatus[] = [
  "PAID",
  "ASSIGNED",
  "ON_THE_WAY",
  "IN_PROGRESS",
  "AWAITING_VERIFICATION",
  "COMPLETED",
];

type Bucket = { label: string; start: number; end: number };

const fmt = (ms: number, o: Intl.DateTimeFormatOptions) =>
  new Date(ms + WIB).toLocaleDateString("id-ID", { ...o, timeZone: "UTC" });

/** Time bucket in WIB; `start`/`end` are UTC instants (ms). */
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
  value: { total: number; prev: number; series: Point[] };
  /** Net revenue: settled payments in the range minus successful refunds (same as the Report page). */
  revenue: number;
  today: { status: BookingStatus; count: number }[];
  status: { status: BookingStatus; count: number }[];
  topServices: { name: string; count: number }[];
  needsAction: { unassigned: number; awaitingVerification: number; awaitingPayment: number };
  occupancy: { filled: number; quota: number };
  todaySchedule: {
    id: number;
    code: string;
    timeSlot: string;
    pkg: string;
    customer: string;
    status: BookingStatus;
  }[];
  compact: { activePkg: number; activeStaff: number; customer: number };
};

export async function getDashboard(range: Range): Promise<Dashboard> {
  const buckets = buildBuckets(range);
  const start = buckets[0].start;
  const end = buckets[buckets.length - 1].end;
  const prevStart = start - (end - start);
  const wibNow = nowWib();
  const todayDate = new Date(`${wibNow.date}T00:00:00.000Z`);

  const [rows, settled, refunded, today, activePkg, activeStaff, customer, unassigned, awaitingVerification, awaitingPayment, todaySlots, activeHours, schedule] =
    await Promise.all([
      prisma.booking.findMany({
        where: { created_at: { gte: new Date(prevStart), lt: new Date(end) } },
        select: { created_at: true, total_price: true, status: true, service: { select: { service_name: true } } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { payment_status: { in: ["settlement", "refund"] }, paid_at: { gte: new Date(start), lt: new Date(end) } },
      }),
      prisma.refund.aggregate({
        _sum: { amount: true },
        where: { refund_status: "success", created_at: { gte: new Date(start), lt: new Date(end) } },
      }),
      getTodayBookings(),
      prisma.service.count({ where: { is_active: true } }),
      prisma.user.count({ where: { role: "staff", is_active: true } }),
      prisma.user.count({ where: { role: "customer" } }),
      prisma.booking.count({ where: { status: "PAID" } }),
      prisma.booking.count({ where: { status: "AWAITING_VERIFICATION" } }),
      prisma.booking.count({ where: { status: "PENDING_PAYMENT", payment_deadline: { gt: new Date() } } }),
      prisma.scheduleSlot.aggregate({ _sum: { filled: true }, where: { date: todayDate } }),
      prisma.operatingHour.aggregate({ _sum: { quota: true }, where: { active: true } }),
      prisma.booking.findMany({
        where: { slot: { date: todayDate }, status: { in: CONFIRMED.filter((s) => s !== "COMPLETED") } },
        orderBy: { slot: { start_time: "asc" } },
        select: {
          id_booking: true,
          booking_code: true,
          status: true,
          service: { select: { service_name: true } },
          slot: { select: { start_time: true, end_time: true } },
          customer: { select: { name: true } },
        },
      }),
    ]);

  const bookingSeries: Point[] = buckets.map((b) => ({ label: b.label, value: 0 }));
  const valueSeries: Point[] = buckets.map((b) => ({ label: b.label, value: 0 }));
  let bookingPrev = 0;
  let prevValue = 0;
  const statusMap = new Map<BookingStatus, number>();
  const serviceMap = new Map<string, number>();

  for (const r of rows) {
    const t = r.created_at.getTime();
    const confirmAction = CONFIRMED.includes(r.status);
    if (t < start) {
      bookingPrev++;
      if (confirmAction) prevValue += r.total_price;
      continue;
    }
    const i = buckets.findIndex((b) => t >= b.start && t < b.end);
    if (i < 0) continue;
    bookingSeries[i].value++;
    if (confirmAction) valueSeries[i].value += r.total_price;
    statusMap.set(r.status, (statusMap.get(r.status) ?? 0) + 1);
    serviceMap.set(r.service.service_name, (serviceMap.get(r.service.service_name) ?? 0) + 1);
  }

  const sum = (s: Point[]) => s.reduce((a, p) => a + p.value, 0);

  return {
    range,
    updatedAt: wibNow.time,
    booking: { total: sum(bookingSeries), prev: bookingPrev, series: bookingSeries },
    value: { total: sum(valueSeries), prev: prevValue, series: valueSeries },
    revenue: (settled._sum.amount ?? 0) - (refunded._sum.amount ?? 0),
    today,
    status: [...statusMap].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
    topServices: [...serviceMap].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
    needsAction: { unassigned, awaitingVerification, awaitingPayment },
    occupancy: { filled: todaySlots._sum.filled ?? 0, quota: activeHours._sum.quota ?? 0 },
    todaySchedule: schedule.map((j) => ({
      id: j.id_booking,
      code: j.booking_code,
      timeSlot: `${j.slot.start_time}–${j.slot.end_time}`,
      pkg: j.service.service_name,
      customer: j.customer.name,
      status: j.status,
    })),
    compact: { activePkg, activeStaff, customer },
  };
}

/** Selisih persen dibanding periode sebelumnya. `null` bila tidak ada pembanding. */
export function deltaPct(now: number, prev: number): number | null {
  if (prev === 0) return now === 0 ? 0 : null;
  return Math.round(((now - prev) / prev) * 1000) / 10;
}

/** Rupiah ringkas untuk sumbu grafik: 1,2 jt, 350 rb. */
export function compactRp(n: number): string {
  if (n >= 1_000_000_000) return `${+(n / 1_000_000_000).toFixed(1)} M`;
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)} jt`;
  if (n >= 1_000) return `${+(n / 1_000).toFixed(0)} rb`;
  return String(n);
}
