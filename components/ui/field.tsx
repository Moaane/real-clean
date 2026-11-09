import { useId, type ReactNode } from "react";
import { IconAlert } from "@/components/icons";
import { cn } from "@/lib/cn";

/** Kelas dasar untuk input, select, textarea (tinggi 48, font 16 agar iOS tidak zoom). */
export const controlClass =
  "block w-full rounded-md border border-border-strong bg-surface px-4 text-base text-foreground transition duration-150 placeholder:text-muted/70 hover:border-foreground/40 focus:border-primary focus:outline-2 focus:outline-offset-0 focus:outline-ring aria-[invalid=true]:border-danger aria-[invalid=true]:focus:outline-danger disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60";

export type FieldProps = {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  /** Wajib bila ingin id stabil (mis. untuk `htmlFor`); default dari `useId`. */
  id?: string;
};

/** Menghasilkan id dan atribut aria untuk control di dalam Field. */
export function useFieldIds({ id, hint, error }: Pick<FieldProps, "id" | "hint" | "error">) {
  const auto = useId();
  const fieldId = id ?? auto;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return {
    fieldId,
    hintId,
    errorId,
    aria: {
      id: fieldId,
      "aria-invalid": error ? (true as const) : undefined,
      "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined,
    },
  };
}

export function Field({
  label,
  required,
  hint,
  error,
  fieldId,
  hintId,
  errorId,
  className,
  children,
}: FieldProps & {
  fieldId: string;
  hintId?: string;
  errorId?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={fieldId} className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="ml-1 font-normal text-muted">(wajib)</span>}
      </label>
      {children}
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-sm text-danger" role="alert">
          <IconAlert size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
