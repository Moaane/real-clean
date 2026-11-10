import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { buttonClass } from "@/components/ui/button";
import { Skeleton } from "@/components/ui";
import { IconPlus } from "@/components/icons";

export function AddLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={buttonClass("primary")}>
      <IconPlus size={18} />
      {children}
    </Link>
  );
}

export function ActiveDot({ active }: { active: boolean }) {
  return (
    <span className={"inline-flex h-6 items-center gap-1.5 rounded-pill px-2.5 text-[11px] font-bold uppercase tracking-wider " + (active ? "bg-ok-soft text-ok" : "bg-neutral-soft text-neutral")}>
      <span className={"size-1.5 rounded-pill " + (active ? "bg-ok" : "bg-neutral")} />
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}

export const th = "pb-3 pr-4 text-[11px] font-semibold uppercase tracking-wider text-muted";

/** Wraps dynamic (DB) content so the page shell can still be prerendered. */
export function Dyn({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div aria-hidden="true" className="grid gap-3">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export async function dynamic() {
  await connection();
}
