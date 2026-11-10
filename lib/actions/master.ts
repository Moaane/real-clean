"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireRole } from "@/lib/auth";
import { formValues, type FormState } from "@/lib/form-state";
import { durationLabel, slotLengthMinutes } from "@/lib/harga";
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

/* ---------------------------------- Service --------------------------------- */

const nonNegative = (label: string, max: number) =>
  z.coerce
    .number({ error: `${label} harus berupa angka` })
    .int(`${label} harus bilangan bulat`)
    .min(0, `${label} tidak boleh negatif`)
    .max(max, `${label} terlalu besar`);

const roomCount = (label: string) =>
  z.coerce
    .number({ error: `${label} harus berupa angka` })
    .int(`${label} harus bilangan bulat`)
    .min(1, `${label} minimal 1`)
    .max(200, `${label} maksimal 200`);

// Harga per kamar (SPEC 1): total = harga_dasar + harga_per_kamar × jumlah_kamar.
const serviceSchema = z
  .object({
    service_name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
    description: z.string().trim().max(2000).optional(),
    property_type: z.enum(["house", "boarding_house"], { error: "Jenis properti tidak valid" }),
    detail_level: z.enum(["regular", "detailed", "deep"], { error: "Tingkat detail tidak valid" }),
    base_price: nonNegative("Harga dasar", 100_000_000),
    price_per_room: nonNegative("Harga per kamar", 10_000_000),
    base_duration_minutes: nonNegative("Durasi dasar", 1440),
    duration_per_room_minutes: nonNegative("Durasi per kamar", 1440),
    min_rooms: roomCount("Kamar minimal"),
    max_rooms: roomCount("Kamar maksimal"),
  })
  .refine((v) => v.max_rooms >= v.min_rooms, {
    path: ["max_rooms"],
    message: "Kamar maksimal tidak boleh kurang dari kamar minimal",
  })
  .refine((v) => v.base_price + v.price_per_room * v.min_rooms > 0, {
    path: ["base_price"],
    message: "Total harga untuk kamar minimal harus lebih dari 0",
  })
  .refine((v) => v.base_duration_minutes + v.duration_per_room_minutes * v.min_rooms >= 15, {
    path: ["base_duration_minutes"],
    message: "Durasi untuk kamar minimal paling sedikit 15 menit",
  });

/**
 * A package whose duration at max_kamar is longer than every active operating
 * slot could never be booked at that size, so it is rejected here (SPEC 5.1).
 * Skipped while no operating hour is active (nothing to compare against yet).
 */
async function checkDurationFitsSlot(
  d: { base_duration_minutes: number; duration_per_room_minutes: number; max_rooms: number },
  formData: FormData,
): Promise<FormState | null> {
  const timeSlot = await prisma.operatingHour.findMany({ where: { active: true }, select: { start_time: true, end_time: true } });
  if (timeSlot.length === 0) return null;
  const longest = Math.max(...timeSlot.map((j) => slotLengthMinutes(j.start_time, j.end_time)));
  const duration = d.base_duration_minutes + d.duration_per_room_minutes * d.max_rooms;
  if (duration <= longest) return null;
  return {
    fieldErrors: {
      max_rooms: [
        `Pada ${d.max_rooms} kamar durasinya ${durationLabel(duration)}, melebihi slot jam operasional aktif terpanjang (${durationLabel(longest)}). Kurangi kamar maksimal atau durasi per kamar.`,
      ],
    },
    values: formValues(formData),
  };
}

const packageExists = (formData: FormData): FormState => ({
  fieldErrors: { detail_level: ["Paket untuk jenis properti dan tingkat detail ini sudah ada. Ubah paket yang ada."] },
  values: formValues(formData),
});

function serviceData(formData: FormData) {
  const parsed = serviceSchema.safeParse({
    service_name: String(formData.get("service_name") ?? ""),
    description: String(formData.get("description") ?? ""),
    property_type: String(formData.get("property_type") ?? ""),
    detail_level: String(formData.get("detail_level") ?? ""),
    base_price: String(formData.get("base_price") ?? ""),
    price_per_room: String(formData.get("price_per_room") ?? ""),
    base_duration_minutes: String(formData.get("base_duration_minutes") ?? ""),
    duration_per_room_minutes: String(formData.get("duration_per_room_minutes") ?? ""),
    min_rooms: String(formData.get("min_rooms") ?? ""),
    max_rooms: String(formData.get("max_rooms") ?? ""),
  });
  if (!parsed.success) return { error: fail(parsed.error, formData) } as const;
  return {
    data: {
      ...parsed.data,
      description: parsed.data.description || null,
      is_active: checkbox(formData, "is_active"),
    },
  } as const;
}

export async function createService(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");
  const r = serviceData(formData);
  if (r.error) return r.error;
  const oversized = await checkDurationFitsSlot(r.data, formData);
  if (oversized) return oversized;
  try {
    await prisma.service.create({ data: r.data });
  } catch (e) {
    if (isUniqueViolation(e)) return packageExists(formData);
    throw e;
  }
  revalidatePath("/admin/layanan");
  redirect("/admin/layanan");
}

export async function updateService(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");
  const r = serviceData(formData);
  if (r.error) return r.error;
  const oversized = await checkDurationFitsSlot(r.data, formData);
  if (oversized) return oversized;
  try {
    await prisma.service.update({ where: { id_service: parseId(id) }, data: r.data });
  } catch (e) {
    if (isUniqueViolation(e)) return packageExists(formData);
    throw e;
  }
  revalidatePath("/admin/layanan");
  redirect("/admin/layanan");
}

