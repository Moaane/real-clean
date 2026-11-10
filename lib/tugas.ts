import { head } from "@vercel/blob";
import { slotStarted } from "./availability";
import { prisma } from "./prisma";

export const PROOF_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PROOF_MAX_BYTES = 5 * 1024 * 1024;
export const PROOF_MAX_FILES = 5;

/** Blob pathnames for a task's proof photos always live under this prefix. */
export const proofPrefix = (idAssignment: number) => `bukti/${idAssignment}/`;

export type TaskResult = { ok: true } | { ok: false; error: string };

/** The task row only if it belongs to this employee (SPEC 2: karyawan hanya melihat tugas miliknya). */
export function ownTask(idAssignment: number, idStaff: number) {
  return prisma.assignment.findFirst({
    where: { id_assignment: idAssignment, id_staff: idStaff },
    select: { id_assignment: true, task_status: true, booking: { select: { id_booking: true, status: true, slot: { select: { date: true, start_time: true } } } } },
  });
}

const STATUS_STEPS = {
  ON_THE_WAY: { from: "ASSIGNED", task: "on_the_way" },
  IN_PROGRESS: { from: "ON_THE_WAY", task: "in_progress" },
} as const;

/**
 * Employee-driven transitions DITUGASKAN -> DALAM_PERJALANAN -> DIKERJAKAN
 * (SPEC 4). The booking update is conditional on the expected source status, so
 * skipped steps and double submits are rejected.
 */
export async function changeTaskStatus(input: { idAssignment: number; idStaff: number; toStatus: keyof typeof STATUS_STEPS }): Promise<TaskResult> {
  const transition = STATUS_STEPS[input.toStatus];
  return prisma.$transaction(async (tx): Promise<TaskResult> => {
    const t = await tx.assignment.findFirst({
      where: { id_assignment: input.idAssignment, id_staff: input.idStaff },
      select: { id_booking: true, booking: { select: { slot: { select: { date: true, start_time: true } } } } },
    });
    if (!t) return { ok: false, error: "Tugas tidak ditemukan" };
    // Berangkat dan mulai mengerjakan baru bisa dilakukan saat jadwal tiba.
    if (!slotStarted(t.booking.slot.date, t.booking.slot.start_time)) {
      return { ok: false, error: `Belum waktunya, baru bisa dilakukan mulai jam ${t.booking.slot.start_time} WIB sesuai jadwal` };
    }

    const changed = await tx.booking.updateMany({
      where: { id_booking: t.id_booking, status: transition.from },
      data: { status: input.toStatus },
    });
    if (changed.count === 0) return { ok: false, error: "Status tugas tidak sesuai, muat ulang halaman" };

    await tx.assignment.update({
      where: { id_assignment: input.idAssignment },
      data: { task_status: transition.task, ...(input.toStatus === "IN_PROGRESS" ? { started_at: new Date() } : {}) },
    });
    return { ok: true };
  });
}

/**
 * DIKERJAKAN -> MENUNGGU_VERIFIKASI with at least one photo. Every pathname is
 * checked to sit under this task's prefix and to exist in the store with an
 * allowed type and size, so a client cannot attach arbitrary blobs.
 */
export async function saveProof(input: { idAssignment: number; idStaff: number; pathnames: string[]; remarks?: string }): Promise<TaskResult> {
  const pathnames = [...new Set(input.pathnames)];
  if (pathnames.length < 1) return { ok: false, error: "Unggah minimal 1 foto bukti" };
  if (pathnames.length > PROOF_MAX_FILES) return { ok: false, error: `Maksimal ${PROOF_MAX_FILES} foto` };

  const prefix = proofPrefix(input.idAssignment);
  if (pathnames.some((p) => !p.startsWith(prefix) || p.includes("..") || p.length > 255)) return { ok: false, error: "Foto tidak valid" };

  const owned = await ownTask(input.idAssignment, input.idStaff);
  if (!owned) return { ok: false, error: "Tugas tidak ditemukan" };
  if (owned.booking.status !== "IN_PROGRESS") return { ok: false, error: "Bukti hanya bisa diunggah saat status Sedang dikerjakan" };

  if (!slotStarted(owned.booking.slot.date, owned.booking.slot.start_time)) {
    return { ok: false, error: `Pekerjaan belum bisa diselesaikan sebelum jadwal dimulai (${owned.booking.slot.start_time} WIB)` };
  }

  try {
    for (const p of pathnames) {
      const info = await head(p);
      if (!PROOF_TYPES.includes(info.contentType) || info.size > PROOF_MAX_BYTES) return { ok: false, error: "Foto harus JPG, PNG, atau WebP maksimal 5 MB" };
    }
  } catch {
    return { ok: false, error: "Foto belum terunggah, coba lagi" };
  }

  return prisma.$transaction(async (tx): Promise<TaskResult> => {
    const changed = await tx.booking.updateMany({
      where: { id_booking: owned.booking.id_booking, status: "IN_PROGRESS" },
      data: { status: "AWAITING_VERIFICATION" },
    });
    if (changed.count === 0) return { ok: false, error: "Status tugas sudah berubah, muat ulang halaman" };

    await tx.workProof.createMany({
      data: pathnames.map((p) => ({ id_assignment: input.idAssignment, photo_url: p, remarks: input.remarks || null })),
    });
    await tx.assignment.update({
      where: { id_assignment: input.idAssignment },
      data: { task_status: "awaiting_verification", completed_at: new Date() },
    });
    return { ok: true };
  });
}

/**
 * MENUNGGU_VERIFIKASI -> SELESAI (admin setuju) or back to DIKERJAKAN with a
 * required revision note (SPEC 4). Both are conditional on the current status.
 */
export async function verificationResult(input: { idBooking: number; approved: true } | { idBooking: number; approved: false; notes: string }): Promise<TaskResult> {
  return prisma.$transaction(async (tx): Promise<TaskResult> => {
    const t = await tx.assignment.findFirst({ where: { id_booking: input.idBooking }, orderBy: { assigned_at: "desc" }, select: { id_assignment: true } });
    if (!t) return { ok: false, error: "Penugasan tidak ditemukan" };

    const changed = await tx.booking.updateMany({
      where: { id_booking: input.idBooking, status: "AWAITING_VERIFICATION" },
      data: { status: input.approved ? "COMPLETED" : "IN_PROGRESS" },
    });
    if (changed.count === 0) return { ok: false, error: "Hanya booking berstatus Menunggu verifikasi yang bisa diverifikasi" };

    await tx.assignment.update({
      where: { id_assignment: t.id_assignment },
      data: input.approved ? { task_status: "completed", completed_at: new Date() } : { task_status: "revision", revision_notes: input.notes, completed_at: null },
    });
    return { ok: true };
  });
}
