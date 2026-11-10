"use client";

import { useState, useTransition } from "react";
import type { FormState } from "@/lib/form-state";
import { Alert, Button } from "@/components/ui";

type Props = {
  setujui: () => Promise<FormState>;
  tolak: () => Promise<FormState>;
};

export function PembatalanPanel({ setujui, tolak }: Props) {
  const [pending, start] = useTransition();
  const [hasil, setHasil] = useState<FormState>();

  if (hasil?.values?.ok === "sukses") return <Alert tone="ok" title="Pembatalan disetujui">Refund berhasil diproses di Midtrans.</Alert>;
  if (hasil?.values?.ok === "gagal") return <Alert tone="warn" title="Pembatalan disetujui, refund gagal">Booking dibatalkan dan slot dilepas, tetapi Midtrans menolak refund. Muat ulang halaman untuk melihat alasannya.</Alert>;
  if (hasil?.values?.ok === "1") return <Alert tone="info" title="Pengajuan ditolak">Status booking tidak berubah, pelanggan diberi tahu lewat email.</Alert>;

  const jalankan = (aksi: () => Promise<FormState>, konfirmasi: string) => {
    if (!window.confirm(konfirmasi)) return;
    start(async () => setHasil(await aksi()));
  };

  return (
    <div className="flex flex-col gap-3">
      {hasil?.error && <Alert tone="danger">{hasil.error}</Alert>}
      <div className="flex flex-wrap gap-2">
        <Button variant="danger" loading={pending} onClick={() => jalankan(setujui, "Setujui pembatalan dan kirim refund penuh ke pelanggan?")}>
          Setujui dan refund
        </Button>
        <Button variant="outline" loading={pending} onClick={() => jalankan(tolak, "Tolak pengajuan pembatalan ini?")}>
          Tolak
        </Button>
      </div>
    </div>
  );
}
