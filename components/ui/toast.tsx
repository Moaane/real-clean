"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconAlert, IconCheck, IconInfo, IconX } from "@/components/icons";

type ToastTone = "ok" | "info" | "warn" | "danger";
type ToastItem = { id: number; tone: ToastTone; message: string };

const ToastContext = createContext<{ toast: (message: string, tone?: ToastTone) => void } | null>(null);

const toneStyle: Record<ToastTone, string> = {
  ok: "border-ok text-ok",
  info: "border-info text-info",
  warn: "border-warn text-warn",
  danger: "border-danger text-danger",
};
const toneIcon = { ok: IconCheck, info: IconInfo, warn: IconAlert, danger: IconAlert };

const DURATION_MS = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = nextId.current++;
      setItems((l) => [...l, { id, tone, message }]);
      setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-stretch gap-2 md:inset-x-auto md:bottom-auto md:right-6 md:top-20 md:w-96"
      >
        {items.map((t) => {
          const Icon = toneIcon[t.tone];
          return (
            <div
              key={t.id}
              className={cn(
                "anim-toast pointer-events-auto flex items-start gap-3 rounded-md border bg-surface p-4 text-sm shadow-overlay",
                toneStyle[t.tone],
              )}
            >
              <Icon size={20} className="mt-0.5 shrink-0" />
              <p className="flex-1 font-medium text-foreground">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Tutup pemberitahuan"
                className="-m-3 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-pill text-muted hover:text-foreground"
              >
                <IconX size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus dipakai di dalam <ToastProvider>");
  return ctx.toast;
}
