import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Field, controlClass, useFieldIds, type FieldProps } from "./field";

export { controlClass };

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & FieldProps;

export function Input({ label, required, hint, error, id, className, ...props }: InputProps) {
  const ids = useFieldIds({ id, hint, error });
  return (
    <Field label={label} required={required} hint={hint} error={error} {...ids}>
      <input className={cn(controlClass, "h-12", className)} required={required} {...ids.aria} {...props} />
    </Field>
  );
}

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & FieldProps;

export function Textarea({ label, required, hint, error, id, className, rows = 4, ...props }: TextareaProps) {
  const ids = useFieldIds({ id, hint, error });
  return (
    <Field label={label} required={required} hint={hint} error={error} {...ids}>
      <textarea
        rows={rows}
        className={cn(controlClass, "min-h-24 py-3", className)}
        required={required}
        {...ids.aria}
        {...props}
      />
    </Field>
  );
}
