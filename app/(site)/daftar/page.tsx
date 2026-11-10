import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";
import { AuthShell, AuthSkeleton } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Daftar" };

async function Content({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [user, { next }] = await Promise.all([getCurrentUser(), searchParams]);
  if (user) redirect(ROLE_HOME[user.role]);
  return (
    <AuthShell title="Buat akun" accent="Real Clean" description="Daftar gratis untuk memesan layanan kebersihan.">
      <RegisterForm next={next} />
    </AuthShell>
  );
}

export default function DaftarPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
