import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "card" | "interactive" | "section";
};

const variants = {
  card: "rounded-lg border border-border bg-surface p-5 md:p-7",
  interactive:
    "hover-lift rounded-lg border border-border bg-surface p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 focus-within:border-primary/40 md:p-7",
  section: "rounded-xl border border-border bg-surface p-5 md:p-7",
};

export function Card({ variant = "card", className, ...props }: CardProps) {
  return <div className={cn(variants[variant], className)} {...props} />;
}
