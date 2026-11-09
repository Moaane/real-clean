"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconX, IconMenu } from "@/components/icons";
import { NavLink } from "./nav-link";
import type { NavItem } from "./nav-links";

/** Hamburger + sheet dari atas untuk < 768px. `children` = blok aksi auth. */
export function NavbarMobile({ links, children }: { links: NavItem[]; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const first = sheet.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={trigger}
        type="button"
        aria-label={open ? "Tutup menu" : "Buka menu"}
        aria-expanded={open}
        aria-controls="menu-mobile"
        onClick={() => setOpen((o) => !o)}
        className="flex size-11 cursor-pointer items-center justify-center rounded-pill text-foreground transition duration-150 hover:bg-surface-2"
      >
        {open ? <IconX size={24} /> : <IconMenu size={24} />}
      </button>
      {open && (
        <div
          id="menu-mobile"
          ref={sheet}
          className="anim-sheet absolute inset-x-0 top-full mt-2 rounded-xl border border-border bg-surface p-4 shadow-overlay"
        >
          <nav aria-label="Menu utama" className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink key={l.href} href={l.href} className="h-11" onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}
