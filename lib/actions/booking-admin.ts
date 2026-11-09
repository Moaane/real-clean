"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";
import { kirimEmailTugasBaru } from "@/lib/notifikasi";
import { tugaskanKaryawan } from "@/lib/penugasan";

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
