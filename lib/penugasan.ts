import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";

type Db = Prisma.TransactionClient | typeof prisma;

/** Task statuses that still occupy an employee's time (SPEC 5.2). */
const ACTIVE_BOOKING = ["ASSIGNED", "ON_THE_WAY", "IN_PROGRESS", "AWAITING_VERIFICATION"] as const;

export type ScheduleSlotInfo = { id_booking: number; id_slot: number; date: Date; start_time: string; end_time: string };

/**
 * Active employees with no other assignment overlapping the booking's slot on
 * the same date (SPEC 5.2). Times are "HH:mm" strings, so string comparison is
 * time comparison; slots overlap when start < otherEnd && otherStart < end.
 */
export async function findAvailableStaff(db: Db, b: ScheduleSlotInfo) {
  return db.user.findMany({
    where: {
      role: "staff",
      is_active: true,
      staff_assignments: {
        none: {
          id_booking: { not: b.id_booking },
          booking: {
            status: { in: [...ACTIVE_BOOKING] },
            slot: { date: b.date, start_time: { lt: b.end_time }, end_time: { gt: b.start_time } },
          },
        },
      },
    },
    select: { id_user: true, name: true, phone: true },
    orderBy: { name: "asc" },
  });
}

export type TaskResult = { ok: true; idAssignment: number } | { ok: false; error: string };

/**
 * PAID -> ASSIGNED and creates the assignment row, atomically. The status
 * change is a conditional UPDATE (only from PAID), and a per-employee
 * advisory lock makes the "is this employee free?" check + insert race-free
 * against another admin assigning the same employee at the same time.
 */
export async function assignStaff(input: { idBooking: number; idStaff: number; idAdmin: number }): Promise<TaskResult> {
  return prisma.$transaction(async (tx): Promise<TaskResult> => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${input.idStaff}::bigint)`;

    const b = await tx.booking.findUnique({ where: { id_booking: input.idBooking }, include: { slot: true } });
    if (!b) return { ok: false, error: "Booking tidak ditemukan" };
    if (b.status !== "PAID") return { ok: false, error: "Hanya booking berstatus Dibayar yang bisa ditugaskan" };

    const freeStaff = await findAvailableStaff(tx, {
      id_booking: b.id_booking,
      id_slot: b.id_slot,
      date: b.slot.date,
      start_time: b.slot.start_time,
      end_time: b.slot.end_time,
    });
    if (!freeStaff.some((k) => k.id_user === input.idStaff)) {
      return { ok: false, error: "Karyawan tidak tersedia pada jadwal ini (nonaktif atau jam bentrok)" };
    }

    const changed = await tx.booking.updateMany({
      where: { id_booking: b.id_booking, status: "PAID" },
      data: { status: "ASSIGNED" },
    });
    if (changed.count === 0) return { ok: false, error: "Status booking sudah berubah, muat ulang halaman" };

    const p = await tx.assignment.create({
      data: { id_booking: b.id_booking, id_staff: input.idStaff, id_admin: input.idAdmin, task_status: "assigned" },
      select: { id_assignment: true },
    });
    return { ok: true, idAssignment: p.id_assignment };
  });
}
