import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconInfo, type IconProps } from "@/components/icons";

export function EmptyState({
  icon: Icon = IconInfo,
  title,
  action,
  className,
}: {
  icon?: ComponentType<IconProps>;
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-lg border border-dashed border-border-strong bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-pill bg-primary-soft text-on-primary-soft">
        <Icon size={24} />
      </span>
      <p className="max-w-sm text-muted">{title}</p>
      {action}
    </div>
  );
}
