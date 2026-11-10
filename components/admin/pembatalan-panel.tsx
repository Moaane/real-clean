"use client";

import { useState, useTransition } from "react";
import type { FormState } from "@/lib/form-state";
import { Alert, Button } from "@/components/ui";

type Props = {
  approve: () => Promise<FormState>;
  reject: () => Promise<FormState>;
};

export function CancellationPanel({ approve, reject }: Props) {
  const [pending, start] = useTransition();
  const [result, setHasil] = useState<FormState>();

  if (result?.values?.ok === "success") return <Alert tone="ok" title="Pembatalan disetujui">Refund berhasil diproses di Midtrans.</Alert>;
  if (result?.values?.ok === "failed") return <Alert tone="warn" title="Pembatalan disetujui, refund gagal">Booking dibatalkan dan slot dilepas, tetapi Midtrans menolak refund. Muat ulang halaman untuk melihat alasannya.</Alert>;
  if (result?.values?.ok === "1") return <Alert tone="info" title="Pengajuan ditolak">Status booking tidak berubah, pelanggan diberi tahu lewat email.</Alert>;

  const run = (outcome: () => Promise<FormState>, confirmation: string) => {
    if (!window.confirm(confirmation)) return;
    start(async () => setHasil(await outcome()));
  };

  return (
    <div className="flex flex-col gap-3">
      {result?.error && <Alert tone="danger">{result.error}</Alert>}
      <div className="flex flex-wrap gap-2">
        <Button variant="danger" loading={pending} onClick={() => run(approve, "Setujui pembatalan dan kirim refund penuh ke pelanggan?")}>
          Setujui dan refund
        </Button>
        <Button variant="outline" loading={pending} onClick={() => run(reject, "Tolak pengajuan pembatalan ini?")}>
          Tolak
        </Button>
      </div>
    </div>
  );
}
