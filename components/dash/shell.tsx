import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import type { Role } from "@/generated/prisma/enums";
import { LogoMark } from "@/components/icons";
import { ProfileMenu } from "@/components/profile-menu";
import { ROLE_LABEL } from "@/components/nav-links";
import { Skeleton } from "@/components/ui";
import { BottomTab, RailLink, type RailItem } from "./rail-link";

async function Gate({ role, items, children }: { role: Role; items: RailItem[]; children: ReactNode }) {
  const user = await requireRole(role); // re-checked on the server (the proxy is optimistic only)
  const menu = [{ href: "/", label: "Lihat situs" }];
  const profile = (dropUp: boolean, align: "left" | "right") => (
    <ProfileMenu
      name={user.name}
      email={user.email}
      roleLabel={ROLE_LABEL[user.role]}
      items={menu}
      logoutAction={logout}
      dropUp={dropUp}
      align={align}
    />
  );

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[72px_1fr] md:gap-4 md:p-4">
      {/* Icon rail (desktop), following the dashboard reference */}
      <aside className="sticky top-4 z-40 hidden h-[calc(100dvh-2rem)] flex-col items-center justify-between rounded-xl border border-border bg-surface py-4 md:flex">
        <div className="flex flex-col items-center gap-2">
          <Link href="/" aria-label="Real Clean, ke beranda" className="mb-3 transition duration-300 hover:rotate-12 hover:scale-110">
            <LogoMark size={40} />
          </Link>
          <nav aria-label="Navigasi dashboard" className="flex flex-col items-center gap-2">
            {items.map((it) => (
              <RailLink key={it.href} item={it} />
            ))}
          </nav>
        </div>
        {profile(true, "left")}
      </aside>

      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur md:hidden">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <LogoMark size={28} />
          Real Clean
        </Link>
        {profile(false, "right")}
      </header>

      <main id="konten" className="min-w-0 px-4 pb-24 pt-6 md:px-2 md:pb-8 md:pt-2">
        {children}
      </main>

      <nav
        aria-label="Navigasi dashboard"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface/95 shadow-overlay backdrop-blur md:hidden"
      >
        {items.map((it) => (
          <BottomTab key={it.href} item={it} />
        ))}
      </nav>
    </div>
  );
}

/** Dashboard shell (admin/staff). The session is read inside Suspense so the shell can be prerendered. */
export function DashShell({ role, items, children }: { role: Role; items: RailItem[]; children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="p-6" aria-hidden="true">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="mt-6 h-64 rounded-xl" />
        </div>
      }
    >
      <Gate role={role} items={items}>
        {children}
      </Gate>
    </Suspense>
  );
}
