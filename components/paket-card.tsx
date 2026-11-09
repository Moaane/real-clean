import type { Layanan } from "@/generated/prisma/client";
import { Photo } from "@/components/ui/photo";
import { ButtonLink, Card } from "@/components/ui";
import { IconBuilding, IconClock, IconHome, IconSparkle } from "@/components/icons";
import { JENIS_PROPERTI, TINGKAT_DETAIL, durasiLabel } from "@/lib/katalog";
import { rp } from "@/lib/booking-status";

/** Kartu paket lengkap (DESIGN §6.3), dipakai di /layanan dan langkah 1 pesan. */
export function PaketCard({ paket }: { paket: Layanan }) {
  const Icon = paket.jenis_properti === "kos" ? IconBuilding : IconHome;
  return (
    <Card variant="interactive" className="flex h-full flex-col gap-4">
      <Photo
        name={`paket-${paket.jenis_properti}`}
        alt=""
        icon={Icon}
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        className="aspect-[4/3] rounded-lg"
      />
      <div className="flex flex-1 flex-col gap-2">
        <h3 className="text-lg font-semibold leading-snug">{paket.nama_layanan}</h3>
        {paket.deskripsi && <p className="line-clamp-3 text-sm text-muted">{paket.deskripsi}</p>}
        <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted">
          <li className="flex items-center gap-1.5">
            <IconClock size={16} />
            {durasiLabel(paket.durasi_menit)}
          </li>
          <li className="flex items-center gap-1.5">
            <Icon size={16} />
            {JENIS_PROPERTI[paket.jenis_properti].label}, {paket.jumlah_kamar} kamar
          </li>
          <li className="flex items-center gap-1.5">
            <IconSparkle size={16} />
            {TINGKAT_DETAIL[paket.tingkat_detail]}
          </li>
        </ul>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-lg font-bold tabular-nums">
          <span className="block text-xs font-medium text-muted">Mulai dari</span>
          {rp(paket.harga)}
        </p>
        <ButtonLink href={`/pesan?paket=${paket.id_layanan}`} arrow>
          Pilih paket
        </ButtonLink>
      </div>
    </Card>
  );
}
