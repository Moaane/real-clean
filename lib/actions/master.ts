"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireRole } from "@/lib/auth";
import { formValues, type FormState } from "@/lib/form-state";
import { prisma } from "@/lib/prisma";

// Every action re-checks the role: server actions are reachable by direct POST.

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const rupiah = (label: string) =>
  z.coerce
    .number({ error: `${label} harus berupa angka` })
    .int(`${label} harus bilangan bulat`)
    .min(1, `${label} harus lebih dari 0`)
    .max(1_000_000_000, `${label} terlalu besar`);
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

const layananSchema = z.object({
  nama_layanan: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  deskripsi: z.string().trim().max(2000).optional(),
  harga: rupiah("Harga"),
  durasi_menit: z.coerce
    .number({ error: "Durasi harus berupa angka" })
    .int("Durasi harus bilangan bulat")
    .min(15, "Durasi minimal 15 menit")
    .max(1440, "Durasi maksimal 1440 menit"),
});

function layananData(formData: FormData) {
  const parsed = layananSchema.safeParse({
    nama_layanan: String(formData.get("nama_layanan") ?? ""),
    deskripsi: String(formData.get("deskripsi") ?? ""),
    harga: String(formData.get("harga") ?? ""),
    durasi_menit: String(formData.get("durasi_menit") ?? ""),
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
  await prisma.layanan.create({ data: r.data });
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
  await prisma.layanan.update({ where: { id_layanan: parseId(id) }, data: r.data });
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

/* ----------------------------------- Kamar ---------------------------------- */

const kamarSchema = z.object({
  nomor_kamar: z.string().trim().min(1, "Nomor kamar wajib diisi").max(10),
  tipe_kamar: z.string().trim().min(2, "Tipe minimal 2 karakter").max(50),
  fasilitas: z.string().trim().max(2000).optional(),
  harga_per_bulan: rupiah("Harga per bulan"),
  status_kamar: z.enum(["tersedia", "terisi", "perawatan"], {
    error: "Status tidak valid",
  }),
});

function kamarData(formData: FormData) {
  const parsed = kamarSchema.safeParse({
    nomor_kamar: String(formData.get("nomor_kamar") ?? ""),
    tipe_kamar: String(formData.get("tipe_kamar") ?? ""),
    fasilitas: String(formData.get("fasilitas") ?? ""),
    harga_per_bulan: String(formData.get("harga_per_bulan") ?? ""),
    status_kamar: String(formData.get("status_kamar") ?? ""),
  });
  if (!parsed.success) return { error: fail(parsed.error, formData) } as const;
  return { data: { ...parsed.data, fasilitas: parsed.data.fasilitas || null } } as const;
}

const nomorGanda = (formData: FormData): FormState => ({
  fieldErrors: { nomor_kamar: ["Nomor kamar sudah dipakai"] },
  values: formValues(formData),
});

export async function createKamar(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");
  const r = kamarData(formData);
  if (r.error) return r.error;
  try {
    await prisma.kamar.create({ data: r.data });
  } catch (e) {
    if (isUniqueViolation(e)) return nomorGanda(formData);
    throw e;
  }
  revalidatePath("/admin/kamar");
  redirect("/admin/kamar");
}

export async function updateKamar(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");
  const r = kamarData(formData);
  if (r.error) return r.error;
  try {
    await prisma.kamar.update({ where: { id_kamar: parseId(id) }, data: r.data });
  } catch (e) {
    if (isUniqueViolation(e)) return nomorGanda(formData);
    throw e;
  }
  revalidatePath("/admin/kamar");
  redirect("/admin/kamar");
}

export async function deleteKamar(formData: FormData) {
  await requireRole("admin");
  const id = parseId(Number(formData.get("id")));
  try {
    await prisma.kamar.delete({ where: { id_kamar: id } });
  } catch (e) {
    if (isForeignKeyViolation(e)) {
      redirect("/admin/kamar?error=dipakai");
    }
    throw e;
  }
  revalidatePath("/admin/kamar");
  redirect("/admin/kamar");
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

export async function createJam(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");
  const r = jamData(formData);
  if (r.error) return r.error;
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
