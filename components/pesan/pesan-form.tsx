"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useApi } from "@/lib/use-api";
import type { SavedAddressesResponse } from "@/app/api/alamat/route";
import { deleteSavedAddress } from "@/lib/actions/alamat";
import { submitBooking } from "@/lib/actions/booking";
import type { FormState } from "@/lib/form-state";
import { Alert, Button, Card, Textarea } from "@/components/ui";
import { IconCalendar, IconClock, IconTag, IconX } from "@/components/icons";

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
  /** Streamed in from the server (login hint for guests). */
  notice?: ReactNode;
  /** True while availability is still being fetched or the chosen slot is not confirmed yet: submitting is blocked. */
  checking: boolean;
};

const initial: FormState = {};

/** Step 3: location details + a sticky summary bar on mobile. */
export function OrderForm(p: Props) {
  const [state, action, pending] = useActionState(submitBooking, initial);
  const fe = state.fieldErrors ?? {};
  const first = (k: string) => fe[k]?.[0];
  const v = state.values ?? {};
  const saved = useApi<SavedAddressesResponse>("/api/alamat");
  // Picking a saved address remounts the textarea (via key) with that text as its default value.
  const [picked, setPicked] = useState<{ n: number; text: string } | null>(null);
  const savedList = saved.data?.addresses ?? [];

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
        {savedList.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold">Alamat tersimpan</p>
            <ul className="flex flex-col gap-2">
              {savedList.map((a) => (
                <li key={a.id} className="flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => setPicked({ n: (picked?.n ?? 0) + 1, text: a.address })}
                    className="min-h-11 flex-1 cursor-pointer rounded-md border border-border-strong px-3 py-2 text-left text-sm transition duration-150 hover:border-primary hover:bg-primary-soft"
                  >
                    <span className="line-clamp-2">{a.address}</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Hapus alamat tersimpan"
                    onClick={async () => {
                      await deleteSavedAddress(a.id);
                      saved.retry();
                    }}
                    className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition duration-150 hover:bg-surface-2 hover:text-danger"
                  >
                    <IconX size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Textarea
          key={picked?.n ?? 0}
          name="address"
          label="Alamat lengkap"
          required
          rows={3}
          autoComplete="street-address"
          hint="Tulis nama jalan, nomor, patokan, dan kecamatan agar petugas mudah menemukan lokasi. Alamat disimpan otomatis setelah Anda memesan."
          defaultValue={picked?.text ?? v.address ?? p.defaultAddress}
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

      {p.notice}

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-border bg-surface px-4 py-3 shadow-overlay md:static md:rounded-lg md:border md:px-5 md:shadow-none">
        <p className="text-lg font-bold tabular-nums">
          <span className="block text-xs font-medium text-muted">Total</span>
          {p.totalLabel}
        </p>
        <Button type="submit" size="lg" arrow loading={pending} disabled={p.checking}>
          {p.checking ? "Memeriksa jadwal…" : "Lanjut ke pembayaran"}
        </Button>
      </div>
    </form>
  );
}
