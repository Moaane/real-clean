import { addDays, nowWib, parseDate } from "./availability";
import { prisma } from "./prisma";

/** Pembayaran yang pernah lunas. Yang sudah direfund berstatus `refund` tetapi tetap tercatat sebagai pemasukan kotor. */
const PERNAH_LUNAS = ["settlement", "refund"] as const;

/** Instan awal hari (00:00 WIB) untuk tanggal "YYYY-MM-DD". */
const awalHariWib = (tanggal: string) => new Date(`${tanggal}T00:00:00+07:00`);

export type RentangLaporan = { dari: string; sampai: string; error?: string };

/** Default: tanggal 1 bulan ini sampai hari ini (WIB). Rentang tidak valid dikembalikan dengan `error`. */
export function parseRentang(dari?: string, sampai?: string): RentangLaporan {
  const { date: hariIni } = nowWib();
  const defDari = `${hariIni.slice(0, 7)}-01`;
  if (!dari && !sampai) return { dari: defDari, sampai: hariIni };
  const d = parseDate(dari ?? defDari);
  const s = parseDate(sampai ?? hariIni);
  const fallback = { dari: defDari, sampai: hariIni };
  if (!d || !s) return { ...fallback, error: "Format tanggal tidak valid." };
  if (d.getTime() > s.getTime()) return { ...fallback, error: "Tanggal awal tidak boleh setelah tanggal akhir." };
  return { dari: d.toISOString().slice(0, 10), sampai: s.toISOString().slice(0, 10) };
}

export type BarisTransaksi = {
  orderId: string;
  kode: string;
  pelanggan: string;
  paket: string;
  metode: string | null;
  waktuBayar: Date;
  jumlah: number;
  direfund: number;
};

export type Laporan = {
  kotor: number;
  refund: number;
  bersih: number;
  jumlahTransaksi: number;
  jumlahRefund: number;
  baris: BarisTransaksi[];
};

/**
 * Pendapatan = pembayaran lunas dengan `waktu_bayar` dalam rentang (WIB, inklusif)
 * dikurangi refund `sukses` yang dibuat dalam rentang yang sama.
 */
export async function getLaporan(dari: string, sampai: string): Promise<Laporan> {
  const gte = awalHariWib(dari);
  const lt = awalHariWib(addDays(sampai, 1));

  const [bayar, refund] = await Promise.all([
    prisma.pembayaran.findMany({
      where: { status_bayar: { in: [...PERNAH_LUNAS] }, waktu_bayar: { gte, lt } },
      orderBy: { waktu_bayar: "desc" },
      select: {
        order_id: true,
        metode_bayar: true,
        jumlah: true,
        waktu_bayar: true,
        booking: { select: { kode_booking: true, pelanggan: { select: { nama: true } }, layanan: { select: { nama_layanan: true } } } },
        refund: { where: { status_refund: "sukses" }, select: { jumlah: true } },
      },
    }),
    prisma.refund.aggregate({
      _sum: { jumlah: true },
      _count: true,
      where: { status_refund: "sukses", created_at: { gte, lt } },
    }),
  ]);

  const kotor = bayar.reduce((a, p) => a + p.jumlah, 0);
  const totalRefund = refund._sum.jumlah ?? 0;
  return {
    kotor,
    refund: totalRefund,
    bersih: kotor - totalRefund,
    jumlahTransaksi: bayar.length,
    jumlahRefund: refund._count,
    baris: bayar.map((p) => ({
      orderId: p.order_id,
      kode: p.booking.kode_booking,
      pelanggan: p.booking.pelanggan.nama,
      paket: p.booking.layanan.nama_layanan,
      metode: p.metode_bayar,
      waktuBayar: p.waktu_bayar!,
      jumlah: p.jumlah,
      direfund: p.refund.reduce((a, r) => a + r.jumlah, 0),
    })),
  };
}

/** Jumlah booking per status untuk slot yang jadwalnya hari ini (WIB). */
export async function getBookingHariIni() {
  const tanggal = parseDate(nowWib().date)!;
  const rows = await prisma.booking.groupBy({ by: ["status"], where: { slot: { tanggal } }, _count: { _all: true } });
  return rows.map((r) => ({ status: r.status, count: r._count._all }));
}
