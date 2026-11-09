"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { durasiLabel, hitungPaket } from "@/lib/harga";
import { rp } from "@/lib/booking-status";
import { ButtonLink } from "@/components/ui";
import { IconBuilding, IconClock, IconHome } from "@/components/icons";

export type QuickPaket = {
  id: number;
  nama: string;
  jenis: "rumah" | "kos";
  tingkatKey: string;
  tingkat: string;
  hargaDasar: number;
  hargaPerKamar: number;
  durasiDasar: number;
  durasiPerKamar: number;
  minKamar: number;
  maxKamar: number;
};

const JENIS = [
  { key: "rumah", label: "Rumah", icon: IconHome },
  { key: "kos", label: "Kos-kosan", icon: IconBuilding },
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
                on ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground",
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
 * Konfigurator cepat: jenis, tingkat, jumlah kamar, lalu harga langsung.
 * Harga dan durasi di sini hanya tampilan; server menghitung ulang saat booking.
 */
export function QuickBook({ paket }: { paket: QuickPaket[] }) {
  const jenisAda = JENIS.filter((j) => paket.some((p) => p.jenis === j.key));
  const [jenis, setJenis] = useState<"rumah" | "kos">(jenisAda[0]?.key ?? "rumah");

  const tingkatOpsi = useMemo(() => {
    const seen = new Map<string, string>();
    paket.filter((p) => p.jenis === jenis).forEach((p) => seen.set(p.tingkatKey, p.tingkat));
    const urut = ["reguler", "detail", "deep"];
    return [...seen].map(([key, label]) => ({ key, label })).sort((a, b) => urut.indexOf(a.key) - urut.indexOf(b.key));
  }, [paket, jenis]);
  const [tingkatPilih, setTingkat] = useState<string>("");
  const tingkat = tingkatOpsi.some((t) => t.key === tingkatPilih) ? tingkatPilih : (tingkatOpsi[0]?.key ?? "");

  // Satu paket per (jenis, tingkat); jumlah kamar dipilih bebas dalam min..max paket itu.
  const aktif = paket.find((p) => p.jenis === jenis && p.tingkatKey === tingkat);
  const [kamarPilih, setKamar] = useState(0);
  const kamar = aktif ? Math.min(aktif.maxKamar, Math.max(aktif.minKamar, kamarPilih || aktif.minKamar)) : 0;
  const hasil = aktif
    ? hitungPaket(
        {
          harga_dasar: aktif.hargaDasar,
          harga_per_kamar: aktif.hargaPerKamar,
          durasi_dasar_menit: aktif.durasiDasar,
          durasi_per_kamar_menit: aktif.durasiPerKamar,
          min_kamar: aktif.minKamar,
          max_kamar: aktif.maxKamar,
        },
        kamar,
      )
    : null;

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-background p-5 md:p-7">
      <Seg
        label="Jenis properti"
        value={jenis}
        options={jenisAda.map((j) => ({ key: j.key, label: j.label, icon: j.icon }))}
        onChange={(v) => {
          setJenis(v);
          setKamar(0);
        }}
      />
      <Seg
        label="Tingkat kebersihan"
        value={tingkat}
        options={tingkatOpsi}
        onChange={(v) => {
          setTingkat(v);
          setKamar(0);
        }}
      />

      {/* Selalu dirender dengan tinggi tetap agar tata letak tidak bergeser saat pilihan berganti. */}
      <div className="min-h-[104px]">
        <label htmlFor="qb-kamar" className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted">
          Jumlah kamar
          <span className="text-base font-bold normal-case tracking-normal text-foreground tabular-nums">
            {aktif ? `${kamar} kamar` : "-"}
          </span>
        </label>
        <input
          id="qb-kamar"
          type="range"
          min={aktif?.minKamar ?? 0}
          max={aktif?.maxKamar ?? 1}
          step={1}
          disabled={!aktif || aktif.minKamar === aktif.maxKamar}
          value={kamar}
          onChange={(e) => setKamar(Number(e.target.value))}
          className="h-11 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="flex h-5 justify-between text-xs text-muted tabular-nums" aria-hidden="true">
          <span>{aktif?.minKamar}</span>
          <span>{aktif?.maxKamar}</span>
        </div>
      </div>

      {aktif && hasil ? (
        <div className="flex min-h-[176px] flex-col rounded-lg bg-primary-soft p-4 md:p-5">
          <p key={aktif.id} className="anim-rise line-clamp-1 min-h-5 text-sm font-semibold text-on-primary-soft">
            {aktif.nama}
          </p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <p key={hasil.total} className="anim-rise text-[32px] font-bold leading-none tracking-tight tabular-nums md:text-4xl">
              {rp(hasil.total)}
            </p>
            <span className="flex items-center gap-1.5 text-sm text-on-primary-soft">
              <IconClock size={14} /> {durasiLabel(hasil.durasi)}
            </span>
          </div>
          <ButtonLink href={`/pesan?paket=${aktif.id}&kamar=${kamar}`} size="lg" arrow className="mt-auto w-full">
            Pesan paket ini
          </ButtonLink>
        </div>
      ) : (
        <p className="flex min-h-[176px] items-center justify-center rounded-lg bg-surface-2 p-4 text-center text-sm text-muted">Belum ada paket untuk pilihan ini.</p>
      )}
    </div>
  );
}
