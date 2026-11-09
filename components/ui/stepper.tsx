import Link from "next/link";
import { cn } from "@/lib/cn";
import { IconCheck } from "@/components/icons";

export type Step = { label: string; href?: string };

export const BOOKING_STEPS: Step[] = [
  { label: "Layanan" },
  { label: "Jadwal" },
  { label: "Detail" },
  { label: "Bayar" },
];

/** `current` berbasis 1. Langkah sebelum `current` dianggap selesai (klik jika punya href). */
export function Stepper({
  steps = BOOKING_STEPS,
  current,
  className,
}: {
  steps?: Step[];
  current: number;
  className?: string;
}) {
  const active = steps[current - 1];
  return (
    <div className={className}>
      <p className="mb-3 text-sm font-semibold text-foreground md:hidden" aria-hidden="true">
        Langkah {current} dari {steps.length}: {active?.label}
      </p>
      <ol aria-label="Langkah pemesanan" className="flex items-start">
        {steps.map((step, i) => {
          const n = i + 1;
          const done = n < current;
          const isActive = n === current;
          const circle = (
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-pill text-sm font-bold transition duration-200",
                done && "bg-primary text-on-primary",
                isActive && "border-2 border-primary bg-primary-soft text-primary-ink",
                !done && !isActive && "border border-border-strong text-muted",
              )}
            >
              {done ? <IconCheck size={16} strokeWidth={2.5} /> : n}
            </span>
          );
          const label = (
            <span
              className={cn(
                "mt-2 hidden text-sm font-semibold md:block",
                isActive ? "text-foreground" : done ? "text-foreground" : "text-muted",
              )}
            >
              {step.label}
            </span>
          );
          const inner = (
            <>
              {circle}
              {label}
              <span className="sr-only md:hidden">{step.label}</span>
            </>
          );
          return (
            <li
              key={step.label}
              aria-current={isActive ? "step" : undefined}
              className={cn("flex items-start", i < steps.length - 1 && "flex-1")}
            >
              {done && step.href ? (
                <Link href={step.href} className="flex flex-col items-center rounded-sm">
                  {inner}
                  <span className="sr-only"> (selesai)</span>
                </Link>
              ) : (
                <div className="flex flex-col items-center">{inner}</div>
              )}
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn("mx-2 mt-[15px] h-0.5 flex-1 rounded-pill", done ? "bg-primary" : "bg-border")}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
