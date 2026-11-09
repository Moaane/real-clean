"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "@/lib/actions/auth";
import { Icon } from "./icons";

type Field = {
  name: "nama" | "email" | "no_hp" | "password";
  label: string;
  type?: string;
  autoComplete?: string;
};

export function AuthForm({
  title,
  subtitle,
  action,
  fields,
  submitLabel,
  footer,
  next,
}: {
  title: string;
  subtitle: string;
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  fields: Field[];
  submitLabel: string;
  footer: { text: string; href: string; label: string };
  next?: string;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});
  const footerHref = next ? `${footer.href}?next=${encodeURIComponent(next)}` : footer.href;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
      <form action={formAction} className="card flex flex-col gap-4">
        {next && <input type="hidden" name="next" value={next} />}
        {state.error && (
          <p role="alert" className="alert-error">
            {state.error}
          </p>
        )}
        {fields.map((f) => (
          <label key={f.name} className="label">
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
              <span key={msg} className="text-xs font-medium text-danger">
                {msg}
              </span>
            ))}
          </label>
        ))}
        <button type="submit" disabled={pending} className="btn btn-primary mt-1">
          {pending ? "Memproses…" : submitLabel}
          {!pending && <Icon name="arrow" size={18} />}
        </button>
      </form>
      <p className="text-center text-sm text-muted">
        {footer.text}{" "}
        <Link href={footerHref} className="link">
          {footer.label}
        </Link>
      </p>
    </div>
  );
}
