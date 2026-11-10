"use client";

import { useActionState, useState, useTransition } from "react";
import type { FormState } from "@/lib/form-state";
import { Alert, Button, Textarea } from "@/components/ui";

type Props = {
  setujui: () => Promise<FormState>;
  revisi: (prev: FormState, formData: FormData) => Promise<FormState>;
};

export function VerifikasiPanel({ setujui, revisi }: Props) {
  const [pending, start] = useTransition();
  const [errSetuju, setErrSetuju] = useState<string>();
  const [state, formAction, revisiPending] = useActionState(revisi, {} as FormState);

  if (state.values?.ok) return <Alert tone="info" title="Revisi dikirim">Booking kembali ke Sedang dikerjakan, karyawan akan melihat catatannya.</Alert>;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        {errSetuju && <Alert tone="danger">{errSetuju}</Alert>}
        <Button
          loading={pending}
          onClick={() =>
            start(async () => {
              const res = await setujui();
              setErrSetuju(res.error);
            })
          }
        >
          Setujui, tandai selesai
        </Button>
      </div>
      <form action={formAction} className="flex flex-col gap-3 border-t border-border pt-5">
        {state.error && <Alert tone="danger">{state.error}</Alert>}
        <Textarea name="catatan" label="Catatan revisi" required rows={3} maxLength={1000} defaultValue={state.values?.catatan} error={state.fieldErrors?.catatan?.[0]} />
        <Button type="submit" variant="outline" loading={revisiPending}>
          Minta revisi
        </Button>
      </form>
    </div>
  );
}
