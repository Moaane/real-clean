"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/form-state";
import { Alert, Button, Select } from "@/components/ui";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function AssignForm({ action, staff }: { action: Action; staff: { id_user: number; name: string }[] }) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  if (state.values?.ok) return <Alert tone="info" title="Karyawan ditugaskan">Status booking menjadi Petugas ditugaskan.</Alert>;
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <Select name="staff" label="Karyawan" required defaultValue="" error={state.fieldErrors?.staff?.[0]}>
        <option value="" disabled>
          Pilih karyawan yang kosong
        </option>
        {staff.map((k) => (
          <option key={k.id_user} value={k.id_user}>
            {k.name}
          </option>
        ))}
      </Select>
      <Button type="submit" loading={pending}>
        Tugaskan
      </Button>
    </form>
  );
}
