"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";
import { kirimEmailBatalDitolak, kirimEmailRefund } from "@/lib/notifikasi";
import { ajukanBatal, setujuiBatal, tolakBatal } from "@/lib/pembatalan";
import { prisma } from "@/lib/prisma";

const idSchema = z.number().int().min(1);
const alasanSchema = z.object({ alasan: z.string().trim().min(5, "Alasan minimal 5 karakter").max(500, "Maksimal 500 karakter") });

/** Customer: request cancellation of their own booking. */
export async function ajukanPembatalan(kode: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("pelanggan");
  const alasan = String(formData.get("alasan") ?? "");
  const parsed = alasanSchema.safeParse({ alasan });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values: { alasan } };

  // Ownership is enforced again inside ajukanBatal (id_pelanggan in the UPDATE).
  const b = await prisma.booking.findFirst({ where: { kode_booking: kode.toUpperCase(), id_pelanggan: user.id_user }, select: { id_booking: true } });
  if (!b) return { error: "Booking tidak ditemukan", values: { alasan } };

  const res = await ajukanBatal({ idBooking: b.id_booking, idPelanggan: user.id_user, alasan: parsed.data.alasan });
  if (!res.ok) return { error: res.error, values: { alasan } };
  revalidatePath("/akun", "layout");
  return { values: { ok: "1" } };
}

/** Admin: reject the request. Status unchanged, customer is emailed. */
export async function tolakPembatalan(idBooking: number): Promise<FormState> {
  await requireRole("admin");
  if (!idSchema.safeParse(idBooking).success) return { error: "Permintaan tidak valid" };
  const res = await tolakBatal(idBooking);
  if (!res.ok) return { error: res.error };
  after(() => kirimEmailBatalDitolak(idBooking));
  revalidatePath("/admin/booking");
  return { values: { ok: "1" } };
}

/** Admin: approve. Cancels, releases the slot and refunds via Midtrans sandbox. */
export async function setujuiPembatalan(idBooking: number): Promise<FormState> {
  const admin = await requireRole("admin");
  if (!idSchema.safeParse(idBooking).success) return { error: "Permintaan tidak valid" };
  const res = await setujuiBatal({ idBooking, idAdmin: admin.id_user });
  if (!res.ok) return { error: res.error };
  if (res.refund === "sukses") after(() => kirimEmailRefund(res.idRefund));
  revalidatePath("/admin/booking");
  return { values: { ok: res.refund } };
}
