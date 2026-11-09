import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  id?: string;
  /** Plain text before the key phrase. */
  title: string;
  /** One key phrase, shown in the primary color. */
  highlight?: string;
  /** Text after the key phrase. */
  after?: string;
  lead?: ReactNode;
  align?: "split" | "center" | "start";
  as?: "h1" | "h2";
  /** Uppercase, for public section titles only (DESIGN §3). */
  upper?: boolean;
  className?: string;
};

export function SectionHeading({
  id,
  title,
  highlight,
  after,
  lead,
  align = "start",
  as: Tag = "h2",
  upper = false,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        align === "split" && "grid gap-4 md:grid-cols-[1.3fr_1fr] md:items-end md:gap-12",
        align === "center" && "mx-auto max-w-2xl text-center",
        align === "start" && "max-w-2xl",
        className,
      )}
    >
      <Tag id={id} className={cn(Tag === "h1" || upper ? "h1" : "h2", upper && "uppercase")}>
        {title}
        {highlight && (
          <>
            {" "}
            <span className="text-primary">{highlight}</span>
          </>
        )}
        {after && <> {after}</>}
      </Tag>
      {lead && <div className={cn("text-muted", align !== "split" && "mt-3")}>{lead}</div>}
    </div>
  );
}
