"use client";

import { useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { IconEye, IconEyeOff } from "@/components/icons";
import { Field, controlClass, useFieldIds, type FieldProps } from "./field";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> & FieldProps;

export function PasswordInput({ label, required, hint, error, id, className, ...props }: Props) {
  const [shown, setShown] = useState(false);
  const ids = useFieldIds({ id, hint, error });
  return (
    <Field label={label} required={required} hint={hint} error={error} {...ids}>
      <div className="relative">
        <input
          type={shown ? "text" : "password"}
          autoComplete="current-password"
          className={cn(controlClass, "h-12 pr-14", className)}
          required={required}
          {...ids.aria}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          aria-pressed={shown}
          className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-pill text-muted transition duration-150 hover:text-foreground"
        >
          {shown ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
    </Field>
  );
}
