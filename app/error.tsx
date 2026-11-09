"use client";

import { useEffect } from "react";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="konten" className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-pill bg-danger-soft text-danger">
        <Icon name="shield" size={28} />
      </span>
      <h1 className="h2">Halaman gagal dimuat</h1>
      <p role="alert" className="text-muted">
        Terjadi kendala saat menampilkan halaman ini. Coba lagi beberapa saat.
      </p>
      <Button onClick={() => retry()}>Coba lagi</Button>
    </main>
  );
}
