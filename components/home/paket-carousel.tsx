"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Chip } from "@/components/ui";
import { IconBuilding, IconChevronLeft, IconChevronRight, IconHome } from "@/components/icons";

export type PaketTile = {
  id: number;
  nama: string;
  jenis: "rumah" | "kos";
  hargaLabel: string;
  /** true bila public/images/paket-<jenis>.webp tersedia. */
  adaFoto: boolean;
};

const FILTERS = [
  { key: "rumah", label: "Rumah" },
  { key: "kos", label: "Kos" },
] as const;

/** Mockup 2: chip kategori + panah, lalu baris kartu foto yang bisa digeser. */
export function PaketCarousel({ items }: { items: PaketTile[] }) {
  const ada = FILTERS.filter((f) => items.some((i) => i.jenis === f.key));
  const [jenis, setJenis] = useState<"rumah" | "kos">(ada[0]?.key ?? "rumah");
  const scroller = useRef<HTMLUListElement>(null);
  const shown = items.filter((i) => i.jenis === jenis);

  const scroll = (dir: 1 | -1) =>
    scroller.current?.scrollBy({ left: dir * Math.round(scroller.current.clientWidth * 0.8), behavior: "smooth" });

  return (
    <div className="mt-8 md:mt-10">
      <div className="flex items-center justify-between gap-4">
        <div role="radiogroup" aria-label="Jenis properti" className="flex flex-wrap gap-2">
          {ada.map((f) => (
            <Chip key={f.key} active={jenis === f.key} onClick={() => setJenis(f.key)}>
              {f.label}
            </Chip>
          ))}
        </div>
        <div className="hidden gap-2 md:flex">
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => scroll(d)}
              aria-label={d === -1 ? "Geser ke kiri" : "Geser ke kanan"}
              className="flex size-11 cursor-pointer items-center justify-center rounded-pill border border-border-strong transition duration-150 hover:bg-surface-2"
            >
              {d === -1 ? <IconChevronLeft /> : <IconChevronRight />}
            </button>
          ))}
        </div>
      </div>

      <ul
        ref={scroller}
        tabIndex={0}
        aria-label="Daftar paket"
        className="mt-6 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-4 [scrollbar-width:none] md:gap-6 [&::-webkit-scrollbar]:hidden"
      >
        {shown.map((p, i) => {
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
