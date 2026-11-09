import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconArrowRight } from "@/components/icons";

export type ChartPoint = { label: string; value: number };

/** Batas atas sumbu yang "rapi": 1, 2, 5 × 10^n. */
export function niceMax(max: number): number {
  if (max <= 0) return 4;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function Axis({ max, format, height }: { max: number; format: (n: number) => string; height: number }) {
  return (
    <>
      {[max, max / 2, 0].map((v, i) => (
        <div
          key={i}
          className="absolute inset-x-0 flex items-center"
          style={{ top: `${(i / 2) * 100}%`, transform: i === 2 ? "translateY(-100%)" : i === 1 ? "translateY(-50%)" : undefined }}
        >
          <span className="w-12 shrink-0 pr-2 text-right text-[10px] font-medium text-muted tabular-nums">{format(v)}</span>
          <span className="flex-1 border-t border-dashed border-border" />
        </div>
      ))}
      <span className="sr-only">Tinggi grafik {height}px</span>
    </>
  );
}

function XLabels({ data, every }: { data: ChartPoint[]; every: number }) {
  return (
    <div className="ml-12 mt-2 flex">
      {data.map((d, i) => (
        <span
          key={i}
          className="flex min-w-0 flex-1 justify-center whitespace-nowrap text-[10px] font-medium text-muted tabular-nums"
          aria-hidden="true"
        >
          {i % every === 0 ? d.label : ""}
        </span>
      ))}
    </div>
  );
}

/** Batang berbentuk pil dengan gradien (referensi dashboard-2). */
export function BarChart({
  data,
  format = (n) => String(n),
  height = 220,
  labelEvery = 1,
  unit = "",
}: {
  data: ChartPoint[];
  format?: (n: number) => string;
  height?: number;
  labelEvery?: number;
  unit?: string;
}) {
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const kosong = data.every((d) => d.value === 0);
  return (
    <figure>
      <div className="relative" style={{ height }} role="img" aria-label={`Grafik batang, ${data.length} periode`}>
        <Axis max={max} format={format} height={height} />
        <div className="absolute inset-y-0 left-12 right-0 flex items-end gap-1 md:gap-1.5">
          {data.map((d, i) => {
            const pct = (d.value / max) * 100;
            return (
              <div key={i} className="group relative flex h-full min-w-0 flex-1 items-end justify-center">
                <div
                  className={cn(
                    "anim-grow w-full max-w-14 rounded-pill transition duration-200 group-hover:brightness-95",
                    d.value > 0 ? "bg-linear-to-b from-primary to-primary-soft" : "bg-surface-2",
                  )}
                  style={{ height: d.value > 0 ? `max(${pct}%, 8px)` : "6px", animationDelay: `${i * 25}ms` }}
                />
                <span className="pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-semibold text-background opacity-0 transition duration-150 group-hover:opacity-100">
                  {d.label}: {format(d.value)}
                  {unit}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <XLabels data={data} every={labelEvery} />
      {kosong && <figcaption className="mt-3 text-center text-sm text-muted">Belum ada data pada periode ini.</figcaption>}
    </figure>
  );
}

/** Garis halus dengan area gradien tipis (referensi dashboard-2, kartu kanan). */
export function AreaChart({
  data,
  format = (n) => String(n),
  height = 220,
  labelEvery = 1,
}: {
  data: ChartPoint[];
  format?: (n: number) => string;
  height?: number;
  labelEvery?: number;
}) {
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const n = data.length;
  const xs = data.map((_, i) => (n === 1 ? 50 : ((i + 0.5) / n) * 100));
  const ys = data.map((d) => 100 - (d.value / max) * 100);

  // Catmull-Rom -> Bezier agar kurva halus tanpa overshoot berlebihan.
  let line = `M ${xs[0]} ${ys[0]}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = i === 0 ? i : i - 1;
    const p3 = i + 2 >= n ? n - 1 : i + 2;
    const t = 0.18;
    const c1x = xs[i] + (xs[i + 1] - xs[p0]) * t;
    const c1y = Math.min(100, Math.max(0, ys[i] + (ys[i + 1] - ys[p0]) * t));
    const c2x = xs[i + 1] - (xs[p3] - xs[i]) * t;
    const c2y = Math.min(100, Math.max(0, ys[i + 1] - (ys[p3] - ys[i]) * t));
    line += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${xs[i + 1]} ${ys[i + 1]}`;
  }
  const area = `${line} L ${xs[n - 1]} 100 L ${xs[0]} 100 Z`;
  const kosong = data.every((d) => d.value === 0);

  return (
    <figure>
      <div className="relative" style={{ height }} role="img" aria-label={`Grafik garis, ${n} periode`}>
        <Axis max={max} format={format} height={height} />
        <div className="absolute inset-y-0 left-12 right-0">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <defs>
              <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#area-fill)" className="anim-fade" />
            <path
              d={line}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              className="anim-draw"
            />
          </svg>
          <div className="absolute inset-0 flex">
            {data.map((d, i) => (
              <div key={i} className="group relative min-w-0 flex-1">
                <span
                  className="absolute left-1/2 size-3 -translate-x-1/2 translate-y-1/2 rounded-pill border-2 border-surface bg-primary opacity-0 transition duration-150 group-hover:opacity-100"
                  style={{ bottom: `${100 - ys[i]}%` }}
                />
                <span
                  className="pointer-events-none absolute left-1/2 z-10 mb-3 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-semibold text-background opacity-0 transition duration-150 group-hover:opacity-100"
                  style={{ bottom: `${100 - ys[i]}%` }}
                >
                  {d.label}: {format(d.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <XLabels data={data} every={labelEvery} />
      {kosong && <figcaption className="mt-3 text-center text-sm text-muted">Belum ada data pada periode ini.</figcaption>}
    </figure>
  );
}

export type DonutSegment = { label: string; value: number; className: string };

/** Donat sederhana (referensi "Readiness"). `className` berisi kelas `stroke-*`. */
export function Donut({
  segments,
  size = 96,
  children,
}: {
  segments: DonutSegment[];
  size?: number;
  children?: ReactNode;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  let acc = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="size-full -rotate-90" role="img" aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}>
        <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="4.5" className="stroke-surface-2" />
        {total > 0 &&
          segments.map((s) => {
            const len = (s.value / total) * 100;
            const el = (
              <circle
                key={s.label}
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                strokeWidth="4.5"
                strokeLinecap="butt"
                strokeDasharray={`${Math.max(len - 0.8, 0)} ${100 - Math.max(len - 0.8, 0)}`}
                strokeDashoffset={-acc}
                className={cn("anim-fade", s.className)}
              />
            );
            acc += len;
            return el;
          })}
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center text-center">{children}</div>}
    </div>
  );
}

/** Lencana perubahan: "↑ +1.7%" hijau, turun merah. */
export function Delta({ value, hint = "pada periode ini" }: { value: number | null; hint?: string }) {
  const up = value === null || value >= 0;
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted">
      <span
        className={cn(
          "inline-flex h-6 items-center gap-1 rounded-pill px-2 text-xs font-semibold tabular-nums",
          up ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger",
        )}
      >
        <IconArrowRight size={12} className={up ? "-rotate-90" : "rotate-90"} />
        {value === null ? "baru" : `${value > 0 ? "+" : ""}${value}%`}
      </span>
      {hint}
    </span>
  );
}
