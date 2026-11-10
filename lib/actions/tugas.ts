"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";
import { saveProof, changeTaskStatus } from "@/lib/tugas";

const idSchema = z.number().int().min(1);

export async function changeStatus(idAssignment: number, toStatus: "ON_THE_WAY" | "IN_PROGRESS"): Promise<FormState> {
  const user = await requireRole("staff"); // server actions are reachable by direct POST
  if (!idSchema.safeParse(idAssignment).success || (toStatus !== "ON_THE_WAY" && toStatus !== "IN_PROGRESS")) return { error: "Permintaan tidak valid" };
  const res = await changeTaskStatus({ idAssignment, idStaff: user.id_user, toStatus });
  if (!res.ok) return { error: res.error };
  revalidatePath("/karyawan", "layout");
  return { values: { ok: "1" } };
}

const proofSchema = z.object({
  idAssignment: idSchema,
  pathnames: z.array(z.string().min(1).max(255)).min(1).max(5),
  remarks: z.string().trim().max(500).optional(),
});

export async function submitProof(input: { idAssignment: number; pathnames: string[]; remarks?: string }): Promise<FormState> {
  const user = await requireRole("staff");
  const parsed = proofSchema.safeParse(input);
  if (!parsed.success) return { error: "Data bukti tidak valid" };
  const res = await saveProof({ ...parsed.data, idStaff: user.id_user });
  if (!res.ok) return { error: res.error };
  revalidatePath("/karyawan", "layout");
  return { values: { ok: "1" } };
}
