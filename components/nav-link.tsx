"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavLink({
  href,
  className,
  children,
  onClick,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-10 items-center rounded-pill px-4 text-[15px] font-medium transition duration-150",
        active ? "bg-primary-soft text-on-primary-soft" : "text-foreground hover:bg-surface-2",
        className,
      )}
    >
      {children}
    </Link>
  );
}
