"use client";

import { useActionState } from "react";
import { submitBooking } from "@/lib/actions/booking";
import type { FormState } from "@/lib/form-state";
import { Alert, Button, Card, Textarea } from "@/components/ui";
import { IconCalendar, IconClock, IconTag } from "@/components/icons";

type Props = {
  paketId: number;
  paketNama: string;
  kamar: number;
  /** Hanya tampilan: server memvalidasi jumlah kamar dan menghitung ulang durasi. */
  rincian: string;
  durasiLabel: string;
  tanggal: string;
  jamMulai: string;
  tanggalLabel: string;
  jamLabel: string;
  /** Hanya tampilan. Server menghitung ulang harga dari data paket. */
  totalLabel: string;
  defaultAlamat?: string;
  defaultCatatan?: string;
  loggedIn: boolean;
};

const initial: FormState = {};

/** Langkah 3: detail lokasi + bar ringkasan sticky di mobile. */
export function PesanForm(p: Props) {
  const [state, action, pending] = useActionState(submitBooking, initial);
  const fe = state.fieldErrors ?? {};
  const first = (k: string) => fe[k]?.[0];
  const v = state.values ?? {};

  return (
    <form action={action} className="flex flex-col gap-6 pb-28 md:pb-0">
      <input type="hidden" name="layanan" value={p.paketId} />
      <input type="hidden" name="kamar" value={p.kamar} />
      <input type="hidden" name="tanggal" value={p.tanggal} />
      <input type="hidden" name="jam_mulai" value={p.jamMulai} />

      {(state.error || first("layanan") || first("kamar") || first("tanggal") || first("jam_mulai")) && (
        <Alert tone="danger" title="Booking belum bisa dibuat">
          {state.error ?? first("layanan") ?? first("kamar") ?? first("tanggal") ?? first("jam_mulai")}
        </Alert>
      )}

      <Card className="flex flex-col gap-5">
        <Textarea
          name="alamat"
          label="Alamat lengkap"
          required
          rows={3}
          autoComplete="street-address"
          hint="Tulis nama jalan, nomor, patokan, dan kecamatan agar petugas mudah menemukan lokasi."
          defaultValue={v.alamat ?? p.defaultAlamat}
          error={first("alamat")}
        />
        <Textarea
          name="catatan"
          label="Catatan untuk petugas"
          hint="Opsional. Mis. bagian yang perlu diprioritaskan."
          defaultValue={v.catatan ?? p.defaultCatatan}
          error={first("catatan")}
          rows={3}
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Ringkasan</h2>
        <dl className="flex flex-col gap-2 text-[15px]">
          <div className="flex items-start gap-2">
            <IconTag size={18} className="mt-0.5 shrink-0 text-primary" />
            <dt className="sr-only">Paket</dt>
            <dd>
              {p.paketNama}, {p.kamar} kamar
              <span className="block text-sm text-muted">{p.rincian}</span>
            </dd>
          </div>
          <div className="flex items-start gap-2">
            <IconCalendar size={18} className="mt-0.5 shrink-0 text-primary" />
            <dt className="sr-only">Tanggal</dt>
            <dd>{p.tanggalLabel}</dd>
          </div>
          <div className="flex items-start gap-2">
            <IconClock size={18} className="mt-0.5 shrink-0 text-primary" />
            <dt className="sr-only">Jam</dt>
            <dd>
              {p.jamLabel}
              <span className="block text-sm text-muted">Estimasi pengerjaan {p.durasiLabel}</span>
            </dd>
          </div>
        </dl>
      </Card>

      {!p.loggedIn && (
        <Alert tone="info">Anda akan diminta masuk atau mendaftar terlebih dahulu. Isian di atas tidak hilang.</Alert>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-border bg-surface px-4 py-3 shadow-overlay md:static md:rounded-lg md:border md:px-5 md:shadow-none">
        <p className="text-lg font-bold tabular-nums">
          <span className="block text-xs font-medium text-muted">Total</span>
          {p.totalLabel}
        </p>
        <Button type="submit" size="lg" arrow loading={pending}>
          Lanjut ke pembayaran
        </Button>
      </div>
    </form>
  );
}
