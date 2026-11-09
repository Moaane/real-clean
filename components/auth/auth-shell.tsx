import type { ReactNode } from "react";
import { Card, Skeleton } from "@/components/ui";
import { LogoMark } from "@/components/icons";

/** Satu kolom terpusat untuk masuk dan daftar (DESIGN §7.6). */
export function AuthShell({
  title,
  accent,
  description,
  children,
}: {
  title: string;
  accent: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-stretch px-4 py-10 md:py-16">
      <Card variant="section" className="flex flex-col gap-6 md:p-8">
        <div className="flex flex-col items-start gap-3">
          <LogoMark size={40} />
          <h1 className="text-[28px] font-bold leading-[1.15] tracking-tight">
            {title} <span className="text-primary">{accent}</span>
          </h1>
          <p className="text-sm text-muted">{description}</p>
        </div>
        {children}
      </Card>
    </div>
  );
}

export function AuthSkeleton() {
  return (
    <div className="mx-auto max-w-md px-4 py-10 md:py-16" aria-hidden="true">
      <Skeleton className="h-[460px] rounded-xl" />
    </div>
  );
}
