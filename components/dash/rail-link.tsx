"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { IconCalendar, IconGrid, IconReceipt, IconTag, IconUsers } from "@/components/icons";

// Fungsi tidak bisa dilewatkan dari Server ke Client Component, jadi ikon dipilih lewat nama.
const ICONS = { grid: IconGrid, tag: IconTag, calendar: IconCalendar, users: IconUsers, receipt: IconReceipt };
export type RailItem = { href: string; label: string; icon: keyof typeof ICONS; exact?: boolean };

function useActive(item: RailItem) {
  const p = usePathname();
  return item.exact ? p === item.href : p === item.href || p.startsWith(item.href + "/");
}

/** Ikon rail (desktop) dengan tooltip. */
export function RailLink({ item }: { item: RailItem }) {
  const active = useActive(item);
  const Icon = ICONS[item.icon];
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative z-50 flex size-11 items-center justify-center rounded-md border transition duration-200 hover:scale-105 active:scale-95",
        active
          ? "border-primary bg-primary-soft text-primary-ink"
          : "border-transparent text-muted hover:bg-surface-2 hover:text-foreground",
      )}
    >
      <Icon size={22} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-full z-30 ml-3 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-xs font-semibold text-background opacity-0 transition duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {item.label}
      </span>
    </Link>
  );
}

/** Tab bar bawah (mobile). */
export function BottomTab({ item }: { item: RailItem }) {
  const active = useActive(item);
  const Icon = ICONS[item.icon];
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition duration-150",
        active ? "text-primary-ink" : "text-muted",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-12 items-center justify-center rounded-pill transition duration-200 group-active:scale-90",
          active && "bg-primary-soft",
        )}
      >
        <Icon size={20} />
      </span>
      {item.label}
    </Link>
  );
}
