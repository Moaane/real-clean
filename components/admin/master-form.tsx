"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/lib/form-state";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "time" | "password" | "textarea" | "select" | "checkbox";
  options?: { value: string; label: string }[];
  hint?: string;
  required?: boolean;
  autoComplete?: string;
};

const inputClass = "rounded border border-zinc-300 bg-transparent px-3 py-2";

export function MasterForm({
  action,
  fields,
  initial,
  submitLabel,
  cancelHref,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  fields: FieldDef[];
  initial: Record<string, string>;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const values = state.values ?? initial;

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      {state.error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {fields.map((f) => {
        const type = f.type ?? "text";
        const errors = state.fieldErrors?.[f.name];
        const common = {
          name: f.name,
          required: f.required ?? type !== "checkbox",
          className: inputClass,
        };
        return (
          <label
            key={f.name}
            className={
              type === "checkbox" ? "flex items-center gap-2 text-sm" : "flex flex-col gap-1 text-sm"
            }
          >
            {type === "checkbox" ? (
              <>
                <input
                  type="checkbox"
                  name={f.name}
                  defaultChecked={state.values ? values[f.name] === "on" : initial[f.name] === "on"}
                />
                {f.label}
              </>
            ) : (
              <>
                {f.label}
                {type === "textarea" ? (
                  <textarea {...common} rows={4} defaultValue={values[f.name] ?? ""} required={f.required ?? false} />
                ) : type === "select" ? (
                  <select {...common} defaultValue={values[f.name] ?? ""}>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    {...common}
                    type={type}
                    autoComplete={f.autoComplete}
                    min={type === "number" ? 1 : undefined}
                    defaultValue={type === "password" ? undefined : (values[f.name] ?? "")}
                  />
                )}
              </>
            )}
            {f.hint && <span className="text-xs text-zinc-500">{f.hint}</span>}
            {errors?.map((msg) => (
              <span key={msg} className="text-xs text-red-600">
                {msg}
              </span>
            ))}
          </label>
        );
      })}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "Menyimpan…" : submitLabel}
        </button>
        <Link href={cancelHref} className="rounded border border-zinc-400 px-4 py-2">
          Batal
        </Link>
      </div>
    </form>
  );
}
