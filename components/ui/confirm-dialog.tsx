"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Button, type ButtonVariant } from "./button";

/**
 * Tombol pemicu + dialog konfirmasi. `action` adalah server action (FormData).
 * Fokus dikembalikan ke pemicu oleh <dialog> bawaan saat ditutup.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  action,
  fields,
  variant = "danger",
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  fields?: Record<string, string>;
  variant?: ButtonVariant;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const titleId = useId();

  return (
    <>
      <Button type="button" variant={variant} size="sm" onClick={() => ref.current?.showModal()}>
        {trigger}
      </Button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-surface p-6 text-foreground shadow-overlay backdrop:bg-foreground/40"
      >
        <form
          action={async (fd) => {
            setPending(true);
            try {
              await action(fd);
            } finally {
              setPending(false);
              ref.current?.close();
            }
          }}
          className="flex flex-col gap-4"
        >
          {Object.entries(fields ?? {}).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <h2 id={titleId} className="text-xl font-bold">
            {title}
          </h2>
          <p className="text-muted">{description}</p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => ref.current?.close()}>
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={pending}>
              {confirmLabel}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
