import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";

async function AuthLinks() {
  const user = await getCurrentUser();
  if (user) {
    return (
      <Link href={ROLE_HOME[user.role]} className="btn btn-outline">
        {user.nama}
      </Link>
    );
  }
  return (
    <>
      <Link href="/login" className="btn btn-outline">
        Masuk
      </Link>
      <Link href="/daftar" className="btn btn-primary">
        Daftar
      </Link>
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-5 py-3 sm:px-6">
        <Link href="/" className="mr-auto flex items-center gap-2 text-lg font-bold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm text-white">G</span>
          GoClean
        </Link>
        <Link href="/layanan" className="hidden px-2 text-sm font-medium text-muted hover:text-foreground sm:block">
          Paket &amp; Slot
        </Link>
        <Suspense fallback={null}>
          <AuthLinks />
        </Suspense>
      </div>
    </header>
  );
}
