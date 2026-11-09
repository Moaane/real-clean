import { prisma } from "./prisma";

/**
 * Marks MENUNGGU_PEMBAYARAN bookings past `batas_bayar` as KEDALUWARSA and
 * releases their slot quota (SPEC 6: also done lazily when availability is
 * computed or a booking page is opened). Each booking changes state through a
 * conditional UPDATE, so running this concurrently with the webhook (or with
 * itself) releases the slot exactly once.
 */
export async function kedaluwarsakanLewatBatas(): Promise<number> {
  const due = await prisma.booking.findMany({
    where: { status: "MENUNGGU_PEMBAYARAN", batas_bayar: { lt: new Date() } },
    select: { id_booking: true },
    take: 200,
  });

  let n = 0;
  for (const { id_booking } of due) {
    const done = await prisma.$transaction((tx) => kedaluwarsakanDalamTx(tx, id_booking));
    if (done) n++;
  }
  return n;
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Moves one booking to KEDALUWARSA and frees its slot. Returns false if it was no longer waiting for payment. */
export async function kedaluwarsakanDalamTx(tx: Tx, idBooking: number): Promise<boolean> {
  const changed = await tx.booking.updateMany({
    where: { id_booking: idBooking, status: "MENUNGGU_PEMBAYARAN" },
    data: { status: "KEDALUWARSA" },
  });
  if (changed.count === 0) return false;

  const b = await tx.booking.findUniqueOrThrow({ where: { id_booking: idBooking }, select: { id_slot: true } });
  await tx.jadwalSlot.updateMany({ where: { id_slot: b.id_slot, terisi: { gt: 0 } }, data: { terisi: { decrement: 1 } } });
  await tx.pembayaran.updateMany({ where: { id_booking: idBooking, status_bayar: "pending" }, data: { status_bayar: "expire" } });
  return true;
}
