"use client";

import { useState, useTransition } from "react";
import { ubahStatus } from "@/lib/actions/tugas";
import { Alert, Button } from "@/components/ui";

export function AksiStatus({ idPenugasan, ke, label }: { idPenugasan: number; ke: "DALAM_PERJALANAN" | "DIKERJAKAN"; label: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <div className="flex flex-col gap-3">
      {error && <Alert tone="danger">{error}</Alert>}
      <Button
        loading={pending}
        onClick={() =>
          start(async () => {
            const res = await ubahStatus(idPenugasan, ke);
            setError(res.error);
          })
        }
      >
        {label}
      </Button>
    </div>
  );
}
