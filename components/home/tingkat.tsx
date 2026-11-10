import { connection } from "next/server";
import type { ReactNode } from "react";
import { getActivePackages, DETAIL_LEVELS, durationLabel } from "@/lib/katalog";
import { rp } from "@/lib/booking-status";
import { startDuration, startingPrice } from "@/lib/harga";
import { Photo } from "@/components/ui/photo";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { IconClock, IconTag, IconSparkle } from "@/components/icons";

type DetailLevels = keyof typeof DETAIL_LEVELS;
const ORDER: DetailLevels[] = ["regular", "detailed", "deep"];
function LevelCard({ children }: { children: ReactNode }) {
  return <article className="rounded-lg border border-border bg-surface p-3">{children}</article>;
}

/** Mockup 3: three-column grid (middle one slightly lowered), white cards with a photo + icon meta. */
export async function DetailLevels() {
  await connection();
  const pkg = await getActivePackages();
  const data = ORDER.map((t) => {
    const list = pkg.filter((p) => p.detail_level === t);
    if (list.length === 0) return null;
    return {
      key: t,
      amount: list.length,
      duration: Math.min(...list.map(startDuration)),
      price: Math.min(...list.map(startingPrice)),
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  if (data.length === 0) return null;

  const card = (d: (typeof data)[number]) => (
    <li key={d.key} className="md:[&:nth-child(2)]:mt-12">
    <LevelCard>
      <Photo
        name={`tingkat-${d.key}`}
        icon={IconSparkle}
        sizes="(min-width: 1152px) 370px, (min-width: 768px) 30vw, 100vw"
        className="aspect-[4/5] rounded-md"
      />
      <h3 className="mt-3 px-1 text-lg font-semibold">{DETAIL_LEVELS[d.key]}</h3>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 px-1 pb-1 text-sm text-muted">
        <li className="flex items-center gap-1.5">
          <IconClock size={16} />
          mulai {durationLabel(d.duration)}
        </li>
        <li className="flex items-center gap-1.5 tabular-nums">
          <IconTag size={16} />
          mulai {rp(d.price)}
        </li>
        <li className="flex items-center gap-1.5">
          <IconSparkle size={16} />
          {d.amount} jenis properti
        </li>
      </ul>
    </LevelCard>
    </li>
  );

  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 md:px-6 md:pt-24">
      <SectionHeading title="Tiga" accent="tingkat" after="kebersihan">
        <ButtonLink href="/layanan" arrow className="self-start md:self-end">
          Lihat semua paket
        </ButtonLink>
      </SectionHeading>
      <ul className="mt-8 grid gap-4 md:mt-10 md:grid-cols-3 md:items-start md:gap-6">{data.map(card)}</ul>
    </section>
  );
}
