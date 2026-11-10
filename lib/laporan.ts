import { addDays, nowWib, parseDate } from "./availability";
import { prisma } from "./prisma";

/** Payments that were ever settled. Refunded ones have status `refund` but still count as gross income. */
const EVER_PAID = ["settlement", "refund"] as const;

/** Start-of-day instant (00:00 WIB) for the date "YYYY-MM-DD". */
const wibDayStart = (date: string) => new Date(`${date}T00:00:00+07:00`);

export type ReportRange = { from: string; to: string; error?: string };

/** Default: tanggal 1 bulan ini sampai hari ini (WIB). Rentang tidak valid dikembalikan dengan `error`. */
export function parseDateRange(from?: string, to?: string): ReportRange {
  const { date: today } = nowWib();
  const defaultFrom = `${today.slice(0, 7)}-01`;
  if (!from && !to) return { from: defaultFrom, to: today };
  const d = parseDate(from ?? defaultFrom);
  const s = parseDate(to ?? today);
  const fallback = { from: defaultFrom, to: today };
  if (!d || !s) return { ...fallback, error: "Format tanggal tidak valid." };
  if (d.getTime() > s.getTime()) return { ...fallback, error: "Tanggal awal tidak boleh setelah tanggal akhir." };
  return { from: d.toISOString().slice(0, 10), to: s.toISOString().slice(0, 10) };
}

export type TransactionRow = {
  orderId: string;
  code: string;
  customer: string;
  pkg: string;
  method: string | null;
  paymentTime: Date;
  amount: number;
  refunded: number;
};

export type Report = {
  gross: number;
  refund: number;
  net: number;
  transactionCount: number;
  refundAmount: number;
  rows: TransactionRow[];
};

/**
 * Pendapatan = pembayaran lunas dengan `waktu_bayar` dalam rentang (WIB, inklusif)
 * dikurangi refund `sukses` yang dibuat dalam rentang yang sama.
 */
export async function getReport(from: string, to: string): Promise<Report> {
  const gte = wibDayStart(from);
  const lt = wibDayStart(addDays(to, 1));

  const [pay, refund] = await Promise.all([
    prisma.payment.findMany({
      where: { payment_status: { in: [...EVER_PAID] }, paid_at: { gte, lt } },
      orderBy: { paid_at: "desc" },
      select: {
        order_id: true,
        payment_method: true,
        amount: true,
        paid_at: true,
        booking: { select: { booking_code: true, customer: { select: { name: true } }, service: { select: { service_name: true } } } },
        refund: { where: { refund_status: "success" }, select: { amount: true } },
      },
    }),
    prisma.refund.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { refund_status: "success", created_at: { gte, lt } },
    }),
  ]);

  const gross = pay.reduce((a, p) => a + p.amount, 0);
  const totalRefund = refund._sum.amount ?? 0;
  return {
    gross,
    refund: totalRefund,
    net: gross - totalRefund,
    transactionCount: pay.length,
    refundAmount: refund._count,
    rows: pay.map((p) => ({
      orderId: p.order_id,
      code: p.booking.booking_code,
      customer: p.booking.customer.name,
      pkg: p.booking.service.service_name,
      method: p.payment_method,
      paymentTime: p.paid_at!,
      amount: p.amount,
      refunded: p.refund.reduce((a, r) => a + r.amount, 0),
    })),
  };
}

/** Jumlah booking per status untuk slot yang jadwalnya hari ini (WIB). */
export async function getTodayBookings() {
  const date = parseDate(nowWib().date)!;
  const rows = await prisma.booking.groupBy({ by: ["status"], where: { slot: { date } }, _count: { _all: true } });
  return rows.map((r) => ({ status: r.status, count: r._count._all }));
}
