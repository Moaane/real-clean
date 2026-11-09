import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconArrowRight, IconSpinner } from "@/components/icons";

export type ButtonVariant = "primary" | "outline" | "ghost" | "soft" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "active-press group/btn inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-pill font-semibold transition duration-150 active:scale-[0.98] aria-disabled:pointer-events-none aria-disabled:opacity-50 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  outline: "border border-border-strong bg-transparent text-foreground hover:bg-surface-2",
  ghost: "bg-transparent text-primary-ink hover:bg-primary-soft",
  soft: "bg-primary-soft text-on-primary-soft hover:brightness-95",
  danger: "border border-danger bg-transparent text-danger hover:bg-danger-soft",
};

// `sm` keeps a 44px touch area through the pseudo-element hit slop.
const sizes: Record<ButtonSize, string> = {
  sm: "relative h-9 px-4 text-sm before:absolute before:-inset-y-1 before:inset-x-0 before:content-['']",
  md: "h-11 px-5 text-[15px]",
  lg: "h-[52px] px-7 text-base",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Tampilkan panah di kanan (untuk CTA navigasi). */
  arrow?: boolean;
  children?: ReactNode;
};

type ButtonProps = Common &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    /** Menampilkan spinner dan menonaktifkan tombol agar tidak double submit. */
    loading?: boolean;
  };

export function Button({
  variant = "primary",
  size = "md",
  arrow,
  loading,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, className)}
      {...props}
    >
      {loading ? (
        <>
          <IconSpinner size={18} />
          Memproses…
        </>
      ) : (
        <>
          {children}
          {arrow && <IconArrowRight size={18} className="transition duration-200 group-hover/btn:translate-x-1" />}
        </>
      )}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  arrow,
  className,
  children,
  ...props
}: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {children}
      {arrow && <IconArrowRight size={18} className="transition duration-200 group-hover/btn:translate-x-1" />}
    </Link>
  );
}
