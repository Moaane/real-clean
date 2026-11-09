import type { ComponentType, ButtonHTMLAttributes, ReactNode } from "react";
import type { StatusBooking } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/booking-status";
import {
  IconCheck,
  IconCheckDouble,
  IconClock,
  IconClockOff,
  IconRoute,
  IconShield,
  IconSparkle,
  IconUndo,
  IconUser,
  IconX,
  type IconProps,
} from "@/components/icons";

export type Tone = "ok" | "ok-solid" | "warn" | "danger" | "info" | "neutral" | "soft";

export const toneClass: Record<Tone, string> = {
  ok: "bg-ok-soft text-ok",
  "ok-solid": "bg-ok text-white",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-neutral-soft text-neutral",
  soft: "bg-primary-soft text-on-primary-soft",
};

export function Badge({
  tone = "soft",
  icon: Icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ComponentType<IconProps>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-pill px-3 text-[13px] font-semibold",
        toneClass[tone],
        className,
      )}
    >
      {Icon && <Icon size={14} />}
      {children}
    </span>
  );
}

const STATUS_ICON: Record<StatusBooking, ComponentType<IconProps>> = {
  MENUNGGU_PEMBAYARAN: IconClock,
  DIBAYAR: IconCheck,
  DITUGASKAN: IconUser,
  DALAM_PERJALANAN: IconRoute,
  DIKERJAKAN: IconSparkle,
  MENUNGGU_VERIFIKASI: IconShield,
  SELESAI: IconCheckDouble,
  KEDALUWARSA: IconClockOff,
  DIBATALKAN: IconX,
  DIREFUND: IconUndo,
};

/** Badge status booking: selalu ikon + label, warna bukan satu-satunya pembeda. */
export function StatusBadge({ status, className }: { status: StatusBooking; className?: string }) {
  return (
    <Badge tone={STATUS_TONE[status]} icon={STATUS_ICON[status]} className={className}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

/** Chip filter. Kelompokkan di dalam role="radiogroup" dan beri role="radio" + aria-checked. */
export function Chip({
  active,
  className,
  children,
  ...props
}: { active?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={!!active}
      className={cn(
        "inline-flex h-11 cursor-pointer items-center gap-2 rounded-pill border px-5 text-[15px] font-semibold transition duration-150",
        active
          ? "border-primary bg-primary text-on-primary"
          : "border-border-strong bg-transparent text-foreground hover:bg-surface-2",
        className,
      )}
      {...props}
    >
      {active && <IconCheck size={16} />}
      {children}
    </button>
  );
}
