"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { IconBuilding, IconChevronLeft, IconChevronRight, IconHome } from "@/components/icons";

export type PaketTile = {
  id: number;
  nama: string;
  jenis: "rumah" | "kos";
  hargaLabel: string;
  /** true bila public/images/paket-<jenis>.webp tersedia. */
  adaFoto: boolean;
};

/** Satu carousel berisi semua paket (rumah dan kos). Panah di kiri, `aksi` di kanan. */
export function PaketCarousel({ items, aksi }: { items: PaketTile[]; aksi?: ReactNode }) {
  const scroller = useRef<HTMLUListElement>(null);

  const [ujung, setUjung] = useState({ start: true, end: true });

  const perbaruiUjung = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setUjung({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    perbaruiUjung();
    el.addEventListener("scroll", perbaruiUjung, { passive: true });
    const ro = new ResizeObserver(perbaruiUjung);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", perbaruiUjung);
      ro.disconnect();
    };
  }, [perbaruiUjung]);

  const bisaGeser = !(ujung.start && ujung.end);

  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollLeft + dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <div className="mt-8 md:mt-10">
      <div className="flex items-center justify-between gap-4">
        <div className={cn("gap-2", bisaGeser ? "flex" : "invisible flex")} aria-hidden={!bisaGeser}>
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => scroll(d)}
              disabled={d === -1 ? ujung.start : ujung.end}
              aria-label={d === -1 ? "Geser ke kiri" : "Geser ke kanan"}
              className="flex size-11 cursor-pointer items-center justify-center rounded-pill border border-border-strong transition duration-150 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              {d === -1 ? <IconChevronLeft /> : <IconChevronRight />}
            </button>
          ))}
        </div>
        {aksi}
      </div>

      <ul
        ref={scroller}
        tabIndex={0}
        aria-label="Daftar paket"
        className="mt-6 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-4 [scrollbar-width:none] md:gap-6 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((p, i) => {
          const Icon = p.jenis === "kos" ? IconBuilding : IconHome;
          return (
            <li key={p.id} className="w-[72%] shrink-0 snap-start sm:w-[44%] lg:w-[30%]">
              <Link href={`/pesan?paket=${p.id}`} className="group block rounded-lg">
                <div
                  className={cn(
                    "relative overflow-hidden rounded-lg bg-surface-2",
                    i % 2 === 0 ? "aspect-square" : "aspect-[4/3]",
                  )}
                >
                  {p.adaFoto ? (
                    <Image
                      src={`/images/paket-${p.jenis}.webp`}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 30vw, 72vw"
                      className="object-cover transition duration-200 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-primary-bright/60">
                      <Icon size={56} strokeWidth={1.25} />
                    </div>
                  )}
                </div>
                <h3 className="mt-3 text-xl font-medium leading-snug group-hover:text-primary-ink">{p.nama}</h3>
                <p className="text-sm text-muted tabular-nums">mulai {p.hargaLabel}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
