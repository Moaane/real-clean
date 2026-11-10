import { connection } from "next/server";
import { getActivePackages } from "@/lib/katalog";
import { rp } from "@/lib/booking-status";
import { startingPrice } from "@/lib/harga";
import { ButtonLink, EmptyState, SectionHeading } from "@/components/ui";
import { IconSparkle } from "@/components/icons";
import { hasPhoto } from "@/components/ui/photo";
import { PackageCarousel, type PackageTile } from "./paket-carousel";

/** Mockup 2: title on the left, description on the right, chips + photo card carousel. */
export async function ServicesSection() {
  await connection();
  const pkg = await getActivePackages();
  const items: PackageTile[] = pkg.map((p) => ({
    id: p.id_service,
    name: p.service_name,
    type: p.property_type,
    priceLabel: rp(startingPrice(p)),
    hasPhoto: hasPhoto(`paket-${p.property_type}`),
  }));

  return (
    <section id="layanan" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-16 md:px-6 md:pt-24">
      <SectionHeading
        accent="Layanan kebersihan"
        after="kami"
        description="Dari kebersihan rutin sampai deep cleaning, kami memastikan hunian dan kos Anda selalu bersih dan higienis."
      />
      {items.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={IconSparkle}
          title="Paket layanan belum tersedia. Silakan kembali lagi nanti."
        />
      ) : (
        <PackageCarousel
          items={items}
          outcome={
            <ButtonLink href="/layanan" variant="outline" arrow>
              Lihat semua paket
            </ButtonLink>
          }
        />
      )}
    </section>
  );
}
