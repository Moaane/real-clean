"use client";

import type { ReactNode } from "react";
import { useApi } from "@/lib/use-api";
import { DETAIL_LEVELS, type PackageDTO } from "@/lib/paket-dto";
import { rp } from "@/lib/booking-status";
import { pricingOf } from "@/lib/paket-dto";
import { durationLabel, startDuration, startingPrice } from "@/lib/harga";
import { ButtonLink, EmptyState, Skeleton } from "@/components/ui";
import { IconClock, IconSparkle, IconTag } from "@/components/icons";
import { PackageCarousel, type PackageTile } from "./paket-carousel";
import { QuickBook } from "./quick-book";

/** Shared by the home sections: one cached request to /api/paket, with a retry on failure. */
function usePackages() {
  const { data, fetching, error, retry } = useApi<{ packages: PackageDTO[] }>("/api/paket");
  return { list: data?.packages, loading: !data && fetching, failed: !data && error, retry };
}

function Failed({ retry, className }: { retry: () => void; className?: string }) {
  return (
    <div className={className}>
      <p className="rounded-lg bg-surface-2 p-6 text-center text-sm text-muted">
        Data paket gagal dimuat.{" "}
        <button type="button" onClick={retry} className="cursor-pointer font-semibold text-primary-ink underline underline-offset-2">
          Coba lagi
        </button>
      </p>
    </div>
  );
}

export function PackageCarouselLoader({ photos }: { photos: Record<PackageDTO["type"], boolean> }) {
  const { list, loading, failed, retry } = usePackages();

  if (loading) {
    return (
      <div aria-hidden="true" className="mt-8 md:mt-10">
        <Skeleton className="h-11 w-40 rounded-pill" />
        <div className="mt-6 flex gap-4 overflow-hidden md:gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-[72%] shrink-0 sm:w-[44%] lg:w-[30%]">
              <Skeleton className={i % 2 === 0 ? "aspect-square rounded-lg" : "aspect-[4/3] rounded-lg"} />
              <Skeleton className="mt-3 h-6 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (failed || !list) return <Failed retry={retry} className="mt-10" />;
  if (list.length === 0) {
    return <EmptyState className="mt-10" icon={IconSparkle} title="Paket layanan belum tersedia. Silakan kembali lagi nanti." />;
  }

  const items: PackageTile[] = list.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    priceLabel: rp(startingPrice(pricingOf(p))),
    hasPhoto: photos[p.type],
  }));
  return (
    <PackageCarousel
      items={items}
      outcome={
        <ButtonLink href="/layanan" variant="outline" arrow>
          Lihat semua paket
        </ButtonLink>
      }
    />
  );
}

export function QuickBookLoader() {
  const { list, loading, failed, retry } = usePackages();

  if (loading) {
    return (
      <div aria-hidden="true" className="flex flex-col gap-5 rounded-xl border border-border bg-background p-5 md:p-7">
        <Skeleton className="h-[68px] rounded-pill" />
        <Skeleton className="h-[68px] rounded-pill" />
        <Skeleton className="h-[104px] rounded-lg" />
        <Skeleton className="h-[176px] rounded-lg" />
      </div>
    );
  }
  if (failed || !list) return <Failed retry={retry} />;
  if (list.length === 0) {
    return <div className="rounded-xl bg-surface p-6 text-center text-muted">Paket belum tersedia. Silakan kembali lagi nanti.</div>;
  }
  return <QuickBook pkg={list} />;
}

const LEVEL_ORDER = ["regular", "detailed", "deep"] as const;

export function LevelCardsLoader({ photos }: { photos: Record<(typeof LEVEL_ORDER)[number], ReactNode> }) {
  const { list, loading, failed, retry } = usePackages();
  const ul = "mt-8 grid gap-4 md:mt-10 md:grid-cols-3 md:items-start md:gap-6";

  if (loading) {
    return (
      <ul aria-hidden="true" className={ul}>
        {LEVEL_ORDER.map((k) => (
          <li key={k} className="md:[&:nth-child(2)]:mt-12">
            <div className="rounded-lg border border-border bg-surface p-3">
              <Skeleton className="aspect-[4/5] rounded-md" />
              <Skeleton className="mt-3 h-6 w-1/2" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
          </li>
        ))}
      </ul>
    );
  }
  if (failed || !list) return <Failed retry={retry} className="mt-8" />;

  const data = LEVEL_ORDER.map((key) => {
    const group = list.filter((p) => p.levelKey === key);
    if (group.length === 0) return null;
    return {
      key,
      amount: group.length,
      duration: Math.min(...group.map((p) => startDuration(pricingOf(p)))),
      price: Math.min(...group.map((p) => startingPrice(pricingOf(p)))),
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);
  if (data.length === 0) return null;

  return (
    <ul className={ul}>
      {data.map((d) => (
        <li key={d.key} className="md:[&:nth-child(2)]:mt-12">
          <article className="rounded-lg border border-border bg-surface p-3">
            {photos[d.key]}
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
          </article>
        </li>
      ))}
    </ul>
  );
}
