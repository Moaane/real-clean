"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { IconBuilding, IconChevronLeft, IconChevronRight, IconHome } from "@/components/icons";

export type PackageTile = {
  id: number;
  name: string;
  type: "house" | "boarding_house";
  priceLabel: string;
  /** true when public/images/paket-<type>.webp exists. */
  hasPhoto: boolean;
};

/** One carousel with all packages (house and boarding house). Arrows on the left, `action` on the right. */
export function PackageCarousel({ items, outcome }: { items: PackageTile[]; outcome?: ReactNode }) {
  const scroller = useRef<HTMLUListElement>(null);

  const [edges, setEdges] = useState({ start: true, end: true });

  const updateEnd = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    updateEnd();
    el.addEventListener("scroll", updateEnd, { passive: true });
    const ro = new ResizeObserver(updateEnd);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateEnd);
      ro.disconnect();
    };
  }, [updateEnd]);

  const canScroll = !(edges.start && edges.end);

  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollLeft + dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <div className="mt-8 md:mt-10">
      <div className="flex items-center justify-between gap-4">
        <div className={cn("gap-2", canScroll ? "flex" : "invisible flex")} aria-hidden={!canScroll}>
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => scroll(d)}
              disabled={d === -1 ? edges.start : edges.end}
              aria-label={d === -1 ? "Geser ke kiri" : "Geser ke kanan"}
              className="flex size-11 cursor-pointer items-center justify-center rounded-pill border border-border-strong transition duration-150 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              {d === -1 ? <IconChevronLeft /> : <IconChevronRight />}
            </button>
          ))}
        </div>
        {outcome}
      </div>

      <ul
        ref={scroller}
        tabIndex={0}
        aria-label="Daftar paket"
        className="mt-6 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-4 [scrollbar-width:none] md:gap-6 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((p, i) => {
          const Icon = p.type === "boarding_house" ? IconBuilding : IconHome;
          return (
            <li key={p.id} className="w-[72%] shrink-0 snap-start sm:w-[44%] lg:w-[30%]">
              <Link href={`/pesan?pkg=${p.id}`} className="group block rounded-lg">
                <div
                  className={cn(
                    "relative overflow-hidden rounded-lg bg-surface-2",
                    i % 2 === 0 ? "aspect-square" : "aspect-[4/3]",
                  )}
                >
                  {p.hasPhoto ? (
                    <Image
                      src={`/images/paket-${p.type}.webp`}
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
                <h3 className="mt-3 text-xl font-medium leading-snug group-hover:text-primary-ink">{p.name}</h3>
                <p className="text-sm text-muted tabular-nums">mulai {p.priceLabel}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
