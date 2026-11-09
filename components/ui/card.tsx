import type { ComponentPropsWithoutRef, HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article" | "li";
  variant?: "default" | "interactive" | "section";
  /** Kept for existing callers; same as variant="interactive". */
  interactive?: boolean;
};

export function Card({ as: Tag = "div", variant = "default", interactive = false, className, ...props }: CardProps) {
  return (
    <Tag
      className={cn(
        variant === "section" ? "card-section" : "card",
        (interactive || variant === "interactive") && "card-interactive",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("mb-3 flex flex-col gap-1", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentPropsWithoutRef<"h3">) {
  return <h3 className={cn("text-lg font-semibold leading-snug", className)} {...props} />;
}
