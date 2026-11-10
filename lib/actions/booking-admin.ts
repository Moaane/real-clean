"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";
import { sendCompletedEmail, sendNewTaskEmail } from "@/lib/notifikasi";
import { assignStaff } from "@/lib/penugasan";
import { verificationResult } from "@/lib/tugas";

const schema = z.object({
  idBooking: z.coerce.number().int().min(1),
  staff: z.coerce.number({ error: "Pilih karyawan" }).int().min(1, "Pilih karyawan"),
});

export async function assign(idBooking: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("admin"); // server actions are reachable by direct POST
  const parsed = schema.safeParse({ idBooking, staff: String(formData.get("staff") ?? "") });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values: { staff: String(formData.get("staff") ?? "") } };

  const res = await assignStaff({ idBooking: parsed.data.idBooking, idStaff: parsed.data.staff, idAdmin: admin.id_user });
  if (!res.ok) return { error: res.error };

  after(() => sendNewTaskEmail(res.idAssignment));
  revalidatePath("/admin/booking");
  return { values: { ok: "1" } };
}

export async function approveResult(idBooking: number): Promise<FormState> {
  await requireRole("admin");
  if (!z.number().int().min(1).safeParse(idBooking).success) return { error: "Permintaan tidak valid" };
  const res = await verificationResult({ idBooking, approved: true });
  if (!res.ok) return { error: res.error };
  after(() => sendCompletedEmail(idBooking));
  revalidatePath("/admin/booking");
  return { values: { ok: "1" } };
}

const revisionSchema = z.object({ notes: z.string().trim().min(1, "Catatan revisi wajib diisi").max(1000, "Maksimal 1000 karakter") });

export async function requestRevision(idBooking: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const notes = String(formData.get("notes") ?? "");
  const parsed = revisionSchema.safeParse({ notes });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values: { notes } };
  const res = await verificationResult({ idBooking, approved: false, notes: parsed.data.notes });
  if (!res.ok) return { error: res.error, values: { notes } };
  revalidatePath("/admin/booking");
  return { values: { ok: "1" } };
}
