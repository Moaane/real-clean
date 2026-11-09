import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { register } from "@/lib/actions/auth";

async function Form({ searchParams }: { searchParams: PageProps<"/daftar">["searchParams"] }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  return (
    <AuthForm
      title="Buat akun baru"
      subtitle="Daftar gratis, lalu pesan layanan kebersihan dalam hitungan menit."
      action={register}
      submitLabel="Buat akun"
      next={next}
      fields={[
        { name: "nama", label: "Nama lengkap", autoComplete: "name" },
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        { name: "no_hp", label: "No. WhatsApp", type: "tel", autoComplete: "tel" },
        { name: "password", label: "Password (min. 8 karakter)", type: "password", autoComplete: "new-password" },
      ]}
      footer={{ text: "Sudah punya akun?", href: "/login", label: "Masuk" }}
    />
  );
}

export default function RegisterPage(props: PageProps<"/daftar">) {
  return (
    <AuthShell>
      <Suspense fallback={<p className="text-muted">Memuat…</p>}>
        <Form searchParams={props.searchParams} />
      </Suspense>
    </AuthShell>
  );
}
