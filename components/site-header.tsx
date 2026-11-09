import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";

async function AuthLinks() {
  const user = await getCurrentUser();
  if (user) {
    return (
      <Link href={ROLE_HOME[user.role]} className="underline">
        {user.nama}
      </Link>
    );
  }
  return (
    <>
      <Link href="/login" className="underline">
        Masuk
      </Link>
      <Link href="/daftar" className="underline">
        Daftar
      </Link>
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center gap-4 border-b border-zinc-300 px-6 py-3 text-sm">
      <Link href="/" className="mr-auto text-base font-semibold">
        GoClean
      </Link>
      <Link href="/layanan" className="underline-offset-4 hover:underline">
        Paket & Slot
      </Link>
      <Suspense fallback={null}>
        <AuthLinks />
      </Suspense>
    </header>
  );
}
