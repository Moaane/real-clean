"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconPlus } from "@/components/icons";

/** Accordion eksklusif: hanya satu item terbuka. Animasi tinggi lewat grid-rows 0fr→1fr. */
export function Accordion({ items }: { items: { q: string; a: ReactNode }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const base = useId();

  return (
    <div className="flex flex-col gap-3">
      {items.map((it, i) => {
        const on = open === i;
        return (
          <div
            key={it.q}
            className={cn(
              "rounded-lg border bg-surface px-5 transition duration-300 md:px-6",
              on ? "border-primary/50 shadow-sm" : "border-border hover:border-border-strong",
            )}
          >
            <h3>
              <button
                type="button"
                aria-expanded={on}
                aria-controls={`${base}-${i}`}
                onClick={() => setOpen(on ? null : i)}
                className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 py-3 text-left font-semibold"
              >
                {it.q}
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-pill transition duration-300",
                    on ? "rotate-[135deg] bg-primary text-on-primary" : "bg-surface-2 text-muted",
                  )}
                >
                  <IconPlus size={16} />
                </span>
              </button>
            </h3>
            <div
              id={`${base}-${i}`}
              role="region"
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
                on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden" inert={!on}>
                <div className="pb-5 text-muted">{it.a}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
