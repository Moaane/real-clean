import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { IconChevronDown } from "@/components/icons";
import { Field, controlClass, useFieldIds, type FieldProps } from "./field";

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & FieldProps;

export function Select({ label, required, hint, error, id, className, children, ...props }: SelectProps) {
  const ids = useFieldIds({ id, hint, error });
  return (
    <Field label={label} required={required} hint={hint} error={error} {...ids}>
      <div className="relative">
        <select
          className={cn(controlClass, "h-12 cursor-pointer appearance-none pr-11", className)}
          required={required}
          {...ids.aria}
          {...props}
        >
          {children}
        </select>
        <IconChevronDown
          size={20}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
    </Field>
  );
}
