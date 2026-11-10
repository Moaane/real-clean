"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/lib/form-state";
import { Alert, Button, Textarea } from "@/components/ui";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function RequestCancelForm({ action }: { action: Action }) {
  const [opened, setOpened] = useState(false);
  const [state, formAction, pending] = useActionState(action, {} as FormState);

  if (state.values?.ok) return <Alert tone="info" title="Pengajuan terkirim">Admin akan meninjau pengajuan pembatalan Anda.</Alert>;
  if (!opened)
    return (
      <Button type="button" variant="outline" onClick={() => setOpened(true)}>
        Ajukan pembatalan
      </Button>
    );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <Textarea name="reason" label="Alasan pembatalan" required rows={3} maxLength={500} defaultValue={state.values?.reason} error={state.fieldErrors?.reason?.[0]} />
      <div className="flex gap-2">
        <Button type="submit" variant="danger" loading={pending}>
          Kirim pengajuan
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpened(false)}>
          Tutup
        </Button>
      </div>
    </form>
  );
}
