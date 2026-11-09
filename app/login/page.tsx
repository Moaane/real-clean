import { AuthForm } from "@/components/auth-form";
import { login } from "@/lib/actions/auth";

export default function LoginPage() {
  return (
    <AuthForm
      title="Masuk"
      action={login}
      submitLabel="Masuk"
      fields={[
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
      ]}
      footer={{ text: "Belum punya akun?", href: "/daftar", label: "Daftar" }}
    />
  );
}
