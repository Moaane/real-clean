"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/lib/form-state";
import { Icon } from "./icons";

export function BookingForm({
  action,
  layananId,
  tanggal,
  slots,
  defaults = {},
  loggedIn = false,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  layananId: number;
  tanggal: string;
  slots: { jam_mulai: string; jam_selesai: string; sisa: number }[];
  defaults?: Record<string, string>;
  loggedIn?: boolean;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const v = state.values ?? defaults;
  const err = (name: string) =>
    state.fieldErrors?.[name]?.map((m) => (
      <span key={m} role="alert" className="text-xs font-medium text-danger">
        {m}
      </span>
    ));

  return (
    <form action={formAction} className="card flex flex-col gap-5">
      <input type="hidden" name="layanan" value={layananId} />
      <input type="hidden" name="tanggal" value={tanggal} />
      {state.error && (
        <p role="alert" className="alert-error">
          {state.error}
        </p>
      )}
      {err("layanan")}
      {err("tanggal")}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">Pilih jam</legend>
        {slots.length === 0 ? (
          <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-on-accent">
            Semua jam pada tanggal ini sudah penuh. Pilih tanggal lain di atas.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((s) => (
              <label
                key={s.jam_mulai}
                className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-2 transition-colors has-checked:border-primary has-checked:bg-primary-soft has-focus-visible:outline-2 has-focus-visible:outline-primary"
              >
                <input
                  type="radio"
                  name="jam_mulai"
                  value={s.jam_mulai}
                  required
                  defaultChecked={v.jam_mulai === s.jam_mulai}
                  className="size-4 accent-(--primary)"
                />
                <span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <Icon name="clock" size={16} />
                    {s.jam_mulai} – {s.jam_selesai}
                  </span>
                  <span className="text-xs text-muted">Sisa {s.sisa} tim</span>
                </span>
              </label>
            ))}
          </div>
        )}
        {err("jam_mulai")}
      </fieldset>

      <label className="label">
        Alamat lengkap
        <textarea
          name="alamat"
          rows={3}
          required
          minLength={10}
          maxLength={500}
          defaultValue={v.alamat ?? ""}
          placeholder="Jalan, nomor, RT/RW, kelurahan, patokan"
          className="input"
        />
        {err("alamat")}
      </label>

      <label className="label">
        <span>
          Catatan untuk petugas <span className="font-normal text-muted">(opsional)</span>
        </span>
        <textarea
          name="catatan"
          rows={2}
          maxLength={500}
          defaultValue={v.catatan ?? ""}
          placeholder="Contoh: ada anjing, kunci di satpam"
          className="input"
        />
        {err("catatan")}
      </label>

      {!loggedIn && (
        <p className="text-sm text-muted">
          Pilihan Anda tersimpan. Anda akan diminta masuk atau daftar sebelum booking dibuat.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending || slots.length === 0} className="btn btn-primary">
          {pending ? "Memproses…" : loggedIn ? "Buat booking" : "Lanjut ke pembayaran"}
          {!pending && <Icon name="arrow" size={18} />}
        </button>
        <Link href="/" className="btn btn-outline">
          Batal
        </Link>
      </div>
    </form>
  );
}
