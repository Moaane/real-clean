"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { IconMinus, IconPlus } from "@/components/icons";
import { CONTACT } from "@/lib/kontak";

type Props = {
  min: number;
  max: number;
  value: number;
  /** Other URL parameters that are kept (pkg, date, address, ...). The time is re-selected because availability depends on the duration. */
  base: Record<string, string>;
};

const btn =
  "flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-pill border border-border-strong bg-surface transition duration-150 hover:bg-surface-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40";

/** Picks the room count. The value is stored in the URL (?room=) so the server computes the total and the slots that fit. */
export function RoomStepper({ min, max, value, base }: Props) {
  const router = useRouter();
  // The text currently being typed; null means show the value from the URL.
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? String(value);

  function go(n: number) {
    const room = Math.min(max, Math.max(min, Math.round(n)));
    setDraft(null);
    if (room === value) return;
    const q = new URLSearchParams({ ...base, room: String(room) });
    router.replace(`/pesan?${q.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-2">
    <div className="flex items-center gap-3">
      <button type="button" aria-label="Kurangi kamar" className={btn} disabled={value <= min} onClick={() => go(value - 1)}>
        <IconMinus size={20} />
      </button>
      <input
        aria-label="Jumlah kamar"
        inputMode="numeric"
        value={text}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
        onBlur={() => go(text === "" ? min : Number(text))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            go(text === "" ? min : Number(text));
          }
        }}
        className={cn("h-12 w-20 rounded-pill border border-border-strong bg-surface text-center text-lg font-bold tabular-nums")}
      />
      <button type="button" aria-label="Tambah kamar" className={btn} disabled={value >= max} onClick={() => go(value + 1)}>
        <IconPlus size={20} />
      </button>
      <span className="text-sm text-muted">
        kamar (maks. {max})
      </span>
    </div>
      {value >= max && (
        <p className="text-sm text-muted">
          Lebih dari {max} kamar?{" "}
          <a href={CONTACT.waHref} target="_blank" rel="noreferrer" className="font-semibold text-primary-ink underline underline-offset-2">
            Hubungi admin
          </a>{" "}
          untuk penawaran khusus.
        </p>
      )}
    </div>
  );
}
