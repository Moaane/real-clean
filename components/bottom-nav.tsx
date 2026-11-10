"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { cn } from "@/lib/cn";
import {
  IconCalendar,
  IconGrid,
  IconHome,
  IconReceipt,
  IconSparkle,
  IconUser,
  type IconProps,
} from "@/components/icons";

type Item = { href: string; label: string; icon: ComponentType<IconProps>; match: (p: string) => boolean };
export type BottomNavRole = "admin" | "staff" | "customer" | null;

const home: Item = { href: "/", label: "Beranda", icon: IconHome, match: (p) => p === "/" };
const service: Item = { href: "/layanan", label: "Layanan", icon: IconSparkle, match: (p) => p.startsWith("/layanan") };
const message: Item = { href: "/pesan", label: "Pesan", icon: IconCalendar, match: (p) => p.startsWith("/pesan") };

function itemsFor(role: BottomNavRole): Item[] {
  if (role === "customer")
    return [home, service, message, { href: "/akun", label: "Booking", icon: IconReceipt, match: (p) => p.startsWith("/akun") }];
  if (role === "admin")
    return [home, service, { href: "/admin", label: "Dashboard", icon: IconGrid, match: (p) => p.startsWith("/admin") }];
  if (role === "staff")
    return [home, service, { href: "/karyawan", label: "Tugas", icon: IconReceipt, match: (p) => p.startsWith("/karyawan") }];
  // Guest: no Booking/Account, replaced by Login.
  return [home, service, message, { href: "/login", label: "Masuk", icon: IconUser, match: (p) => p === "/login" || p === "/daftar" }];
}

/** Bottom nav (mobile). Hidden in the order flow and on auth pages. */
export function BottomNav({ role }: { role: BottomNavRole }) {
  const pathname = usePathname();
  if (pathname.startsWith("/pesan") || pathname === "/login" || pathname === "/daftar") return null;
  const items = itemsFor(role);
  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 shadow-overlay backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-md">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold transition duration-150",
                  active ? "text-primary-ink" : "text-muted",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-14 items-center justify-center rounded-pill transition duration-200 group-active:scale-90",
                    active && "bg-primary-soft",
                  )}
                >
                  <Icon size={22} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
