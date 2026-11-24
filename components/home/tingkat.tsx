import { Photo } from "@/components/ui/photo";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { IconSparkle } from "@/components/icons";
import { LevelCardsLoader } from "./paket-list";

const LEVELS = ["regular", "detailed", "deep"] as const;

/** Static shell: heading and photos (server-only) render immediately, the numbers load on the client. */
export function DetailLevels() {
  const photos = Object.fromEntries(
    LEVELS.map((k) => [
      k,
      <Photo
        key={k}
        name={`tingkat-${k}`}
        icon={IconSparkle}
        placeholderImage
        sizes="(min-width: 1152px) 370px, (min-width: 768px) 30vw, 100vw"
        className="aspect-[4/5] rounded-md"
      />,
    ]),
  ) as Record<(typeof LEVELS)[number], React.ReactNode>;

  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 md:px-6 md:pt-24">
      <SectionHeading title="Tiga" accent="tingkat" after="kebersihan">
        <ButtonLink href="/layanan" arrow className="self-start md:self-end">
          Lihat semua paket
        </ButtonLink>
      </SectionHeading>
      <LevelCardsLoader photos={photos} />
    </section>
  );
}
