"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { useState, useTransition } from "react";
import { Alert, Button } from "@/components/ui";
import { mulaiPembayaran } from "@/lib/actions/pembayaran";

type Snap = {
  pay: (
    token: string,
    cb: { onSuccess?: () => void; onPending?: () => void; onError?: () => void; onClose?: () => void },
  ) => void;
};

/**
 * Opens the Snap popup. The callbacks only refresh the page: the booking is
 * marked paid by the webhook, never by what the browser reports.
 */
export function BayarButton({ kode, clientKey, snapUrl }: { kode: string; clientKey: string; snapUrl: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  function bayar() {
    setError(undefined);
    start(async () => {
      const snap = (window as unknown as { snap?: Snap }).snap;
      if (!snap) return setError("Pembayaran belum siap, tunggu sebentar lalu coba lagi.");
      const res = await mulaiPembayaran(kode);
      if (!res.ok) return setError(res.error);
      const refresh = () => router.refresh();
      snap.pay(res.token, {
        onSuccess: refresh,
        onPending: refresh,
        onError: () => setError("Pembayaran gagal, coba lagi."),
        onClose: refresh,
      });
    });
  }

  return (
    <>
      <Script src={snapUrl} data-client-key={clientKey} strategy="lazyOnload" />
      <Button size="lg" arrow loading={pending} onClick={bayar} className="w-full">
        Bayar sekarang
      </Button>
      {error && <Alert tone="danger">{error}</Alert>}
    </>
  );
}
