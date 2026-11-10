"use client";

import { useActionState, useState, useTransition } from "react";
import type { FormState } from "@/lib/form-state";
import { Alert, Button, Textarea } from "@/components/ui";

type Props = {
  approve: () => Promise<FormState>;
  revision: (prev: FormState, formData: FormData) => Promise<FormState>;
};

export function VerificationPanel({ approve, revision }: Props) {
  const [pending, start] = useTransition();
  const [approveError, setApproveError] = useState<string>();
  const [state, formAction, revisionPending] = useActionState(revision, {} as FormState);

  if (state.values?.ok) return <Alert tone="info" title="Revisi dikirim">Booking kembali ke Sedang dikerjakan, karyawan akan melihat catatannya.</Alert>;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        {approveError && <Alert tone="danger">{approveError}</Alert>}
        <Button
          loading={pending}
          onClick={() =>
            start(async () => {
              const res = await approve();
              setApproveError(res.error);
            })
          }
        >
          Setujui, tandai selesai
        </Button>
      </div>
      <form action={formAction} className="flex flex-col gap-3 border-t border-border pt-5">
        {state.error && <Alert tone="danger">{state.error}</Alert>}
        <Textarea name="notes" label="Catatan revisi" required rows={3} maxLength={1000} defaultValue={state.values?.notes} error={state.fieldErrors?.notes?.[0]} />
        <Button type="submit" variant="outline" loading={revisionPending}>
          Minta revisi
        </Button>
      </form>
    </div>
  );
}
