import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Judul kapital besar dengan satu frasa kunci `primary` (pola mockup). */
export function SectionHeading({
  title,
  accent,
  after,
  description,
  as: Tag = "h2",
  className,
  children,
}: {
  title?: string;
  accent: string;
  after?: string;
  description?: ReactNode;
  as?: "h1" | "h2";
  className?: string;
  /** Konten kanan (mis. CTA) bila tidak ada deskripsi. */
  children?: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12", className)}>
      <Tag className="max-w-3xl text-[32px] title-display md:text-5xl">
        {title}
        {title && " "}
        <span className="text-primary">{accent}</span>
        {after && ` ${after}`}
      </Tag>
      {description && <p className="max-w-sm text-[15px] text-muted md:pb-2">{description}</p>}
      {children}
    </div>
  );
}
