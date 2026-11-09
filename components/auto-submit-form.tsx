"use client";

import type { ReactNode } from "react";

/** GET form that re-submits whenever a field changes (no separate "check" button). */
export function AutoSubmitForm({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <form className={className} onChange={(e) => e.currentTarget.requestSubmit()}>
      {children}
    </form>
  );
}
