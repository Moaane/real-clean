import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";
import { Icon } from "./icons";

export function Brand({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 text-lg font-bold tracking-tight ${className}`}>
      <span className="grid size-8 place-items-center rounded-md bg-primary text-on-primary">
        <Icon name="sparkle" size={20} />
      </span>
      GoClean
    </Link>
  );
}

const NAV = [
  { href: "/#paket", label: "Layanan" },
  { href: "/#cara", label: "Cara Kerja" },
  { href: "/akun", label: "Booking Saya" },
];

async function AuthLinks() {
  const user = await getCurrentUser();
  if (user) {
    return (
      <Link href={ROLE_HOME[user.role]} className="btn btn-outline">
        <Icon name="user" size={18} />
        <span className="max-w-32 truncate">{user.nama}</span>
      </Link>
    );
  }
  return (
    <>
      <Link href="/login" className="btn btn-outline">
        Masuk
      </Link>
      <Link href="/daftar" className="btn btn-primary hidden sm:inline-flex">
        Daftar
      </Link>
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6 md:h-16">
        <Brand className="mr-auto md:mr-0" />
        <nav aria-label="Navigasi utama" className="hidden flex-1 items-center justify-center gap-2 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="inline-flex h-10 items-center rounded-pill px-4 text-[0.9375rem] font-medium transition-colors duration-150 hover:bg-primary-soft hover:text-on-primary-soft"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Suspense fallback={null}>
          <AuthLinks />
        </Suspense>
        {/* No-JS mobile menu: <details> toggles the panel. */}
        <details className="group md:hidden">
          <summary
            aria-label="Menu navigasi"
            className="grid size-11 cursor-pointer list-none place-items-center rounded-pill border border-border-strong marker:content-none [&::-webkit-details-marker]:hidden"
          >
            <Icon name="menu" size={22} className="group-open:hidden" />
            <Icon name="close" size={22} className="hidden group-open:block" />
          </summary>
          <nav
            aria-label="Navigasi seluler"
            className="absolute inset-x-0 top-full border-b border-border bg-surface px-4 pb-4 pt-2 shadow-(--shadow-pop)"
          >
            <ul className="mx-auto flex max-w-6xl flex-col">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="flex min-h-11 items-center rounded-md px-3 font-medium hover:bg-primary-soft">
                    {n.label}
                  </Link>
                </li>
              ))}
              <li className="sm:hidden">
                <Link href="/daftar" className="flex min-h-11 items-center rounded-md px-3 font-medium text-primary">
                  Daftar
                </Link>
              </li>
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Brand />
        <p>Jasa kebersihan panggilan untuk rumah &amp; kos-kosan.</p>
      </div>
    </footer>
  );
}
