"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";
import { kirimEmailSelesai, kirimEmailTugasBaru } from "@/lib/notifikasi";
import { tugaskanKaryawan } from "@/lib/penugasan";
import { verifikasiHasil } from "@/lib/tugas";

const schema = z.object({
  idBooking: z.coerce.number().int().min(1),
  karyawan: z.coerce.number({ error: "Pilih karyawan" }).int().min(1, "Pilih karyawan"),
});

export async function tugaskan(idBooking: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("admin"); // server actions are reachable by direct POST
  const parsed = schema.safeParse({ idBooking, karyawan: String(formData.get("karyawan") ?? "") });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values: { karyawan: String(formData.get("karyawan") ?? "") } };

  const res = await tugaskanKaryawan({ idBooking: parsed.data.idBooking, idKaryawan: parsed.data.karyawan, idAdmin: admin.id_user });
  if (!res.ok) return { error: res.error };

  after(() => kirimEmailTugasBaru(res.idPenugasan));
  revalidatePath("/admin/booking");
  return { values: { ok: "1" } };
}

export async function setujuiHasil(idBooking: number): Promise<FormState> {
  await requireRole("admin");
  if (!z.number().int().min(1).safeParse(idBooking).success) return { error: "Permintaan tidak valid" };
  const res = await verifikasiHasil({ idBooking, setuju: true });
  if (!res.ok) return { error: res.error };
  after(() => kirimEmailSelesai(idBooking));
  revalidatePath("/admin/booking");
  return { values: { ok: "1" } };
}

const revisiSchema = z.object({ catatan: z.string().trim().min(1, "Catatan revisi wajib diisi").max(1000, "Maksimal 1000 karakter") });

export async function mintaRevisi(idBooking: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const catatan = String(formData.get("catatan") ?? "");
  const parsed = revisiSchema.safeParse({ catatan });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values: { catatan } };
  const res = await verifikasiHasil({ idBooking, setuju: false, catatan: parsed.data.catatan });
  if (!res.ok) return { error: res.error, values: { catatan } };
  revalidatePath("/admin/booking");
  return { values: { ok: "1" } };
}
