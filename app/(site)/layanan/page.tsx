import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getPaketAktif, JENIS_PROPERTI, TINGKAT_DETAIL } from "@/lib/katalog";
import { PaketCard } from "@/components/paket-card";
import { ButtonLink, EmptyState, SectionHeading, Skeleton } from "@/components/ui";
import { ChipLink } from "@/components/ui/chip-link";
import { IconSparkle } from "@/components/icons";

export const metadata: Metadata = { title: "Layanan" };

type Params = Promise<{ jenis?: string; tingkat?: string }>;

const href = (jenis?: string, tingkat?: string) => {
  const q = new URLSearchParams();
  if (jenis) q.set("jenis", jenis);
  if (tingkat) q.set("tingkat", tingkat);
  const s = q.toString();
  return s ? `/layanan?${s}` : "/layanan";
};

async function Daftar({ searchParams }: { searchParams: Params }) {
  await connection();
  const sp = await searchParams;
  const jenis = sp.jenis && sp.jenis in JENIS_PROPERTI ? sp.jenis : undefined;
  const tingkat = sp.tingkat && sp.tingkat in TINGKAT_DETAIL ? sp.tingkat : undefined;
  const semua = await getPaketAktif();
  const paket = semua.filter(
    (p) => (!jenis || p.jenis_properti === jenis) && (!tingkat || p.tingkat_detail === tingkat),
  );

  return (
    <>
      <div className="mt-8 flex flex-col gap-3 md:mt-10">
        <nav aria-label="Filter jenis properti" className="flex flex-wrap gap-2">
          <ChipLink href={href(undefined, tingkat)} active={!jenis} scroll={false}>
            Semua
          </ChipLink>
          {(Object.keys(JENIS_PROPERTI) as (keyof typeof JENIS_PROPERTI)[]).map((k) => (
            <ChipLink key={k} href={href(k, tingkat)} active={jenis === k} scroll={false}>
              {JENIS_PROPERTI[k].label}
            </ChipLink>
          ))}
        </nav>
        <nav aria-label="Filter tingkat detail" className="flex flex-wrap gap-2">
          <ChipLink href={href(jenis)} active={!tingkat} scroll={false}>
            Semua tingkat
          </ChipLink>
          {(Object.keys(TINGKAT_DETAIL) as (keyof typeof TINGKAT_DETAIL)[]).map((k) => (
            <ChipLink key={k} href={href(jenis, k)} active={tingkat === k} scroll={false}>
              {TINGKAT_DETAIL[k]}
            </ChipLink>
          ))}
        </nav>
      </div>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {paket.length} paket ditemukan
      </p>

      {paket.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={IconSparkle}
          title="Tidak ada paket yang cocok dengan filter ini."
          action={
            <ButtonLink href="/layanan" variant="outline">
              Hapus filter
            </ButtonLink>
          }
        />
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {paket.map((p) => (
            <li key={p.id_layanan}>
              <PaketCard paket={p} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function DaftarSkeleton() {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-[420px] rounded-lg" />
      ))}
    </div>
  );
}

export default function LayananPage({ searchParams }: { searchParams: Params }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 md:px-6 md:pt-20">
      <SectionHeading
        as="h1"
        accent="Layanan kebersihan"
        after="kami"
        description="Pilih paket rumah atau kos sesuai jumlah kamar dan tingkat kebersihan yang Anda butuhkan."
      />
      <Suspense fallback={<DaftarSkeleton />}>
        <Daftar searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
