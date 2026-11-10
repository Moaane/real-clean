"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";
import { simpanBukti, ubahStatusTugas } from "@/lib/tugas";

const idSchema = z.number().int().min(1);

export async function ubahStatus(idPenugasan: number, ke: "DALAM_PERJALANAN" | "DIKERJAKAN"): Promise<FormState> {
  const user = await requireRole("karyawan"); // server actions are reachable by direct POST
  if (!idSchema.safeParse(idPenugasan).success || (ke !== "DALAM_PERJALANAN" && ke !== "DIKERJAKAN")) return { error: "Permintaan tidak valid" };
  const res = await ubahStatusTugas({ idPenugasan, idKaryawan: user.id_user, ke });
  if (!res.ok) return { error: res.error };
  revalidatePath("/karyawan", "layout");
  return { values: { ok: "1" } };
}

const buktiSchema = z.object({
  idPenugasan: idSchema,
  pathnames: z.array(z.string().min(1).max(255)).min(1).max(5),
  keterangan: z.string().trim().max(500).optional(),
});

export async function kirimBukti(input: { idPenugasan: number; pathnames: string[]; keterangan?: string }): Promise<FormState> {
  const user = await requireRole("karyawan");
  const parsed = buktiSchema.safeParse(input);
  if (!parsed.success) return { error: "Data bukti tidak valid" };
  const res = await simpanBukti({ ...parsed.data, idKaryawan: user.id_user });
  if (!res.ok) return { error: res.error };
  revalidatePath("/karyawan", "layout");
  return { values: { ok: "1" } };
}
