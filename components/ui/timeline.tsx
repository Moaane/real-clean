import { cn } from "@/lib/cn";
import { IconCheck } from "@/components/icons";

/** Vertical timeline: filled dot = done, ring = active, grey = upcoming. `current` is 0-based. */
export function Timeline({ steps, current }: { steps: { label: string; note?: string }[]; current: number }) {
  return (
    <ol aria-label="Progres booking" className="flex flex-col">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const last = i === steps.length - 1;
        return (
          <li key={s.label} aria-current={active ? "step" : undefined} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-pill text-xs",
                  done && "bg-primary text-on-primary",
                  active && "border-2 border-primary bg-primary-soft",
                  !done && !active && "border border-border-strong bg-surface",
                )}
              >
                {done ? <IconCheck size={14} strokeWidth={2.5} /> : active ? <span className="size-2 rounded-pill bg-primary" /> : null}
              </span>
              {!last && <span className={cn("my-1 w-0.5 flex-1", done ? "bg-primary" : "bg-border")} />}
            </div>
            <div className={cn("pb-6", last && "pb-0")}>
              <p className={cn("font-semibold", !done && !active && "text-muted")}>{s.label}</p>
              {s.note && <p className="text-sm text-muted">{s.note}</p>}
              <span className="sr-only">{done ? "Selesai" : active ? "Sedang berlangsung" : "Belum"}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
