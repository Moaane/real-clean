import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { IconArrowRight, LogoMark } from "@/components/icons";
import { KONTAK } from "@/lib/kontak";
import { Button, ButtonLink } from "@/components/ui";
import { NavLink } from "./nav-link";
import { NavbarMobile } from "./navbar-mobile";
import { ProfileMenu } from "./profile-menu";
import { ROLE_LABEL, navLinks, profileItems } from "./nav-links";


/** Tombol hitam "Hubungi kami" (mockup 6). */
function HubungiButton({ className }: { className?: string }) {
  return (
    <a
      href={KONTAK.waHref}
      target="_blank"
      rel="noreferrer"
      className={
        "group/c inline-flex h-11 items-center gap-2 rounded-pill bg-foreground py-1 pl-1.5 pr-5 text-sm font-semibold text-background transition duration-200 hover:bg-foreground/85 active:scale-95 " +
        (className ?? "")
      }
    >
      <span className="flex size-8 items-center justify-center rounded-pill border border-background/40 transition duration-200 group-hover/c:rotate-45">
        <IconArrowRight size={14} className="-rotate-45" />
      </span>
      Hubungi kami
    </a>
  );
}

/** Kiri: menu. Kanan: akun + Hubungi kami. Logo di tengah (diatur di Navbar). */
async function DesktopNav() {
  const user = await getCurrentUser();
  const links = navLinks(user?.role);
  return (
    <>
      <nav aria-label="Menu utama" className="hidden items-center gap-1 md:flex">
        {links.map((l) => (
          <NavLink key={l.href} href={l.href}>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="hidden items-center gap-2 md:flex">
        {user ? (
          <ProfileMenu
            nama={user.nama}
            email={user.email}
            roleLabel={ROLE_LABEL[user.role]}
            items={profileItems(user.role)}
            logoutAction={logout}
          />
        ) : (
          <NavLink href="/login">Masuk</NavLink>
        )}
        <HubungiButton />
      </div>
    </>
  );
}

async function MobileMenu() {
  const user = await getCurrentUser();
  return (
    <NavbarMobile links={navLinks(user?.role)}>
      {user ? (
        <>
          <div className="flex items-center gap-3 px-1">
            <span className="flex size-10 items-center justify-center rounded-pill bg-primary font-bold text-on-primary">
              {user.nama.trim().slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.nama}</p>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
          </div>
          <form action={logout}>
            <Button type="submit" variant="outline" className="w-full">
              Keluar
            </Button>
          </form>
        </>
      ) : (
        <>
          <ButtonLink href="/login" variant="outline" className="w-full">
            Masuk
          </ButtonLink>
          <ButtonLink href="/daftar" className="w-full">
            Daftar
          </ButtonLink>
        </>
      )}
    </NavbarMobile>
  );
}

/** Bar navigasi dalam kartu membulat (mockup 1). */
export function Navbar() {
  const publik = navLinks(null);
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 md:px-6">
      <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-xl border border-border bg-surface/90 px-4 backdrop-blur md:h-[72px] md:px-6">
        <Link href="/" className="group order-first flex shrink-0 items-center gap-2 rounded-pill text-lg font-bold md:pointer-events-auto md:absolute md:left-1/2 md:order-none md:-translate-x-1/2">
          <span className="transition duration-300 group-hover:rotate-[20deg] group-hover:scale-110">
            <LogoMark size={32} />
          </span>
          GoClean
        </Link>

        {/* Menu bergantung pada sesi dan pathname (client), jadi dibungkus Suspense; fallback = tautan tamu statis. */}
        <Suspense
          fallback={
            <>
              <nav aria-label="Menu utama" className="hidden items-center gap-1 md:flex">
                {publik.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="inline-flex h-10 items-center rounded-pill px-4 text-[15px] font-medium"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
              <div className="hidden md:block"><HubungiButton /></div>
            </>
          }
        >
          <DesktopNav />
        </Suspense>

        <Suspense fallback={<span aria-hidden="true" className="size-11 md:hidden" />}>
          <MobileMenu />
        </Suspense>
      </div>
    </header>
  );
}
