import Link from "next/link";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui";
import { Photo } from "@/components/ui/photo";
import type { Layanan } from "@/generated/prisma/client";
import { rp } from "@/lib/booking-status";
import { JENIS_PROPERTI, TINGKAT_DETAIL, durasiLabel } from "@/lib/katalog";

export function PaketCard({ item }: { item: Layanan }) {
  const meta = JENIS_PROPERTI[item.jenis_properti];
  const titleId = `paket-${item.id_layanan}`;
  return (
    <li className="card card-interactive flex flex-col gap-4">
      <Photo
        src={`/images/landing/paket-${item.jenis_properti}.webp`}
        alt={`Ilustrasi paket ${meta.label.toLowerCase()}`}
        ratio="4 / 3"
        sizes="(min-width: 1024px) 352px, (min-width: 640px) 45vw, 100vw"
        icon={meta.icon}
      />
      <div>
        <h3 id={titleId} className="text-lg font-semibold leading-snug">
          {item.nama_layanan}
        </h3>
        {item.deskripsi && <p className="mt-1 line-clamp-3 text-sm text-muted">{item.deskripsi}</p>}
      </div>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
        <li className="flex items-center gap-1.5">
          <Icon name="bed" size={16} />
          {item.jumlah_kamar} kamar
        </li>
        <li className="flex items-center gap-1.5">
          <Icon name="clock" size={16} />
          {durasiLabel(item.durasi_menit)}
        </li>
        <li>
          <Badge tone={item.tingkat_detail === "deep" ? "warn" : "neutral"}>{TINGKAT_DETAIL[item.tingkat_detail]}</Badge>
        </li>
      </ul>
      <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
        <div>
          <p className="text-xs font-medium text-muted">Harga tetap</p>
          <p className="text-lg font-bold tabular-nums">{rp(item.harga)}</p>
        </div>
        <Link href={`/pesan?paket=${item.id_layanan}`} className="btn btn-primary w-full" aria-describedby={titleId}>
          Pilih paket
          <Icon name="arrow" size={18} />
        </Link>
      </div>
    </li>
  );
}

export function PaketSkeleton() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6" aria-busy="true" aria-label="Memuat paket">
      {[0, 1, 2].map((i) => (
        <li key={i} aria-hidden="true" className="card flex animate-pulse flex-col gap-4">
          <div className="aspect-[4/3] rounded-lg bg-surface-2" />
          <div className="h-5 w-3/4 rounded-sm bg-surface-2" />
          <div className="h-4 w-full rounded-sm bg-surface-2" />
          <div className="h-4 w-1/2 rounded-sm bg-surface-2" />
          <div className="mt-2 h-7 w-1/3 rounded-sm bg-surface-2" />
          <div className="h-11 rounded-pill bg-surface-2" />
        </li>
      ))}
    </ul>
  );
}
