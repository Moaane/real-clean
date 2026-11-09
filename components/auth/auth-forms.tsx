"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type AuthState } from "@/lib/actions/auth";
import { Alert, Button, Input, PasswordInput } from "@/components/ui";

const initial: AuthState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, initial);
  return (
    <form action={action} className="flex flex-col gap-5">
      {next && <input type="hidden" name="next" value={next} />}
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <Input
        name="email"
        type="email"
        label="Email"
        required
        autoComplete="email"
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email?.[0]}
      />
      <PasswordInput
        name="password"
        label="Kata sandi"
        required
        autoComplete="current-password"
        error={state.fieldErrors?.password?.[0]}
      />
      <Button type="submit" size="lg" arrow loading={pending} className="w-full">
        Masuk
      </Button>
      <p className="text-center text-sm text-muted">
        Belum punya akun?{" "}
        <Link
          href={next ? `/daftar?next=${encodeURIComponent(next)}` : "/daftar"}
          className="font-semibold text-primary-ink underline-offset-2 hover:underline"
        >
          Daftar
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(register, initial);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-5">
      {next && <input type="hidden" name="next" value={next} />}
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <Input
        name="nama"
        label="Nama lengkap"
        required
        autoComplete="name"
        defaultValue={state.values?.nama}
        error={fe.nama?.[0]}
      />
      <Input
        name="email"
        type="email"
        label="Email"
        required
        autoComplete="email"
        defaultValue={state.values?.email}
        error={fe.email?.[0]}
      />
      <Input
        name="no_hp"
        type="tel"
        inputMode="tel"
        label="Nomor WhatsApp"
        required
        autoComplete="tel"
        hint="Contoh: 08123456789"
        defaultValue={state.values?.no_hp}
        error={fe.no_hp?.[0]}
      />
      <PasswordInput
        name="password"
        label="Kata sandi"
        required
        autoComplete="new-password"
        hint="Minimal 8 karakter."
        error={fe.password?.[0]}
      />
      <Button type="submit" size="lg" arrow loading={pending} className="w-full">
        Buat akun
      </Button>
      <p className="text-center text-sm text-muted">
        Sudah punya akun?{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="font-semibold text-primary-ink underline-offset-2 hover:underline"
        >
          Masuk
        </Link>
      </p>
    </form>
  );
}
