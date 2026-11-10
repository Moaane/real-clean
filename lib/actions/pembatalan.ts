"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";
import { sendCancelRejectedEmail, sendRefundEmail } from "@/lib/notifikasi";
import { requestCancel, approveCancel, rejectCancel } from "@/lib/pembatalan";
import { prisma } from "@/lib/prisma";

const idSchema = z.number().int().min(1);
const reasonSchema = z.object({ reason: z.string().trim().min(5, "Alasan minimal 5 karakter").max(500, "Maksimal 500 karakter") });

/** Customer: request cancellation of their own booking. */
export async function requestCancellation(code: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("customer");
  const reason = String(formData.get("reason") ?? "");
  const parsed = reasonSchema.safeParse({ reason });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values: { reason } };

  // Ownership is enforced again inside requestCancel (id_customer in the UPDATE).
  const b = await prisma.booking.findFirst({ where: { booking_code: code.toUpperCase(), id_customer: user.id_user }, select: { id_booking: true } });
  if (!b) return { error: "Booking tidak ditemukan", values: { reason } };

  const res = await requestCancel({ idBooking: b.id_booking, idCustomer: user.id_user, reason: parsed.data.reason });
  if (!res.ok) return { error: res.error, values: { reason } };
  revalidatePath("/akun", "layout");
  return { values: { ok: "1" } };
}

/** Admin: reject the request. Status unchanged, customer is emailed. */
export async function rejectCancellation(idBooking: number): Promise<FormState> {
  await requireRole("admin");
  if (!idSchema.safeParse(idBooking).success) return { error: "Permintaan tidak valid" };
  const res = await rejectCancel(idBooking);
  if (!res.ok) return { error: res.error };
  after(() => sendCancelRejectedEmail(idBooking));
  revalidatePath("/admin/booking");
  return { values: { ok: "1" } };
}

/** Admin: approve. Cancels, releases the slot and refunds via Midtrans sandbox. */
export async function approveCancellation(idBooking: number): Promise<FormState> {
  const admin = await requireRole("admin");
  if (!idSchema.safeParse(idBooking).success) return { error: "Permintaan tidak valid" };
  const res = await approveCancel({ idBooking, idAdmin: admin.id_user });
  if (!res.ok) return { error: res.error };
  if (res.refund === "success") after(() => sendRefundEmail(res.idRefund));
  revalidatePath("/admin/booking");
  return { values: { ok: res.refund } };
}
