"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import type { FormState } from "@/lib/form-state";
import { Alert, Button, Input, PasswordInput, Select, Textarea } from "@/components/ui";
import { buttonClass } from "@/components/ui/button";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;
const initial: FormState = {};

function Shell({
  action,
  backHref,
  submitLabel,
  children,
}: {
  action: Action;
  backHref: string;
  submitLabel: string;
  children: (s: FormState) => ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5 rounded-xl border border-border bg-surface p-5 md:p-7">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      {children(state)}
      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <Link href={backHref} className={buttonClass("outline")}>
          Batal
        </Link>
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

/** Nilai field: isian terakhir bila validasi gagal, kalau tidak nilai awal. */
const val = (s: FormState, k: string, fallback: string | number | undefined) => s.values?.[k] ?? (fallback === undefined ? "" : String(fallback));
const checked = (s: FormState, k: string, fallback: boolean) => (s.values ? s.values[k] === "on" : fallback);

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-medium">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-5 cursor-pointer accent-primary" />
      {label}
    </label>
  );
}

export type LayananValues = {
  nama_layanan: string;
  deskripsi: string | null;
  jenis_properti: string;
  tingkat_detail: string;
  harga_dasar: number;
  harga_per_kamar: number;
  durasi_dasar_menit: number;
  durasi_per_kamar_menit: number;
  min_kamar: number;
  max_kamar: number;
  status_aktif: boolean;
};

export function LayananForm({ action, initial: v, submitLabel }: { action: Action; initial?: LayananValues; submitLabel: string }) {
  return (
    <Shell action={action} backHref="/admin/layanan" submitLabel={submitLabel}>
      {(s) => {
        const fe = s.fieldErrors ?? {};
        return (
          <>
            <Input name="nama_layanan" label="Nama paket" required defaultValue={val(s, "nama_layanan", v?.nama_layanan)} error={fe.nama_layanan?.[0]} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Select name="jenis_properti" label="Jenis properti" required defaultValue={val(s, "jenis_properti", v?.jenis_properti ?? "rumah")} error={fe.jenis_properti?.[0]}>
                <option value="rumah">Rumah</option>
                <option value="kos">Kos-kosan</option>
              </Select>
              <Select name="tingkat_detail" label="Tingkat detail" required defaultValue={val(s, "tingkat_detail", v?.tingkat_detail ?? "reguler")} error={fe.tingkat_detail?.[0]}>
                <option value="reguler">Reguler</option>
                <option value="detail">Detail</option>
                <option value="deep">Deep cleaning</option>
              </Select>
            </div>
            <p className="-mb-2 text-sm text-muted">
              Hanya satu paket per kombinasi jenis properti dan tingkat detail. Total = harga dasar + harga per kamar × jumlah kamar, dihitung ulang di server saat checkout.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input name="harga_dasar" type="number" inputMode="numeric" min={0} label="Harga dasar (Rp)" required defaultValue={val(s, "harga_dasar", v?.harga_dasar ?? 0)} error={fe.harga_dasar?.[0]} />
              <Input name="harga_per_kamar" type="number" inputMode="numeric" min={0} label="Harga per kamar (Rp)" required defaultValue={val(s, "harga_per_kamar", v?.harga_per_kamar)} error={fe.harga_per_kamar?.[0]} />
              <Input name="durasi_dasar_menit" type="number" inputMode="numeric" min={0} label="Durasi dasar (menit)" required defaultValue={val(s, "durasi_dasar_menit", v?.durasi_dasar_menit ?? 30)} error={fe.durasi_dasar_menit?.[0]} />
              <Input name="durasi_per_kamar_menit" type="number" inputMode="numeric" min={0} label="Durasi per kamar (menit)" required defaultValue={val(s, "durasi_per_kamar_menit", v?.durasi_per_kamar_menit)} error={fe.durasi_per_kamar_menit?.[0]} />
              <Input name="min_kamar" type="number" inputMode="numeric" min={1} max={200} label="Kamar minimal" required defaultValue={val(s, "min_kamar", v?.min_kamar ?? 1)} error={fe.min_kamar?.[0]} />
              <Input name="max_kamar" type="number" inputMode="numeric" min={1} max={200} label="Kamar maksimal" required hint="Durasi total harus muat di slot jam operasional." defaultValue={val(s, "max_kamar", v?.max_kamar)} error={fe.max_kamar?.[0]} />
            </div>
            <Textarea name="deskripsi" label="Deskripsi" defaultValue={val(s, "deskripsi", v?.deskripsi ?? "")} error={fe.deskripsi?.[0]} />
            <Toggle name="status_aktif" label="Tampilkan di katalog (aktif)" defaultChecked={checked(s, "status_aktif", v?.status_aktif ?? true)} />
          </>
        );
      }}
    </Shell>
  );
}

export type JamValues = { jam_mulai: string; jam_selesai: string; kuota: number; aktif: boolean };

export function JamForm({ action, initial: v, submitLabel }: { action: Action; initial?: JamValues; submitLabel: string }) {
  return (
    <Shell action={action} backHref="/admin/jam" submitLabel={submitLabel}>
      {(s) => {
        const fe = s.fieldErrors ?? {};
        return (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input name="jam_mulai" type="time" label="Jam mulai" required defaultValue={val(s, "jam_mulai", v?.jam_mulai ?? "08:00")} error={fe.jam_mulai?.[0]} />
              <Input name="jam_selesai" type="time" label="Jam selesai" required defaultValue={val(s, "jam_selesai", v?.jam_selesai ?? "10:00")} error={fe.jam_selesai?.[0]} />
            </div>
            <Input name="kuota" type="number" inputMode="numeric" min={1} max={100} label="Kuota per slot" required hint="Jumlah booking maksimal pada jam ini." defaultValue={val(s, "kuota", v?.kuota ?? 3)} error={fe.kuota?.[0]} />
            <Toggle name="aktif" label="Aktif (bisa dipilih pelanggan)" defaultChecked={checked(s, "aktif", v?.aktif ?? true)} />
          </>
        );
      }}
    </Shell>
  );
}

export type KaryawanValues = { nama: string; email: string; no_hp: string | null; status_aktif: boolean };

export function KaryawanForm({ action, initial: v, submitLabel, edit }: { action: Action; initial?: KaryawanValues; submitLabel: string; edit?: boolean }) {
  return (
    <Shell action={action} backHref="/admin/karyawan" submitLabel={submitLabel}>
      {(s) => {
        const fe = s.fieldErrors ?? {};
        return (
          <>
            <Input name="nama" label="Nama lengkap" required autoComplete="off" defaultValue={val(s, "nama", v?.nama)} error={fe.nama?.[0]} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input name="email" type="email" label="Email" required autoComplete="off" defaultValue={val(s, "email", v?.email)} error={fe.email?.[0]} />
              <Input name="no_hp" type="tel" inputMode="tel" label="Nomor HP" required hint="Contoh: 08123456789" defaultValue={val(s, "no_hp", v?.no_hp ?? "")} error={fe.no_hp?.[0]} />
            </div>
            <PasswordInput
              name="password"
              label={edit ? "Kata sandi baru" : "Kata sandi"}
              required={!edit}
              autoComplete="new-password"
              hint={edit ? "Kosongkan bila tidak ingin mengubah." : "Minimal 8 karakter."}
              error={fe.password?.[0]}
            />
            <Toggle name="status_aktif" label="Akun aktif" defaultChecked={checked(s, "status_aktif", v?.status_aktif ?? true)} />
          </>
        );
      }}
    </Shell>
  );
}
