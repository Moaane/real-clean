"use client";

import { useState, useTransition } from "react";
import { changeStatus } from "@/lib/actions/tugas";
import { Alert, Button } from "@/components/ui";

export function StatusActions({ idAssignment, toStatus, label }: { idAssignment: number; toStatus: "ON_THE_WAY" | "IN_PROGRESS"; label: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <div className="flex flex-col gap-3">
      {error && <Alert tone="danger">{error}</Alert>}
      <Button
        loading={pending}
        onClick={() =>
          start(async () => {
            const res = await changeStatus(idAssignment, toStatus);
            setError(res.error);
          })
        }
      >
        {label}
      </Button>
    </div>
  );
}
