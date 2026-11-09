"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireRole } from "@/lib/auth";
import { formValues, type FormState } from "@/lib/form-state";
import { durasiLabel, panjangSlotMenit } from "@/lib/harga";
import { prisma } from "@/lib/prisma";

// Every action re-checks the role: server actions are reachable by direct POST.

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const checkbox = (formData: FormData, name: string) => formData.get(name) === "on";

function fail(error: z.ZodError, formData: FormData): FormState {
  return {
    fieldErrors: z.flattenError(error).fieldErrors,
    values: formValues(formData),
  };
}

function isUniqueViolation(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

function isForeignKeyViolation(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003";
}

function parseId(id: number) {
  if (!Number.isInteger(id) || id < 1) throw new Error("ID tidak valid");
  return id;
}

/* ---------------------------------- Layanan --------------------------------- */

const nonNegatif = (label: string, max: number) =>
  z.coerce
    .number({ error: `${label} harus berupa angka` })
    .int(`${label} harus bilangan bulat`)
    .min(0, `${label} tidak boleh negatif`)
    .max(max, `${label} terlalu besar`);

const jumlahKamar = (label: string) =>
  z.coerce
    .number({ error: `${label} harus berupa angka` })
    .int(`${label} harus bilangan bulat`)
    .min(1, `${label} minimal 1`)
    .max(200, `${label} maksimal 200`);

// Harga per kamar (SPEC 1): total = harga_dasar + harga_per_kamar × jumlah_kamar.
const layananSchema = z
  .object({
    nama_layanan: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
    deskripsi: z.string().trim().max(2000).optional(),
    jenis_properti: z.enum(["rumah", "kos"], { error: "Jenis properti tidak valid" }),
    tingkat_detail: z.enum(["reguler", "detail", "deep"], { error: "Tingkat detail tidak valid" }),
    harga_dasar: nonNegatif("Harga dasar", 100_000_000),
    harga_per_kamar: nonNegatif("Harga per kamar", 10_000_000),
    durasi_dasar_menit: nonNegatif("Durasi dasar", 1440),
    durasi_per_kamar_menit: nonNegatif("Durasi per kamar", 1440),
    min_kamar: jumlahKamar("Kamar minimal"),
    max_kamar: jumlahKamar("Kamar maksimal"),
  })
  .refine((v) => v.max_kamar >= v.min_kamar, {
    path: ["max_kamar"],
    message: "Kamar maksimal tidak boleh kurang dari kamar minimal",
  })
  .refine((v) => v.harga_dasar + v.harga_per_kamar * v.min_kamar > 0, {
    path: ["harga_dasar"],
    message: "Total harga untuk kamar minimal harus lebih dari 0",
  })
  .refine((v) => v.durasi_dasar_menit + v.durasi_per_kamar_menit * v.min_kamar >= 15, {
    path: ["durasi_dasar_menit"],
    message: "Durasi untuk kamar minimal paling sedikit 15 menit",
  });

/**
 * A package whose duration at max_kamar is longer than every active operating
 * slot could never be booked at that size, so it is rejected here (SPEC 5.1).
 * Skipped while no operating hour is active (nothing to compare against yet).
 */
async function cekDurasiMuatSlot(
  d: { durasi_dasar_menit: number; durasi_per_kamar_menit: number; max_kamar: number },
  formData: FormData,
): Promise<FormState | null> {
  const jam = await prisma.jamOperasional.findMany({ where: { aktif: true }, select: { jam_mulai: true, jam_selesai: true } });
  if (jam.length === 0) return null;
  const terpanjang = Math.max(...jam.map((j) => panjangSlotMenit(j.jam_mulai, j.jam_selesai)));
  const durasi = d.durasi_dasar_menit + d.durasi_per_kamar_menit * d.max_kamar;
  if (durasi <= terpanjang) return null;
  return {
    fieldErrors: {
      max_kamar: [
        `Pada ${d.max_kamar} kamar durasinya ${durasiLabel(durasi)}, melebihi slot jam operasional aktif terpanjang (${durasiLabel(terpanjang)}). Kurangi kamar maksimal atau durasi per kamar.`,
      ],
    },
    values: formValues(formData),
  };
}

const paketSudahAda = (formData: FormData): FormState => ({
  fieldErrors: { tingkat_detail: ["Paket untuk jenis properti dan tingkat detail ini sudah ada. Ubah paket yang ada."] },
  values: formValues(formData),
});

function layananData(formData: FormData) {
  const parsed = layananSchema.safeParse({
    nama_layanan: String(formData.get("nama_layanan") ?? ""),
    deskripsi: String(formData.get("deskripsi") ?? ""),
    jenis_properti: String(formData.get("jenis_properti") ?? ""),
    tingkat_detail: String(formData.get("tingkat_detail") ?? ""),
    harga_dasar: String(formData.get("harga_dasar") ?? ""),
    harga_per_kamar: String(formData.get("harga_per_kamar") ?? ""),
    durasi_dasar_menit: String(formData.get("durasi_dasar_menit") ?? ""),
    durasi_per_kamar_menit: String(formData.get("durasi_per_kamar_menit") ?? ""),
    min_kamar: String(formData.get("min_kamar") ?? ""),
    max_kamar: String(formData.get("max_kamar") ?? ""),
  });
  if (!parsed.success) return { error: fail(parsed.error, formData) } as const;
  return {
    data: {
      ...parsed.data,
      deskripsi: parsed.data.deskripsi || null,
      status_aktif: checkbox(formData, "status_aktif"),
    },
  } as const;
}

export async function createLayanan(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");
  const r = layananData(formData);
  if (r.error) return r.error;
  const kebesaran = await cekDurasiMuatSlot(r.data, formData);
  if (kebesaran) return kebesaran;
  try {
    await prisma.layanan.create({ data: r.data });
  } catch (e) {
    if (isUniqueViolation(e)) return paketSudahAda(formData);
    throw e;
  }
  revalidatePath("/admin/layanan");
  redirect("/admin/layanan");
}

export async function updateLayanan(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");
  const r = layananData(formData);
  if (r.error) return r.error;
  const kebesaran = await cekDurasiMuatSlot(r.data, formData);
  if (kebesaran) return kebesaran;
  try {
    await prisma.layanan.update({ where: { id_layanan: parseId(id) }, data: r.data });
  } catch (e) {
    if (isUniqueViolation(e)) return paketSudahAda(formData);
    throw e;
  }
  revalidatePath("/admin/layanan");
  redirect("/admin/layanan");
}

export async function deleteLayanan(formData: FormData) {
  await requireRole("admin");
  const id = parseId(Number(formData.get("id")));
  try {
    await prisma.layanan.delete({ where: { id_layanan: id } });
  } catch (e) {
    // Already used by bookings: keep history, ask the admin to deactivate instead.
    if (isForeignKeyViolation(e)) {
      redirect("/admin/layanan?error=dipakai");
    }
    throw e;
  }
  revalidatePath("/admin/layanan");
  redirect("/admin/layanan");
}

/* ------------------------------ Jam operasional ----------------------------- */

const jamSchema = z
  .object({
    jam_mulai: z.string().regex(HHMM, "Format jam HH:mm"),
    jam_selesai: z.string().regex(HHMM, "Format jam HH:mm"),
    kuota: z.coerce
      .number({ error: "Kuota harus berupa angka" })
      .int("Kuota harus bilangan bulat")
      .min(1, "Kuota minimal 1")
      .max(100, "Kuota maksimal 100"),
  })
  .refine((v) => v.jam_selesai > v.jam_mulai, {
    path: ["jam_selesai"],
    message: "Jam selesai harus setelah jam mulai",
  });

function jamData(formData: FormData) {
  const parsed = jamSchema.safeParse({
    jam_mulai: String(formData.get("jam_mulai") ?? ""),
    jam_selesai: String(formData.get("jam_selesai") ?? ""),
    kuota: String(formData.get("kuota") ?? ""),
  });
  if (!parsed.success) return { error: fail(parsed.error, formData) } as const;
  return { data: { ...parsed.data, aktif: checkbox(formData, "aktif") } } as const;
}

const jamGanda = (formData: FormData): FormState => ({
  fieldErrors: { jam_mulai: ["Jam operasional ini sudah ada"] },
  values: formValues(formData),
});

// A slot is keyed by (date, jam_mulai), so two templates sharing a start time
// would fight over the same slot row.
async function jamMulaiDipakai(jamMulai: string, exceptId?: number) {
  const dup = await prisma.jamOperasional.findFirst({
    where: { jam_mulai: jamMulai, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  });
  return dup !== null;
}

const jamMulaiGanda = (formData: FormData): FormState => ({
  fieldErrors: { jam_mulai: ["Jam mulai ini sudah dipakai jam operasional lain"] },
  values: formValues(formData),
});

export async function createJam(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");
  const r = jamData(formData);
  if (r.error) return r.error;
  if (await jamMulaiDipakai(r.data.jam_mulai)) return jamMulaiGanda(formData);
  try {
    await prisma.jamOperasional.create({ data: r.data });
  } catch (e) {
    if (isUniqueViolation(e)) return jamGanda(formData);
    throw e;
  }
  revalidatePath("/admin/jam");
  redirect("/admin/jam");
}

export async function updateJam(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");
  const r = jamData(formData);
  if (r.error) return r.error;
  if (await jamMulaiDipakai(r.data.jam_mulai, parseId(id))) return jamMulaiGanda(formData);
  try {
    await prisma.jamOperasional.update({ where: { id: parseId(id) }, data: r.data });
  } catch (e) {
    if (isUniqueViolation(e)) return jamGanda(formData);
    throw e;
  }
  revalidatePath("/admin/jam");
  redirect("/admin/jam");
}

// Safe to hard-delete: bookings copy the time into jadwal_slot, they don't
// reference this template table.
export async function deleteJam(formData: FormData) {
  await requireRole("admin");
  const id = parseId(Number(formData.get("id")));
  await prisma.jamOperasional.delete({ where: { id } });
  revalidatePath("/admin/jam");
  redirect("/admin/jam");
}

/* --------------------------------- Karyawan --------------------------------- */

const karyawanBase = {
  nama: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  email: z.email("Email tidak valid").trim().toLowerCase().max(100),
  no_hp: z
    .string()
    .trim()
    .regex(/^(\+62|62|0)8\d{7,12}$/, "No. HP tidak valid (contoh: 08123456789)"),
};
const passwordBaru = z.string().min(8, "Password minimal 8 karakter").max(72);

const emailGanda = (formData: FormData): FormState => ({
  fieldErrors: { email: ["Email sudah terdaftar"] },
  values: formValues(formData),
});

export async function createKaryawan(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");
  const parsed = z
    .object({ ...karyawanBase, password: passwordBaru })
    .safeParse({
      nama: String(formData.get("nama") ?? ""),
      email: String(formData.get("email") ?? ""),
      no_hp: String(formData.get("no_hp") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
  if (!parsed.success) return fail(parsed.error, formData);

  const { password, ...rest } = parsed.data;
  try {
    await prisma.user.create({
      data: {
        ...rest,
        role: "karyawan", // this form can only ever create staff
        status_aktif: checkbox(formData, "status_aktif"),
        password: await bcrypt.hash(password, 10),
      },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return emailGanda(formData);
    throw e;
  }
  revalidatePath("/admin/karyawan");
  redirect("/admin/karyawan");
}

export async function updateKaryawan(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");
  const parsed = z
    .object({ ...karyawanBase, password: passwordBaru.or(z.literal("")) })
    .safeParse({
      nama: String(formData.get("nama") ?? ""),
      email: String(formData.get("email") ?? ""),
      no_hp: String(formData.get("no_hp") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
  if (!parsed.success) return fail(parsed.error, formData);

  const { password, ...rest } = parsed.data;
  try {
    // Scoped to role karyawan so this can never edit an admin or customer.
    const res = await prisma.user.updateMany({
      where: { id_user: parseId(id), role: "karyawan" },
      data: {
        ...rest,
        status_aktif: checkbox(formData, "status_aktif"),
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      },
    });
    if (res.count === 0) throw new Error("Karyawan tidak ditemukan");
  } catch (e) {
    if (isUniqueViolation(e)) return emailGanda(formData);
    throw e;
  }
  revalidatePath("/admin/karyawan");
  redirect("/admin/karyawan");
}

export async function toggleKaryawan(formData: FormData) {
  await requireRole("admin");
  const id = parseId(Number(formData.get("id")));
  const aktif = formData.get("aktif") === "true";
  await prisma.user.updateMany({
    where: { id_user: id, role: "karyawan" },
    data: { status_aktif: aktif },
  });
  revalidatePath("/admin/karyawan");
}
