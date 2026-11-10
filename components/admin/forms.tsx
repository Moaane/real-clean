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

/** Field value: the last input if validation failed, otherwise the initial value. */
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

export type ServiceValues = {
  service_name: string;
  description: string | null;
  property_type: string;
  detail_level: string;
  base_price: number;
  price_per_room: number;
  base_duration_minutes: number;
  duration_per_room_minutes: number;
  min_rooms: number;
  max_rooms: number;
  is_active: boolean;
};

export function ServiceForm({ action, initial: v, submitLabel }: { action: Action; initial?: ServiceValues; submitLabel: string }) {
  return (
    <Shell action={action} backHref="/admin/layanan" submitLabel={submitLabel}>
      {(s) => {
        const fe = s.fieldErrors ?? {};
        return (
          <>
            <Input name="service_name" label="Nama paket" required defaultValue={val(s, "service_name", v?.service_name)} error={fe.service_name?.[0]} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Select name="property_type" label="Jenis properti" required defaultValue={val(s, "property_type", v?.property_type ?? "house")} error={fe.property_type?.[0]}>
                <option value="house">Rumah</option>
                <option value="boarding_house">Kos-kosan</option>
              </Select>
              <Select name="detail_level" label="Tingkat detail" required defaultValue={val(s, "detail_level", v?.detail_level ?? "regular")} error={fe.detail_level?.[0]}>
                <option value="regular">Reguler</option>
                <option value="detailed">Detail</option>
                <option value="deep">Deep cleaning</option>
              </Select>
            </div>
            <p className="-mb-2 text-sm text-muted">
              Hanya satu paket per kombinasi jenis properti dan tingkat detail. Total = harga dasar + harga per kamar × jumlah kamar, dihitung ulang di server saat checkout.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input name="base_price" type="number" inputMode="numeric" min={0} label="Harga dasar (Rp)" required defaultValue={val(s, "base_price", v?.base_price ?? 0)} error={fe.base_price?.[0]} />
              <Input name="price_per_room" type="number" inputMode="numeric" min={0} label="Harga per kamar (Rp)" required defaultValue={val(s, "price_per_room", v?.price_per_room)} error={fe.price_per_room?.[0]} />
              <Input name="base_duration_minutes" type="number" inputMode="numeric" min={0} label="Durasi dasar (menit)" required defaultValue={val(s, "base_duration_minutes", v?.base_duration_minutes ?? 30)} error={fe.base_duration_minutes?.[0]} />
              <Input name="duration_per_room_minutes" type="number" inputMode="numeric" min={0} label="Durasi per kamar (menit)" required defaultValue={val(s, "duration_per_room_minutes", v?.duration_per_room_minutes)} error={fe.duration_per_room_minutes?.[0]} />
              <Input name="min_rooms" type="number" inputMode="numeric" min={1} max={200} label="Kamar minimal" required defaultValue={val(s, "min_rooms", v?.min_rooms ?? 1)} error={fe.min_rooms?.[0]} />
              <Input name="max_rooms" type="number" inputMode="numeric" min={1} max={200} label="Kamar maksimal" required hint="Durasi total harus muat di slot jam operasional." defaultValue={val(s, "max_rooms", v?.max_rooms)} error={fe.max_rooms?.[0]} />
            </div>
            <Textarea name="description" label="Deskripsi" defaultValue={val(s, "description", v?.description ?? "")} error={fe.description?.[0]} />
            <Toggle name="is_active" label="Tampilkan di katalog (aktif)" defaultChecked={checked(s, "is_active", v?.is_active ?? true)} />
          </>
        );
      }}
    </Shell>
  );
}

export type OperatingHourValues = { start_time: string; end_time: string; quota: number; active: boolean };

export function OperatingHourForm({ action, initial: v, submitLabel }: { action: Action; initial?: OperatingHourValues; submitLabel: string }) {
  return (
    <Shell action={action} backHref="/admin/jam" submitLabel={submitLabel}>
      {(s) => {
        const fe = s.fieldErrors ?? {};
        return (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input name="start_time" type="time" label="Jam mulai" required defaultValue={val(s, "start_time", v?.start_time ?? "08:00")} error={fe.start_time?.[0]} />
              <Input name="end_time" type="time" label="Jam selesai" required defaultValue={val(s, "end_time", v?.end_time ?? "10:00")} error={fe.end_time?.[0]} />
            </div>
            <Input name="quota" type="number" inputMode="numeric" min={1} max={100} label="Kuota per slot" required hint="Jumlah booking maksimal pada jam ini." defaultValue={val(s, "quota", v?.quota ?? 3)} error={fe.quota?.[0]} />
            <Toggle name="active" label="Aktif (bisa dipilih pelanggan)" defaultChecked={checked(s, "active", v?.active ?? true)} />
          </>
        );
      }}
    </Shell>
  );
}

export type StaffValues = { name: string; email: string; phone: string | null; is_active: boolean };

export function StaffForm({ action, initial: v, submitLabel, edit }: { action: Action; initial?: StaffValues; submitLabel: string; edit?: boolean }) {
  return (
    <Shell action={action} backHref="/admin/karyawan" submitLabel={submitLabel}>
      {(s) => {
        const fe = s.fieldErrors ?? {};
        return (
          <>
            <Input name="name" label="Nama lengkap" required autoComplete="off" defaultValue={val(s, "name", v?.name)} error={fe.name?.[0]} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input name="email" type="email" label="Email" required autoComplete="off" defaultValue={val(s, "email", v?.email)} error={fe.email?.[0]} />
              <Input name="phone" type="tel" inputMode="tel" label="Nomor HP" required hint="Contoh: 08123456789" defaultValue={val(s, "phone", v?.phone ?? "")} error={fe.phone?.[0]} />
            </div>
            <PasswordInput
              name="password"
              label={edit ? "Kata sandi baru" : "Kata sandi"}
              required={!edit}
              autoComplete="new-password"
              hint={edit ? "Kosongkan bila tidak ingin mengubah." : "Minimal 8 karakter."}
              error={fe.password?.[0]}
            />
            <Toggle name="is_active" label="Akun aktif" defaultChecked={checked(s, "is_active", v?.is_active ?? true)} />
          </>
        );
      }}
    </Shell>
  );
}
