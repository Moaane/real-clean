import Link from "next/link";
import { connection } from "next/server";
import { Icon } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import type { Layanan } from "@/generated/prisma/client";
import { getPaketAktif, JENIS_PROPERTI } from "@/lib/katalog";
import { PaketCard } from "./paket-card";
import { PaketTabs } from "./paket-tabs";

function Daftar({ items, jenis }: { items: Layanan[]; jenis: keyof typeof JENIS_PROPERTI }) {
  const meta = JENIS_PROPERTI[jenis];
  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 py-10 text-center">
        <span className="grid size-14 place-items-center rounded-pill bg-surface-2 text-muted">
          <Icon name={meta.icon} size={28} />
        </span>
        <p className="font-semibold">Paket {meta.label.toLowerCase()} belum tersedia</p>
        <p className="text-sm text-muted">Pilih jenis properti lain pada filter di atas.</p>
      </div>
    );
  }
  return (
    <>
      <p className="mb-4 text-sm text-muted">{meta.hint}</p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6" aria-label={`Paket ${meta.label}`}>
        {items.map((l) => (
          <PaketCard key={l.id_layanan} item={l} />
        ))}
      </ul>
    </>
  );
}

export async function PaketSection() {
  await connection(); // outside try: must not swallow the prerender signal
  let items: Layanan[];
  try {
    items = await getPaketAktif();
  } catch (err) {
    console.error("Gagal memuat katalog paket", err);
    return (
      <div role="alert" className="alert-error flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Icon name="shield" size={20} className="shrink-0" />
        <p className="flex-1">Daftar paket gagal dimuat. Muat ulang halaman, atau coba lagi beberapa saat lagi.</p>
        <Link href="/" className={buttonClass("outline", "sm")}>
          Muat ulang
        </Link>
      </div>
    );
  }
  return (
    <PaketTabs
      rumah={<Daftar items={items.filter((l) => l.jenis_properti === "rumah")} jenis="rumah" />}
      kos={<Daftar items={items.filter((l) => l.jenis_properti === "kos")} jenis="kos" />}
    />
  );
}
