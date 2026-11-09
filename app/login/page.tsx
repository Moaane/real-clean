import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { login } from "@/lib/actions/auth";

async function Form({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  return (
    <AuthForm
      title="Selamat datang kembali"
      subtitle="Masuk untuk memesan dan memantau jadwal kebersihan."
      action={login}
      submitLabel="Masuk"
      next={next}
      fields={[
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
      ]}
      footer={{ text: "Belum punya akun?", href: "/daftar", label: "Daftar sekarang" }}
    />
  );
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <AuthShell>
      <Suspense fallback={<p className="text-muted">Memuat…</p>}>
        <Form searchParams={props.searchParams} />
      </Suspense>
    </AuthShell>
  );
}
