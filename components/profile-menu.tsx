"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconChevronDown, IconLogout } from "@/components/icons";
import { cn } from "@/lib/cn";

type Item = { href: string; label: string };

/** Profile dropdown (initials avatar): account info, role-specific links, and Logout. */
export function ProfileMenu({
  name,
  email,
  roleLabel,
  items,
  logoutAction,
  align = "right",
  dropUp = false,
  hideArrowOnDesktop = false,
}: {
  name: string;
  email: string;
  roleLabel: string;
  items: Item[];
  logoutAction: () => void | Promise<void>;
  align?: "left" | "right";
  dropUp?: boolean;
  /** Dashboard rail: the avatar alone is enough on desktop. */
  hideArrowOnDesktop?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials = name.trim().slice(0, 1).toUpperCase();

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menu profil ${name}`}
        onClick={() => setOpen((o) => !o)}
        className="group flex h-11 cursor-pointer items-center gap-1.5 rounded-pill pl-1 pr-2 transition duration-150 hover:bg-surface-2"
      >
        <span className="flex size-9 items-center justify-center rounded-pill bg-primary font-bold text-on-primary ring-2 ring-surface transition duration-200 group-hover:scale-105">
          {initials}
        </span>
        <IconChevronDown
          size={16}
          className={cn("text-muted transition duration-200", open && "rotate-180", hideArrowOnDesktop && "md:hidden")}
        />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "anim-pop absolute z-50 w-64 rounded-lg border border-border bg-surface p-2 shadow-overlay",
            align === "right" ? "right-0" : "left-0",
            dropUp ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          <div className="px-3 py-2">
            <p className="truncate font-semibold">{name}</p>
            <p className="truncate text-sm text-muted">{email}</p>
            <p className="mt-1 inline-flex h-6 items-center rounded-pill bg-primary-soft px-2.5 text-xs font-semibold text-on-primary-soft">
              {roleLabel}
            </p>
          </div>
          <div className="my-1 border-t border-border" />
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex h-11 items-center rounded-md px-3 text-[15px] font-medium transition duration-150 hover:bg-surface-2"
            >
              {it.label}
            </Link>
          ))}
          <form action={logoutAction}>
            <button
              type="submit"
              role="menuitem"
              className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-md px-3 text-[15px] font-medium text-danger transition duration-150 hover:bg-danger-soft"
            >
              <IconLogout size={18} />
              Keluar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
