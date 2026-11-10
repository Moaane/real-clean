import { head } from "@vercel/blob";
import { slotSudahMulai } from "./availability";
import { prisma } from "./prisma";

export const BUKTI_TIPE = ["image/jpeg", "image/png", "image/webp"];
export const BUKTI_MAKS_BYTE = 5 * 1024 * 1024;
export const BUKTI_MAKS_FILE = 5;

/** Blob pathnames for a task's proof photos always live under this prefix. */
export const prefixBukti = (idPenugasan: number) => `bukti/${idPenugasan}/`;

export type HasilTugas = { ok: true } | { ok: false; error: string };

/** The task row only if it belongs to this employee (SPEC 2: karyawan hanya melihat tugas miliknya). */
export function tugasMilik(idPenugasan: number, idKaryawan: number) {
  return prisma.penugasan.findFirst({
    where: { id_penugasan: idPenugasan, id_karyawan: idKaryawan },
    select: { id_penugasan: true, status_tugas: true, booking: { select: { id_booking: true, status: true, slot: { select: { tanggal: true, jam_mulai: true } } } } },
  });
}

const LANGKAH = {
  DALAM_PERJALANAN: { dari: "DITUGASKAN", tugas: "dalam_perjalanan" },
  DIKERJAKAN: { dari: "DALAM_PERJALANAN", tugas: "dikerjakan" },
} as const;

/**
 * Employee-driven transitions DITUGASKAN -> DALAM_PERJALANAN -> DIKERJAKAN
 * (SPEC 4). The booking update is conditional on the expected source status, so
 * skipped steps and double submits are rejected.
 */
export async function ubahStatusTugas(input: { idPenugasan: number; idKaryawan: number; ke: keyof typeof LANGKAH }): Promise<HasilTugas> {
  const langkah = LANGKAH[input.ke];
  return prisma.$transaction(async (tx): Promise<HasilTugas> => {
    const t = await tx.penugasan.findFirst({
      where: { id_penugasan: input.idPenugasan, id_karyawan: input.idKaryawan },
      select: { id_booking: true, booking: { select: { slot: { select: { tanggal: true, jam_mulai: true } } } } },
    });
    if (!t) return { ok: false, error: "Tugas tidak ditemukan" };
    // Berangkat dan mulai mengerjakan baru bisa dilakukan saat jadwal tiba.
    if (!slotSudahMulai(t.booking.slot.tanggal, t.booking.slot.jam_mulai)) {
      return { ok: false, error: `Belum waktunya, baru bisa dilakukan mulai jam ${t.booking.slot.jam_mulai} WIB sesuai jadwal` };
    }

    const changed = await tx.booking.updateMany({
      where: { id_booking: t.id_booking, status: langkah.dari },
      data: { status: input.ke },
    });
    if (changed.count === 0) return { ok: false, error: "Status tugas tidak sesuai, muat ulang halaman" };

    await tx.penugasan.update({
      where: { id_penugasan: input.idPenugasan },
      data: { status_tugas: langkah.tugas, ...(input.ke === "DIKERJAKAN" ? { mulai_at: new Date() } : {}) },
    });
    return { ok: true };
  });
}

/**
 * DIKERJAKAN -> MENUNGGU_VERIFIKASI with at least one photo. Every pathname is
 * checked to sit under this task's prefix and to exist in the store with an
 * allowed type and size, so a client cannot attach arbitrary blobs.
 */
export async function simpanBukti(input: { idPenugasan: number; idKaryawan: number; pathnames: string[]; keterangan?: string }): Promise<HasilTugas> {
  const pathnames = [...new Set(input.pathnames)];
  if (pathnames.length < 1) return { ok: false, error: "Unggah minimal 1 foto bukti" };
  if (pathnames.length > BUKTI_MAKS_FILE) return { ok: false, error: `Maksimal ${BUKTI_MAKS_FILE} foto` };

  const prefix = prefixBukti(input.idPenugasan);
  if (pathnames.some((p) => !p.startsWith(prefix) || p.includes("..") || p.length > 255)) return { ok: false, error: "Foto tidak valid" };

  const milik = await tugasMilik(input.idPenugasan, input.idKaryawan);
  if (!milik) return { ok: false, error: "Tugas tidak ditemukan" };
  if (milik.booking.status !== "DIKERJAKAN") return { ok: false, error: "Bukti hanya bisa diunggah saat status Sedang dikerjakan" };

  if (!slotSudahMulai(milik.booking.slot.tanggal, milik.booking.slot.jam_mulai)) {
    return { ok: false, error: `Pekerjaan belum bisa diselesaikan sebelum jadwal dimulai (${milik.booking.slot.jam_mulai} WIB)` };
  }

  try {
    for (const p of pathnames) {
      const info = await head(p);
      if (!BUKTI_TIPE.includes(info.contentType) || info.size > BUKTI_MAKS_BYTE) return { ok: false, error: "Foto harus JPG, PNG, atau WebP maksimal 5 MB" };
    }
  } catch {
    return { ok: false, error: "Foto belum terunggah, coba lagi" };
  }

  return prisma.$transaction(async (tx): Promise<HasilTugas> => {
    const changed = await tx.booking.updateMany({
      where: { id_booking: milik.booking.id_booking, status: "DIKERJAKAN" },
      data: { status: "MENUNGGU_VERIFIKASI" },
    });
    if (changed.count === 0) return { ok: false, error: "Status tugas sudah berubah, muat ulang halaman" };

    await tx.buktiKerja.createMany({
      data: pathnames.map((p) => ({ id_penugasan: input.idPenugasan, foto_url: p, keterangan: input.keterangan || null })),
    });
    await tx.penugasan.update({
      where: { id_penugasan: input.idPenugasan },
      data: { status_tugas: "menunggu_verifikasi", selesai_at: new Date() },
    });
    return { ok: true };
  });
}

/**
 * MENUNGGU_VERIFIKASI -> SELESAI (admin setuju) or back to DIKERJAKAN with a
 * required revision note (SPEC 4). Both are conditional on the current status.
 */
export async function verifikasiHasil(input: { idBooking: number; setuju: true } | { idBooking: number; setuju: false; catatan: string }): Promise<HasilTugas> {
  return prisma.$transaction(async (tx): Promise<HasilTugas> => {
    const t = await tx.penugasan.findFirst({ where: { id_booking: input.idBooking }, orderBy: { ditugaskan_at: "desc" }, select: { id_penugasan: true } });
    if (!t) return { ok: false, error: "Penugasan tidak ditemukan" };

    const changed = await tx.booking.updateMany({
      where: { id_booking: input.idBooking, status: "MENUNGGU_VERIFIKASI" },
      data: { status: input.setuju ? "SELESAI" : "DIKERJAKAN" },
    });
    if (changed.count === 0) return { ok: false, error: "Hanya booking berstatus Menunggu verifikasi yang bisa diverifikasi" };

    await tx.penugasan.update({
      where: { id_penugasan: t.id_penugasan },
      data: input.setuju ? { status_tugas: "selesai", selesai_at: new Date() } : { status_tugas: "revisi", catatan_revisi: input.catatan, selesai_at: null },
    });
    return { ok: true };
  });
}
