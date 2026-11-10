import type { Service } from "@/generated/prisma/client";
import { Photo } from "@/components/ui/photo";
import { ButtonLink, Card } from "@/components/ui";
import { IconBuilding, IconClock, IconHome, IconSparkle } from "@/components/icons";
import { PROPERTY_TYPES, DETAIL_LEVELS, durationLabel } from "@/lib/katalog";
import { rp } from "@/lib/booking-status";
import { startDuration, startingPrice, roomRange } from "@/lib/harga";

/** Full package card (DESIGN §6.3), used on /layanan and step 1 of the order flow. */
export function PackageCard({ pkg }: { pkg: Service }) {
  const Icon = pkg.property_type === "boarding_house" ? IconBuilding : IconHome;
  return (
    <Card variant="interactive" className="flex h-full flex-col gap-4">
      <Photo
        name={`paket-${pkg.property_type}`}
        alt=""
        icon={Icon}
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        className="aspect-[4/3] rounded-lg"
      />
      <div className="flex flex-1 flex-col gap-2">
        <h3 className="text-lg font-semibold leading-snug">{pkg.service_name}</h3>
        {pkg.description && <p className="line-clamp-3 text-sm text-muted">{pkg.description}</p>}
        <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted">
          <li className="flex items-center gap-1.5">
            <IconClock size={16} />
            mulai {durationLabel(startDuration(pkg))}
          </li>
          <li className="flex items-center gap-1.5">
            <Icon size={16} />
            {PROPERTY_TYPES[pkg.property_type].label}, {roomRange(pkg)}
          </li>
          <li className="flex items-center gap-1.5">
            <IconSparkle size={16} />
            {DETAIL_LEVELS[pkg.detail_level]}
          </li>
        </ul>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-lg font-bold tabular-nums">
          <span className="block text-xs font-medium text-muted">Mulai dari</span>
          {rp(startingPrice(pkg))}
          {pkg.price_per_room > 0 && (
            <span className="block text-xs font-medium text-muted">+ {rp(pkg.price_per_room)} per kamar tambahan</span>
          )}
        </p>
        <ButtonLink href={`/pesan?pkg=${pkg.id_service}`} arrow>
          Pilih paket
        </ButtonLink>
      </div>
    </Card>
  );
}
