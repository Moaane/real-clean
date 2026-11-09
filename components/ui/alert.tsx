import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconAlert, IconCheck, IconInfo } from "@/components/icons";

type Tone = "ok" | "warn" | "danger" | "info";

const style: Record<Tone, string> = {
  ok: "border-ok bg-ok-soft text-ok",
  warn: "border-warn bg-warn-soft text-warn",
  danger: "border-danger bg-danger-soft text-danger",
  info: "border-info bg-info-soft text-info",
};
const icon = { ok: IconCheck, warn: IconAlert, danger: IconAlert, info: IconInfo };

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const Icon = icon[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-md border p-4 text-sm", style[tone], className)}
    >
      <Icon size={20} className="mt-0.5 shrink-0" />
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "text-foreground")}>{children}</div>}
      </div>
    </div>
  );
}
