import { connection } from "next/server";
import type { ReactNode } from "react";
import { getPaketAktif, TINGKAT_DETAIL, durasiLabel } from "@/lib/katalog";
import { rp } from "@/lib/booking-status";
import { durasiMulai, hargaMulai } from "@/lib/harga";
import { Photo } from "@/components/ui/photo";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { IconClock, IconTag, IconSparkle } from "@/components/icons";

type Tingkat = keyof typeof TINGKAT_DETAIL;
const ORDER: Tingkat[] = ["reguler", "detail", "deep"];
function Kartu({ children }: { children: ReactNode }) {
  return <article className="rounded-lg border border-border bg-surface p-3">{children}</article>;
}

/** Mockup 3: grid tiga kolom (tengah sedikit turun), kartu putih dengan foto + meta ikon. */
export async function Tingkat() {
  await connection();
  const paket = await getPaketAktif();
  const data = ORDER.map((t) => {
    const list = paket.filter((p) => p.tingkat_detail === t);
    if (list.length === 0) return null;
    return {
      key: t,
      jumlah: list.length,
      durasi: Math.min(...list.map(durasiMulai)),
      harga: Math.min(...list.map(hargaMulai)),
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  if (data.length === 0) return null;

  const card = (d: (typeof data)[number]) => (
    <li key={d.key} className="md:[&:nth-child(2)]:mt-12">
    <Kartu>
      <Photo
        name={`tingkat-${d.key}`}
        icon={IconSparkle}
        sizes="(min-width: 1152px) 370px, (min-width: 768px) 30vw, 100vw"
        className="aspect-[4/5] rounded-md"
      />
      <h3 className="mt-3 px-1 text-lg font-semibold">{TINGKAT_DETAIL[d.key]}</h3>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 px-1 pb-1 text-sm text-muted">
        <li className="flex items-center gap-1.5">
          <IconClock size={16} />
          mulai {durasiLabel(d.durasi)}
        </li>
        <li className="flex items-center gap-1.5 tabular-nums">
          <IconTag size={16} />
          mulai {rp(d.harga)}
        </li>
        <li className="flex items-center gap-1.5">
          <IconSparkle size={16} />
          {d.jumlah} jenis properti
        </li>
      </ul>
    </Kartu>
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
