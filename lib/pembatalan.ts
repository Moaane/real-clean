import { refundTransaksi } from "./midtrans";
import { prisma } from "./prisma";

/** Booking statuses from which a customer may ask to cancel (SPEC 7). */
export const STATUS_BISA_BATAL = ["DIBAYAR", "DITUGASKAN"] as const;

const JAM_REFUND_PENUH = 24;

/** Start of the slot (jam_mulai on its date, WIB). Slot dates are UTC-midnight @db.Date. */
export function mulaiJadwal(tanggal: Date, jamMulai: string) {
  return new Date(`${tanggal.toISOString().slice(0, 10)}T${jamMulai}:00+07:00`);
}

/** SPEC 7: full refund only if the request was made >= 24 hours before the slot starts. */
export function memenuhiSyaratRefund(tanggal: Date, jamMulai: string, diajukanAt: Date) {
  return mulaiJadwal(tanggal, jamMulai).getTime() - diajukanAt.getTime() >= JAM_REFUND_PENUH * 3600_000;
}

export type HasilBatal = { ok: true } | { ok: false; error: string };

/** A request that is waiting for the admin's decision. */
const MENUNGGU_KEPUTUSAN = { batal_diajukan_at: { not: null }, batal_ditolak: false } as const;

/** Customer asks to cancel. One request per booking; only the owner, only DIBAYAR/DITUGASKAN. */
export async function ajukanBatal(input: { idBooking: number; idPelanggan: number; alasan: string }): Promise<HasilBatal> {
  const changed = await prisma.booking.updateMany({
    where: {
      id_booking: input.idBooking,
      id_pelanggan: input.idPelanggan,
      status: { in: [...STATUS_BISA_BATAL] },
      batal_diajukan_at: null,
    },
    data: { alasan_batal: input.alasan, batal_diajukan_at: new Date() },
  });
  if (changed.count === 0) return { ok: false, error: "Booking ini tidak bisa diajukan pembatalan (status berubah atau sudah pernah diajukan)" };
  return { ok: true };
}

/** Admin rejects: status stays as is, the request is marked rejected. */
export async function tolakBatal(idBooking: number): Promise<HasilBatal> {
  const changed = await prisma.booking.updateMany({
    where: { id_booking: idBooking, status: { in: [...STATUS_BISA_BATAL] }, ...MENUNGGU_KEPUTUSAN },
    data: { batal_ditolak: true },
  });
  if (changed.count === 0) return { ok: false, error: "Tidak ada pengajuan batal yang menunggu keputusan" };
  return { ok: true };
}

export type HasilSetujuBatal = { ok: true; idRefund: number; refund: "sukses" | "gagal" } | { ok: false; error: string };

/**
 * Admin approves (SPEC 7). Step 1, one transaction: booking -> DIBATALKAN
 * (conditional UPDATE, so a double click or a concurrent change wins only once),
 * slot released, active tasks cancelled, refund row `diproses` created.
 * Step 2, after commit: Midtrans refund. Success -> refund `sukses`, payment
 * `refund`, booking DIREFUND. Failure -> refund `gagal` with the reason; the
 * booking stays DIBATALKAN. The gateway is only called by the request that won step 1.
 */
export async function setujuiBatal(input: { idBooking: number; idAdmin: number }): Promise<HasilSetujuBatal> {
  const awal = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.findUnique({ where: { id_booking: input.idBooking }, include: { pembayaran: true } });
    if (!b) return { error: "Booking tidak ditemukan" } as const;
    if (!b.pembayaran || b.pembayaran.status_bayar !== "settlement") return { error: "Pembayaran booking ini belum lunas, tidak ada yang bisa direfund" } as const;

    const changed = await tx.booking.updateMany({
      where: { id_booking: b.id_booking, status: { in: [...STATUS_BISA_BATAL] }, ...MENUNGGU_KEPUTUSAN },
      data: { status: "DIBATALKAN" },
    });
    if (changed.count === 0) return { error: "Tidak ada pengajuan batal yang menunggu keputusan (status booking sudah berubah)" } as const;

    await tx.jadwalSlot.updateMany({ where: { id_slot: b.id_slot, terisi: { gt: 0 } }, data: { terisi: { decrement: 1 } } });
    await tx.penugasan.updateMany({
      where: { id_booking: b.id_booking, status_tugas: { notIn: ["selesai", "dibatalkan"] } },
      data: { status_tugas: "dibatalkan" },
    });
    const refund = await tx.refund.create({
      data: { id_pembayaran: b.pembayaran.id_pembayaran, id_admin: input.idAdmin, jumlah: b.pembayaran.jumlah, alasan: b.alasan_batal },
    });
    return { refund, orderId: b.pembayaran.order_id, idPembayaran: b.pembayaran.id_pembayaran } as const;
  });
  if (!awal.refund) return { ok: false, error: awal.error ?? "Pembatalan gagal diproses" };

  const { refund, orderId, idPembayaran } = awal;
  const gw = await refundTransaksi({
    orderId,
    refundKey: `RF-${refund.id_refund}`,
    amount: refund.jumlah,
    reason: refund.alasan ?? "Pembatalan booking",
  });

  if (gw.ok) {
    await prisma.$transaction([
      prisma.refund.update({ where: { id_refund: refund.id_refund }, data: { status_refund: "sukses" } }),
      prisma.pembayaran.update({ where: { id_pembayaran: idPembayaran }, data: { status_bayar: "refund" } }),
      prisma.booking.updateMany({ where: { id_booking: input.idBooking, status: "DIBATALKAN" }, data: { status: "DIREFUND" } }),
    ]);
    return { ok: true, idRefund: refund.id_refund, refund: "sukses" };
  }

  await prisma.refund.update({ where: { id_refund: refund.id_refund }, data: { status_refund: "gagal", pesan_gagal: gw.pesan.slice(0, 500) } });
  return { ok: true, idRefund: refund.id_refund, refund: "gagal" };
}
