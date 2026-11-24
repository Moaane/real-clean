"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { durationLabel, computePackagePrice } from "@/lib/harga";
import type { PackageDTO } from "@/lib/paket-dto";
import { rp } from "@/lib/booking-status";
import { ButtonLink } from "@/components/ui";
import { IconBuilding, IconClock, IconHome } from "@/components/icons";

export type QuickPackage = PackageDTO;

const PROPERTY_TYPE_OPTIONS = [
  { key: "house", label: "Rumah", icon: IconHome },
  { key: "boarding_house", label: "Kos-kosan", icon: IconBuilding },
] as const;

function Seg<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { key: T; label: string; icon?: typeof IconHome }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-pill bg-surface-2 p-1">
        {options.map((o) => {
          const on = o.key === value;
          return (
            <button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.key)}
              className={cn(
                "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-pill px-3 text-sm font-semibold transition duration-200 active:scale-95",
                on ? "bg-primary text-on-primary shadow-sm" : "text-muted hover:text-foreground",
              )}
            >
              {o.icon && <o.icon size={16} />}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Quick configurator: type, level, room count, then the price right away.
 * Price and duration here are display only; the server recomputes them when the booking is created.
 */
export function QuickBook({ pkg }: { pkg: QuickPackage[] }) {
  const availableTypes = PROPERTY_TYPE_OPTIONS.filter((j) => pkg.some((p) => p.type === j.key));
  const [type, setType] = useState<"house" | "boarding_house">(availableTypes[0]?.key ?? "house");

  const levelOptions = useMemo(() => {
    const seen = new Map<string, string>();
    pkg.filter((p) => p.type === type).forEach((p) => seen.set(p.levelKey, p.level));
    const sorted = ["regular", "detailed", "deep"];
    return [...seen].map(([key, label]) => ({ key, label })).sort((a, b) => sorted.indexOf(a.key) - sorted.indexOf(b.key));
  }, [pkg, type]);
  const [selectedLevel, setLevel] = useState<string>("");
  const level = levelOptions.some((t) => t.key === selectedLevel) ? selectedLevel : (levelOptions[0]?.key ?? "");

  // One package per (type, level); the room count is chosen freely within that package's min..max.
  const active = pkg.find((p) => p.type === type && p.levelKey === level);
  const [selectedRooms, setRooms] = useState(0);
  const room = active ? Math.min(active.maxRooms, Math.max(active.minRooms, selectedRooms || active.minRooms)) : 0;
  const result = active
    ? computePackagePrice(
        {
          base_price: active.basePrice,
          price_per_room: active.pricePerRoom,
          base_duration_minutes: active.baseDuration,
          duration_per_room_minutes: active.durationPerRoom,
          min_rooms: active.minRooms,
          max_rooms: active.maxRooms,
        },
        room,
      )
    : null;

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-background p-5 md:p-7">
      <Seg
        label="Jenis properti"
        value={type}
        options={availableTypes.map((j) => ({ key: j.key, label: j.label, icon: j.icon }))}
        onChange={(v) => {
          setType(v);
          setRooms(0);
        }}
      />
      <Seg
        label="Tingkat kebersihan"
        value={level}
        options={levelOptions}
        onChange={(v) => {
          setLevel(v);
          setRooms(0);
        }}
      />

      {/* Always rendered with a fixed height so the layout does not shift when the selection changes. */}
      <div className="min-h-[104px]">
        <label htmlFor="qb-kamar" className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted">
          Jumlah kamar
          <span className="text-base font-bold normal-case tracking-normal text-foreground tabular-nums">
            {active ? `${room} kamar` : "-"}
          </span>
        </label>
        <input
          id="qb-kamar"
          type="range"
          min={active?.minRooms ?? 0}
          max={active?.maxRooms ?? 1}
          step={1}
          disabled={!active || active.minRooms === active.maxRooms}
          value={room}
          onChange={(e) => setRooms(Number(e.target.value))}
          className="h-11 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="flex h-5 justify-between text-xs text-muted tabular-nums" aria-hidden="true">
          <span>{active?.minRooms}</span>
          <span>{active?.maxRooms}</span>
        </div>
      </div>

      {active && result ? (
        <div className="flex min-h-[176px] flex-col rounded-lg bg-primary-soft p-4 md:p-5">
          <p key={active.id} className="anim-rise line-clamp-1 min-h-5 text-sm font-semibold text-on-primary-soft">
            {active.name}
          </p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <p key={result.total} className="anim-rise text-[32px] font-bold leading-none tracking-tight tabular-nums md:text-4xl">
              {rp(result.total)}
            </p>
            <span className="flex items-center gap-1.5 text-sm text-on-primary-soft">
              <IconClock size={14} /> {durationLabel(result.duration)}
            </span>
          </div>
          <ButtonLink href={`/pesan?pkg=${active.id}&room=${room}`} size="lg" arrow className="mt-auto w-full">
            Pesan paket ini
          </ButtonLink>
        </div>
      ) : (
        <p className="flex min-h-[176px] items-center justify-center rounded-lg bg-surface-2 p-4 text-center text-sm text-muted">Belum ada paket untuk pilihan ini.</p>
      )}
    </div>
  );
}
