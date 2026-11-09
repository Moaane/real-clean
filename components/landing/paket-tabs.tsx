"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Icon } from "@/components/icons";

type Jenis = "rumah" | "kos";

const TABS: { id: Jenis; label: string; icon: "home" | "building" }[] = [
  { id: "rumah", label: "Rumah", icon: "home" },
  { id: "kos", label: "Kos-kosan", icon: "building" },
];

/** Filter chips. Both lists are rendered by the server; this only toggles which is visible. */
export function PaketTabs({ rumah, kos }: { rumah: ReactNode; kos: ReactNode }) {
  const [aktif, setAktif] = useState<Jenis>("rumah");
  const panels: Record<Jenis, ReactNode> = { rumah, kos };

  function onKeyDown(e: KeyboardEvent, i: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
    setAktif(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  }

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Jenis properti" className="flex flex-wrap gap-2">
        {TABS.map((t, i) => {
          const on = aktif === t.id;
          return (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`panel-${t.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setAktif(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className="chip"
            >
              <Icon name={on ? "check" : t.icon} size={18} />
              {t.label}
            </button>
          );
        })}
      </div>
      {TABS.map((t) => (
        <div key={t.id} id={`panel-${t.id}`} role="tabpanel" aria-labelledby={`tab-${t.id}`} hidden={aktif !== t.id}>
          {panels[t.id]}
        </div>
      ))}
    </div>
  );
}
