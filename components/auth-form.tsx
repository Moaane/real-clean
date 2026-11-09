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
          <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        {fields.map((f) => (
          <label key={f.name} className="flex flex-col gap-1 text-sm">
            {f.label}
            <input
              name={f.name}
              type={f.type ?? "text"}
              autoComplete={f.autoComplete}
              defaultValue={f.name === "password" ? undefined : state.values?.[f.name]}
              required
              className="rounded border border-zinc-300 bg-transparent px-3 py-2"
            />
            {state.fieldErrors?.[f.name]?.map((msg) => (
              <span key={msg} className="text-xs text-red-600">
                {msg}
              </span>
            ))}
          </label>
        ))}
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "Memproses…" : submitLabel}
        </button>
      </form>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {footer.text}{" "}
        <Link href={footer.href} className="font-medium underline">
          {footer.label}
        </Link>
      </p>
    </main>
  );
}
