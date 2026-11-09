import { AuthForm } from "@/components/auth-form";
import { register } from "@/lib/actions/auth";

export default function RegisterPage() {
  return (
    <AuthForm
      title="Daftar"
      action={register}
      submitLabel="Buat akun"
      fields={[
        { name: "nama", label: "Nama lengkap", autoComplete: "name" },
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        { name: "no_hp", label: "No. WA", type: "tel", autoComplete: "tel" },
        { name: "password", label: "Password (min. 8 karakter)", type: "password", autoComplete: "new-password" },
      ]}
      footer={{ text: "Sudah punya akun?", href: "/login", label: "Masuk" }}
    />
  );
}
