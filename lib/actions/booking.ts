"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createBooking } from "@/lib/booking";
import { formValues, type FormState } from "@/lib/form-state";

const schema = z.object({
  layanan: z.coerce.number().int().min(1, "Pilih paket"),
  kamar: z.coerce.number({ error: "Jumlah kamar harus berupa angka" }).int("Jumlah kamar harus bilangan bulat").min(1, "Jumlah kamar minimal 1").max(1000),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  jam_mulai: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pilih jam"),
  alamat: z.string().trim().min(10, "Alamat minimal 10 karakter").max(500),
  catatan: z.string().trim().max(500).optional(),
});

// Note: no price or duration is read from the form. Only the room count is, and the
// server range-checks it and computes total and duration from the package.
export async function submitBooking(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData);
  const user = await getCurrentUser();

  const parsed = schema.safeParse({
    layanan: String(formData.get("layanan") ?? ""),
    kamar: String(formData.get("kamar") ?? ""),
    tanggal: String(formData.get("tanggal") ?? ""),
    jam_mulai: String(formData.get("jam_mulai") ?? ""),
    alamat: String(formData.get("alamat") ?? ""),
    catatan: String(formData.get("catatan") ?? ""),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const d = parsed.data;

  // Guests may fill the whole form; login is required only at this point.
  // Their choices travel in `next` so the form is prefilled after login.
  if (!user) {
    const enc = (v: string) => encodeURIComponent(v).replace(/\./g, "%2E").replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
    const back =
      `/pesan?paket=${d.layanan}&kamar=${d.kamar}&tanggal=${d.tanggal}&jam_mulai=${enc(d.jam_mulai)}` +
      `&alamat=${enc(d.alamat)}` +
      (d.catatan ? `&catatan=${enc(d.catatan)}` : "");
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }
  if (user.role !== "pelanggan") {
    return { error: "Hanya akun pelanggan yang dapat membuat booking.", values };
  }
  const result = await createBooking({
    userId: user.id_user,
    layananId: d.layanan,
    jumlahKamar: d.kamar,
    tanggal: d.tanggal,
    jamMulai: d.jam_mulai,
    alamat: d.alamat,
    catatan: d.catatan,
  });
  if (!result.ok) {
    const key = result.field === "slot" ? "jam_mulai" : result.field;
    return key
      ? { fieldErrors: { [key]: [result.error] }, values }
      : { error: result.error, values };
  }
  redirect(`/akun/booking/${result.kode}`);
}
