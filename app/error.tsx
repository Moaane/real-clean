"use client";

import { Alert, Button } from "@/components/ui";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="konten" className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-24">
      <h1 className="text-[28px] font-bold leading-tight">Terjadi kesalahan</h1>
      <Alert tone="danger" title="Halaman gagal dimuat">
        Coba muat ulang. Jika masih gagal, hubungi admin.
      </Alert>
      <div>
        <Button onClick={reset}>Coba lagi</Button>
      </div>
    </main>
  );
}
