import type { ComponentPropsWithoutRef } from "react";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "primary" | "ok" | "warn" | "danger" | "info";

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "badge-neutral",
  primary: "badge-soft",
  ok: "badge-on",
  warn: "badge-warn",
  danger: "badge-danger",
  info: "badge-info",
};

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  tone?: BadgeTone;
  icon?: IconName;
};

/** Always pair color with text (and ideally an icon): color alone is not enough. */
export function Badge({ tone = "neutral", icon, className, children, ...props }: BadgeProps) {
  return (
    <span className={cn("badge", TONE_CLASS[tone], className)} {...props}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}
