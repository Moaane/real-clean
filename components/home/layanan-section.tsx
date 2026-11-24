import { SectionHeading } from "@/components/ui";
import { hasPhoto } from "@/components/ui/photo";
import { PackageCarouselLoader } from "./paket-list";

/** Static shell: the heading renders immediately, the packages load on the client (/api/paket) behind a skeleton. */
export function ServicesSection() {
  const photos = { house: hasPhoto("paket-house"), boarding_house: hasPhoto("paket-boarding_house") };
  return (
    <section id="layanan" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-16 md:px-6 md:pt-24">
      <SectionHeading
        accent="Layanan kebersihan"
        after="kami"
        description="Dari kebersihan rutin sampai deep cleaning, kami memastikan hunian dan kos Anda selalu bersih dan higienis."
      />
      <PackageCarouselLoader photos={photos} />
    </section>
  );
}
