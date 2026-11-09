"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "@/lib/actions/auth";

type Field = {
  name: "nama" | "email" | "no_hp" | "password";
  label: string;
  type?: string;
  autoComplete?: string;
};

export function AuthForm({
  title,
  action,
  fields,
  submitLabel,
  footer,
}: {
  title: string;
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  fields: Field[];
  submitLabel: string;
  footer: { text: string; href: string; label: string };
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {},
  );

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <form action={formAction} className="flex flex-col gap-4">
        {state.error && (
          <p role="alert" className="alert-error">
            {state.error}
          </p>
        )}
        {fields.map((f) => (
          <label key={f.name} className="flex flex-col gap-1.5 text-sm font-medium">
            {f.label}
            <input
              name={f.name}
              type={f.type ?? "text"}
              autoComplete={f.autoComplete}
              defaultValue={f.name === "password" ? undefined : state.values?.[f.name]}
              required
              className="input"
            />
            {state.fieldErrors?.[f.name]?.map((msg) => (
              <span key={msg} className="text-xs text-danger">
                {msg}
              </span>
            ))}
          </label>
        ))}
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary"
        >
          {pending ? "Memproses…" : submitLabel}
        </button>
      </form>
      <p className="text-sm text-muted">
        {footer.text}{" "}
        <Link href={footer.href} className="link">
          {footer.label}
        </Link>
      </p>
    </main>
  );
}
