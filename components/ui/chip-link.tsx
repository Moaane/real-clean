import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { IconCheck } from "@/components/icons";

/** Chip filter berbentuk tautan (jalan tanpa JS). `active` menandai pilihan saat ini. */
export function ChipLink({
  active,
  className,
  children,
  ...props
}: { active?: boolean } & ComponentProps<typeof Link>) {
  return (
    <Link
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-pill border px-5 text-[15px] font-semibold transition duration-150",
        active
          ? "border-primary bg-primary text-on-primary"
          : "border-border-strong bg-transparent text-foreground hover:bg-surface-2",
        className,
      )}
      {...props}
    >
      {active && <IconCheck size={16} />}
      {children}
    </Link>
  );
}
