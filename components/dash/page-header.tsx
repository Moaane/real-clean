import type { ReactNode } from "react";

/** Dashboard page title + action slot on the right. */
export function PageHeader({
  title,
  accent,
  description,
  children,
}: {
  title: string;
  accent?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-[28px] font-bold leading-[1.15] tracking-tight md:text-[34px]">
          {title} {accent && <span className="text-primary">{accent}</span>}
        </h1>
        {description && <p className="mt-1 max-w-xl text-sm text-muted">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** Small uppercase label for stat cards (reference style). */
export function Label({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{children}</p>;
}
