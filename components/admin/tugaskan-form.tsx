"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/form-state";
import { Alert, Button, Select } from "@/components/ui";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function TugaskanForm({ action, karyawan }: { action: Action; karyawan: { id_user: number; nama: string }[] }) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  if (state.values?.ok) return <Alert tone="info" title="Karyawan ditugaskan">Status booking menjadi Petugas ditugaskan.</Alert>;
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <Select name="karyawan" label="Karyawan" required defaultValue="" error={state.fieldErrors?.karyawan?.[0]}>
        <option value="" disabled>
          Pilih karyawan yang kosong
        </option>
        {karyawan.map((k) => (
          <option key={k.id_user} value={k.id_user}>
            {k.nama}
          </option>
        ))}
      </Select>
      <Button type="submit" loading={pending}>
        Tugaskan
      </Button>
    </form>
  );
}
