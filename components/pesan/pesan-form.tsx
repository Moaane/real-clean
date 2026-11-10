"use client";

import { useActionState } from "react";
import { submitBooking } from "@/lib/actions/booking";
import type { FormState } from "@/lib/form-state";
import { Alert, Button, Card, Textarea } from "@/components/ui";
import { IconCalendar, IconClock, IconTag } from "@/components/icons";

type Props = {
  packageId: number;
  packageName: string;
  room: number;
  /** Display only: the server validates the room count and recomputes the duration. */
  breakdown: string;
  durationLabel: string;
  date: string;
  startTime: string;
  dateLabel: string;
  hourLabel: string;
  /** Display only. The server recomputes the price from the package data. */
  totalLabel: string;
  defaultAddress?: string;
  defaultNotes?: string;
  loggedIn: boolean;
};

const initial: FormState = {};

/** Step 3: location details + a sticky summary bar on mobile. */
export function OrderForm(p: Props) {
  const [state, action, pending] = useActionState(submitBooking, initial);
  const fe = state.fieldErrors ?? {};
  const first = (k: string) => fe[k]?.[0];
  const v = state.values ?? {};

  return (
    <form action={action} className="flex flex-col gap-6 pb-28 md:pb-0">
      <input type="hidden" name="service" value={p.packageId} />
      <input type="hidden" name="room" value={p.room} />
      <input type="hidden" name="date" value={p.date} />
      <input type="hidden" name="start_time" value={p.startTime} />

      {(state.error || first("service") || first("room") || first("date") || first("start_time")) && (
        <Alert tone="danger" title="Booking belum bisa dibuat">
          {state.error ?? first("service") ?? first("room") ?? first("date") ?? first("start_time")}
        </Alert>
      )}

      <Card className="flex flex-col gap-5">
        <Textarea
          name="address"
          label="Alamat lengkap"
          required
          rows={3}
          autoComplete="street-address"
          hint="Tulis nama jalan, nomor, patokan, dan kecamatan agar petugas mudah menemukan lokasi."
          defaultValue={v.address ?? p.defaultAddress}
          error={first("address")}
        />
        <Textarea
          name="notes"
          label="Catatan untuk petugas"
          hint="Opsional. Mis. bagian yang perlu diprioritaskan."
          defaultValue={v.notes ?? p.defaultNotes}
          error={first("notes")}
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
              {p.packageName}, {p.room} kamar
              <span className="block text-sm text-muted">{p.breakdown}</span>
            </dd>
          </div>
          <div className="flex items-start gap-2">
            <IconCalendar size={18} className="mt-0.5 shrink-0 text-primary" />
            <dt className="sr-only">Tanggal</dt>
            <dd>{p.dateLabel}</dd>
          </div>
          <div className="flex items-start gap-2">
            <IconClock size={18} className="mt-0.5 shrink-0 text-primary" />
            <dt className="sr-only">Jam</dt>
            <dd>
              {p.hourLabel}
              <span className="block text-sm text-muted">Estimasi pengerjaan {p.durationLabel}</span>
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
