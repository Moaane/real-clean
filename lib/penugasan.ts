import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";

type Db = Prisma.TransactionClient | typeof prisma;

/** Task statuses that still occupy an employee's time (SPEC 5.2). */
const BOOKING_AKTIF = ["DITUGASKAN", "DALAM_PERJALANAN", "DIKERJAKAN", "MENUNGGU_VERIFIKASI"] as const;

export type SlotJadwal = { id_booking: number; id_slot: number; tanggal: Date; jam_mulai: string; jam_selesai: string };

/**
 * Active employees with no other assignment overlapping the booking's slot on
 * the same date (SPEC 5.2). Times are "HH:mm" strings, so string comparison is
 * time comparison; slots overlap when start < otherEnd && otherStart < end.
 */
export async function karyawanKosong(db: Db, b: SlotJadwal) {
  return db.user.findMany({
    where: {
      role: "karyawan",
      status_aktif: true,
      penugasan_karyawan: {
        none: {
          id_booking: { not: b.id_booking },
          booking: {
            status: { in: [...BOOKING_AKTIF] },
            slot: { tanggal: b.tanggal, jam_mulai: { lt: b.jam_selesai }, jam_selesai: { gt: b.jam_mulai } },
          },
        },
      },
    },
    select: { id_user: true, nama: true, no_hp: true },
    orderBy: { nama: "asc" },
  });
}

export type HasilTugas = { ok: true; idPenugasan: number } | { ok: false; error: string };

/**
 * DIBAYAR -> DITUGASKAN and creates the penugasan row, atomically. The status
 * change is a conditional UPDATE (only from DIBAYAR), and a per-employee
 * advisory lock makes the "is this employee free?" check + insert race-free
 * against another admin assigning the same employee at the same time.
 */
export async function tugaskanKaryawan(input: { idBooking: number; idKaryawan: number; idAdmin: number }): Promise<HasilTugas> {
  return prisma.$transaction(async (tx): Promise<HasilTugas> => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${input.idKaryawan}::bigint)`;

    const b = await tx.booking.findUnique({ where: { id_booking: input.idBooking }, include: { slot: true } });
    if (!b) return { ok: false, error: "Booking tidak ditemukan" };
    if (b.status !== "DIBAYAR") return { ok: false, error: "Hanya booking berstatus Dibayar yang bisa ditugaskan" };

    const bebas = await karyawanKosong(tx, {
      id_booking: b.id_booking,
      id_slot: b.id_slot,
      tanggal: b.slot.tanggal,
      jam_mulai: b.slot.jam_mulai,
      jam_selesai: b.slot.jam_selesai,
    });
    if (!bebas.some((k) => k.id_user === input.idKaryawan)) {
      return { ok: false, error: "Karyawan tidak tersedia pada jadwal ini (nonaktif atau jam bentrok)" };
    }

    const changed = await tx.booking.updateMany({
      where: { id_booking: b.id_booking, status: "DIBAYAR" },
      data: { status: "DITUGASKAN" },
    });
    if (changed.count === 0) return { ok: false, error: "Status booking sudah berubah, muat ulang halaman" };

    const p = await tx.penugasan.create({
      data: { id_booking: b.id_booking, id_karyawan: input.idKaryawan, id_admin: input.idAdmin, status_tugas: "ditugaskan" },
      select: { id_penugasan: true },
    });
    return { ok: true, idPenugasan: p.id_penugasan };
  });
}
