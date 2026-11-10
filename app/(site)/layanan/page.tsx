import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getActivePackages, PROPERTY_TYPES, DETAIL_LEVELS } from "@/lib/katalog";
import { PackageCard } from "@/components/paket-card";
import { ButtonLink, EmptyState, SectionHeading, Skeleton } from "@/components/ui";
import { ChipLink } from "@/components/ui/chip-link";
import { IconSparkle } from "@/components/icons";

export const metadata: Metadata = { title: "Layanan" };

type Params = Promise<{ type?: string; level?: string }>;

const href = (type?: string, level?: string) => {
  const q = new URLSearchParams();
  if (type) q.set("type", type);
  if (level) q.set("level", level);
  const s = q.toString();
  return s ? `/layanan?${s}` : "/layanan";
};

async function List({ searchParams }: { searchParams: Params }) {
  await connection();
  const sp = await searchParams;
  const type = sp.type && sp.type in PROPERTY_TYPES ? sp.type : undefined;
  const level = sp.level && sp.level in DETAIL_LEVELS ? sp.level : undefined;
  const allPkgs = await getActivePackages();
  const pkg = allPkgs.filter(
    (p) => (!type || p.property_type === type) && (!level || p.detail_level === level),
  );

  return (
    <>
      <div className="mt-8 flex flex-col gap-3 md:mt-10">
        <nav aria-label="Filter jenis properti" className="flex flex-wrap gap-2">
          <ChipLink href={href(undefined, level)} active={!type} scroll={false}>
            Semua
          </ChipLink>
          {(Object.keys(PROPERTY_TYPES) as (keyof typeof PROPERTY_TYPES)[]).map((k) => (
            <ChipLink key={k} href={href(k, level)} active={type === k} scroll={false}>
              {PROPERTY_TYPES[k].label}
            </ChipLink>
          ))}
        </nav>
        <nav aria-label="Filter tingkat detail" className="flex flex-wrap gap-2">
          <ChipLink href={href(type)} active={!level} scroll={false}>
            Semua tingkat
          </ChipLink>
          {(Object.keys(DETAIL_LEVELS) as (keyof typeof DETAIL_LEVELS)[]).map((k) => (
            <ChipLink key={k} href={href(type, k)} active={level === k} scroll={false}>
              {DETAIL_LEVELS[k]}
            </ChipLink>
          ))}
        </nav>
      </div>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {pkg.length} paket ditemukan
      </p>

      {pkg.length === 0 ? (
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
          {pkg.map((p) => (
            <li key={p.id_service}>
              <PackageCard pkg={p} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function RegisterSkeleton() {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-[420px] rounded-lg" />
      ))}
    </div>
  );
}

export default function ServicesPage({ searchParams }: { searchParams: Params }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 md:px-6 md:pt-20">
      <SectionHeading
        as="h1"
        accent="Layanan kebersihan"
        after="kami"
        description="Pilih paket rumah atau kos sesuai jumlah kamar dan tingkat kebersihan yang Anda butuhkan."
      />
      <Suspense fallback={<RegisterSkeleton />}>
        <List searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