export async function deleteService(formData: FormData) {
  await requireRole("admin");
  const id = parseId(Number(formData.get("id")));
  try {
    await prisma.service.delete({ where: { id_service: id } });
  } catch (e) {
    // Already used by bookings: keep history, ask the admin to deactivate instead.
    if (isForeignKeyViolation(e)) {
      redirect("/admin/layanan?error=in_use");
    }
    throw e;
  }
  revalidatePath("/admin/layanan");
  redirect("/admin/layanan");
}

/* ------------------------------ Jam operasional ----------------------------- */

const hourSchema = z
  .object({
    start_time: z.string().regex(HHMM, "Format jam HH:mm"),
    end_time: z.string().regex(HHMM, "Format jam HH:mm"),
    quota: z.coerce
      .number({ error: "Kuota harus berupa angka" })
      .int("Kuota harus bilangan bulat")
      .min(1, "Kuota minimal 1")
      .max(100, "Kuota maksimal 100"),
  })
  .refine((v) => v.end_time > v.start_time, {
    path: ["end_time"],
    message: "Jam selesai harus setelah jam mulai",
  });

function hourData(formData: FormData) {
  const parsed = hourSchema.safeParse({
    start_time: String(formData.get("start_time") ?? ""),
    end_time: String(formData.get("end_time") ?? ""),
    quota: String(formData.get("quota") ?? ""),
  });
  if (!parsed.success) return { error: fail(parsed.error, formData) } as const;
  return { data: { ...parsed.data, active: checkbox(formData, "active") } } as const;
}

const duplicateHour = (formData: FormData): FormState => ({
  fieldErrors: { start_time: ["Jam operasional ini sudah ada"] },
  values: formValues(formData),
});

// A slot is keyed by (date, jam_mulai), so two templates sharing a start time
// would fight over the same slot row.
async function startTimeInUse(startTime: string, exceptId?: number) {
  const dup = await prisma.operatingHour.findFirst({
    where: { start_time: startTime, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  });
  return dup !== null;
}

const duplicateStartTime = (formData: FormData): FormState => ({
  fieldErrors: { start_time: ["Jam mulai ini sudah dipakai jam operasional lain"] },
  values: formValues(formData),
});

export async function createOperatingHour(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");
  const r = hourData(formData);
  if (r.error) return r.error;
  if (await startTimeInUse(r.data.start_time)) return duplicateStartTime(formData);
  try {
    await prisma.operatingHour.create({ data: r.data });
  } catch (e) {
    if (isUniqueViolation(e)) return duplicateHour(formData);
    throw e;
  }
  revalidatePath("/admin/jam");
  redirect("/admin/jam");
}

export async function updateOperatingHour(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");
  const r = hourData(formData);
  if (r.error) return r.error;
  if (await startTimeInUse(r.data.start_time, parseId(id))) return duplicateStartTime(formData);
  try {
    await prisma.operatingHour.update({ where: { id: parseId(id) }, data: r.data });
  } catch (e) {
    if (isUniqueViolation(e)) return duplicateHour(formData);
    throw e;
  }
  revalidatePath("/admin/jam");
  redirect("/admin/jam");
}

// Safe to hard-delete: bookings copy the time into jadwal_slot, they don't
// reference this template table.
export async function deleteOperatingHour(formData: FormData) {
  await requireRole("admin");
  const id = parseId(Number(formData.get("id")));
  await prisma.operatingHour.delete({ where: { id } });
  revalidatePath("/admin/jam");
  redirect("/admin/jam");
}

/* --------------------------------- Karyawan --------------------------------- */

const staffBase = {
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  email: z.email("Email tidak valid").trim().toLowerCase().max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(\+62|62|0)8\d{7,12}$/, "No. HP tidak valid (contoh: 08123456789)"),
};
const newPassword = z.string().min(8, "Password minimal 8 karakter").max(72);

const duplicateEmail = (formData: FormData): FormState => ({
  fieldErrors: { email: ["Email sudah terdaftar"] },
  values: formValues(formData),
});

export async function createStaff(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");
  const parsed = z
    .object({ ...staffBase, password: newPassword })
    .safeParse({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
  if (!parsed.success) return fail(parsed.error, formData);

  const { password, ...rest } = parsed.data;
  try {
    await prisma.user.create({
      data: {
        ...rest,
        role: "staff", // this form can only ever create staff
        is_active: checkbox(formData, "is_active"),
        password: await bcrypt.hash(password, 10),
      },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return duplicateEmail(formData);
    throw e;
  }
  revalidatePath("/admin/karyawan");
  redirect("/admin/karyawan");
}

export async function updateStaff(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("admin");
  const parsed = z
    .object({ ...staffBase, password: newPassword.or(z.literal("")) })
    .safeParse({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
  if (!parsed.success) return fail(parsed.error, formData);

  const { password, ...rest } = parsed.data;
  try {
    // Scoped to role karyawan so this can never edit an admin or customer.
    const res = await prisma.user.updateMany({
      where: { id_user: parseId(id), role: "staff" },
      data: {
        ...rest,
        is_active: checkbox(formData, "is_active"),
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      },
    });
    if (res.count === 0) throw new Error("Karyawan tidak ditemukan");
  } catch (e) {
    if (isUniqueViolation(e)) return duplicateEmail(formData);
    throw e;
  }
  revalidatePath("/admin/karyawan");
  redirect("/admin/karyawan");
}

export async function toggleStaff(formData: FormData) {
  await requireRole("admin");
  const id = parseId(Number(formData.get("id")));
  const active = formData.get("active") === "true";
  await prisma.user.updateMany({
    where: { id_user: id, role: "staff" },
    data: { is_active: active },
  });
  revalidatePath("/admin/karyawan");
}
