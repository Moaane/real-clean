"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createBooking } from "@/lib/booking";
import { rememberAddress } from "@/lib/alamat";
import { formValues, type FormState } from "@/lib/form-state";

const schema = z.object({
  service: z.coerce.number().int().min(1, "Pilih paket"),
  room: z.coerce.number({ error: "Jumlah kamar harus berupa angka" }).int("Jumlah kamar harus bilangan bulat").min(1, "Jumlah kamar minimal 1").max(1000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pilih jam"),
  address: z.string().trim().min(10, "Alamat minimal 10 karakter").max(500),
  notes: z.string().trim().max(500).optional(),
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
    service: String(formData.get("service") ?? ""),
    room: String(formData.get("room") ?? ""),
    date: String(formData.get("date") ?? ""),
    start_time: String(formData.get("start_time") ?? ""),
    address: String(formData.get("address") ?? ""),
    notes: String(formData.get("notes") ?? ""),
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
      `/pesan?pkg=${d.service}&room=${d.room}&date=${d.date}&start_time=${enc(d.start_time)}` +
      `&address=${enc(d.address)}` +
      (d.notes ? `&notes=${enc(d.notes)}` : "");
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }
  if (user.role !== "customer") {
    return { error: "Hanya akun pelanggan yang dapat membuat booking.", values };
  }
  const result = await createBooking({
    userId: user.id_user,
    serviceId: d.service,
    roomCount: d.room,
    date: d.date,
    startTime: d.start_time,
    address: d.address,
    notes: d.notes,
  });
  if (!result.ok) {
    const key = result.field === "slot" ? "start_time" : result.field;
    return key
      ? { fieldErrors: { [key]: [result.error] }, values }
      : { error: result.error, values };
  }
  await rememberAddress(user.id_user, d.address);
  redirect(`/akun/booking/${result.code}`);
}
