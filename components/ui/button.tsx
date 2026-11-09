import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "outline" | "ghost" | "soft" | "danger";
export type ButtonSize = "md" | "lg" | "sm";

/** Class string for non-button elements, e.g. <Link className={buttonClass("primary", "lg")}>. */
export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return cn("btn", `btn-${variant}`, size === "sm" && "btn-sm", size === "lg" && "btn-lg");
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText = "Memproses…",
  type = "button",
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonClass(variant, size), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            aria-hidden="true"
            className="animate-spin"
          >
            <path d="M21 12a9 9 0 11-6.2-8.55" />
          </svg>
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
