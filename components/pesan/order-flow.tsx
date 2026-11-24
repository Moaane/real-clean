"use client";

import { type ComponentProps, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useApi } from "@/lib/use-api";
import { PROPERTY_TYPES, pricingOf, type PackageDTO } from "@/lib/paket-dto";
import { computePackagePrice, durationLabel, initialRooms, roomRange, startDuration, startingPrice } from "@/lib/harga";
import { dateId, rp } from "@/lib/booking-status";
import { cn } from "@/lib/cn";
import type { ScheduleResponse } from "@/app/api/jadwal/route";
import { OrderForm } from "@/components/pesan/pesan-form";
import { RoomStepper } from "@/components/pesan/kamar-stepper";
import { Alert, Button, EmptyState, Skeleton, Stepper } from "@/components/ui";
import { IconCheck, IconClock, IconSparkle } from "@/components/icons";

const DAY_RANGE = 14;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

type Patch = Record<string, string | undefined>;
type Slot = { start_time: string; end_time: string; remaining: number; fits: boolean; reason?: string };

/** Client-side version of the server's slot rule. Display only: createBooking validates again. */
function slotInfo(s: ScheduleResponse["days"][number]["slots"][number], duration: number): Slot {
  const base = { start_time: s.start_time, end_time: s.end_time, remaining: s.remaining };
  if (duration > s.span) {
    return { ...base, fits: false, reason: `Durasi ${durationLabel(duration)} melebihi slot ${durationLabel(s.span)}` };
  }
  if (s.remaining === 0) return { ...base, fits: false, reason: "Penuh" };
  return { ...base, fits: true };
}

const asUtc = (date: string) => new Date(`${date}T00:00:00.000Z`);

function urlFor(sp: URLSearchParams, patch: Patch) {
  const next = new URLSearchParams(sp.toString());
  for (const [k, v] of Object.entries(patch)) {
    if (v) next.set(k, v);
    else next.delete(k);
  }
  const qs = next.toString();
  return qs ? `/pesan?${qs}` : "/pesan";
}

/** Updates the URL without a server round trip; useSearchParams follows. */
function shallowNav(sp: URLSearchParams, patch: Patch, replace = false) {
  window.history[replace ? "replaceState" : "pushState"](null, "", urlFor(sp, patch));
}

/** Anchor that navigates client-side (still opens normally with ctrl/middle click). */
function Go({
  patch,
  replace,
  className,
  children,
  ...rest
}: { patch: Patch; replace?: boolean; className?: string; children: ReactNode } & Omit<ComponentProps<"a">, "href" | "onClick">) {
  const sp = useSearchParams();
  return (
    <a
      href={urlFor(sp, patch)}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        shallowNav(sp, patch, replace);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

/**
 * The whole booking flow runs on the client. Package and availability come from /api/paket and /api/jadwal
 * (fetched once, shared, with skeletons); the room count, price, duration and fitting slots are computed locally,
 * so nothing blocks the user while the network is slow. The URL is kept in sync with history.pushState so refresh,
 * back and the login redirect keep working. Only the final submit is blocked while a fetch is still running.
 */
export function OrderFlow({ notice }: { notice?: ReactNode }) {
  const sp = useSearchParams();
  const packages = useApi<{ packages: PackageDTO[] }>("/api/paket");
  // Fetched right away (not only at step 2) so the schedule is usually ready when the customer gets there.
  const schedule = useApi<ScheduleResponse>("/api/jadwal");

  const nav = (patch: Patch, replace = false) => shallowNav(sp, patch, replace);

  const list = packages.data?.packages;
  const pkg = list?.find((p) => String(p.id) === sp.get("pkg"));
  const room = pkg ? initialRooms({ min_rooms: pkg.minRooms, max_rooms: pkg.maxRooms }, sp.get("room") ?? undefined) : 0;
  const result = pkg ? computePackagePrice(pricingOf(pkg), room) : null;
  const duration = result?.duration ?? 0;

  const dateParam = sp.get("date") ?? "";
  const timeParam = sp.get("start_time") ?? "";
  const days = schedule.data
    ? schedule.data.days.map((d) => ({ date: d.date, slots: d.slots.map((s) => slotInfo(s, duration)) }))
    : [];
  const dayEntry = days.find((d) => d.date === dateParam);
  const timeSlot = dayEntry?.slots.find((s) => s.start_time === timeParam && s.fits);
  const nearest =
    dayEntry && !dayEntry.slots.some((s) => s.fits)
      ? (days.find((d) => d.date > dayEntry.date && d.slots.some((s) => s.fits))?.date ?? null)
      : null;

  // Deep link to step 3 (e.g. back from login): show the form right away, block submit until the slot is confirmed.
  const optimistic3 = !!pkg && DATE_RE.test(dateParam) && TIME_RE.test(timeParam) && !schedule.data && !schedule.error;
  const step = !pkg ? 1 : timeSlot || optimistic3 ? 3 : 2;

  const typeParam = sp.get("type");
  const type = typeParam && typeParam in PROPERTY_TYPES ? (typeParam as keyof typeof PROPERTY_TYPES) : undefined;

  const reset: Patch = { pkg: undefined, room: undefined, date: undefined, start_time: undefined };
  const steps = [
    { label: "Layanan", onSelect: () => nav(reset) },
    { label: "Jadwal", onSelect: () => nav({ date: undefined, start_time: undefined }) },
    { label: "Detail" },
    { label: "Bayar" },
  ];

  if (!list) {
    return (
      <>
        <Stepper steps={steps} current={1} />
        <div className="mt-8">
          {packages.error ? (
            <Alert tone="danger" title="Daftar layanan gagal dimuat">
              Periksa koneksi internet Anda.{" "}
              <button type="button" onClick={packages.retry} className="cursor-pointer font-semibold underline underline-offset-2">
                Coba lagi
              </button>
            </Alert>
          ) : (
            <PackagesSkeleton />
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Stepper steps={steps} current={step} />

      <div className="mt-8">
        {step === 1 && (
          <section aria-labelledby="h-layanan" className="flex flex-col gap-4">
            <h1 id="h-layanan" className="text-[28px] font-bold leading-tight tracking-tight">
              Pilih paket <span className="text-primary">layanan</span>
            </h1>
            <nav aria-label="Filter jenis properti" className="flex flex-wrap gap-2">
              <Chip patch={{ type: undefined }} active={!type}>
                Semua
              </Chip>
              {(Object.keys(PROPERTY_TYPES) as (keyof typeof PROPERTY_TYPES)[]).map((k) => (
                <Chip key={k} patch={{ type: k }} active={type === k}>
                  {PROPERTY_TYPES[k].label}
                </Chip>
              ))}
            </nav>
            {list.length === 0 ? (
              <EmptyState icon={IconSparkle} title="Belum ada paket yang tersedia. Silakan coba lagi nanti." />
            ) : (
              <ul className="flex flex-col gap-3">
                {list
                  .filter((p) => !type || p.type === type)
                  .map((p) => {
                    const pr = pricingOf(p);
                    return (
                      <li key={p.id}>
                        <Go
                          patch={{ pkg: String(p.id), type: undefined }}
                          className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 md:p-5"
                        >
                          <span>
                            <span className="block font-semibold">{p.name}</span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                              <IconClock size={16} />
                              {PROPERTY_TYPES[p.type].label} · {roomRange({ min_rooms: p.minRooms, max_rooms: p.maxRooms })} · mulai{" "}
                              {durationLabel(startDuration(pr))}
                            </span>
                          </span>
                          <span className="shrink-0 text-right font-bold tabular-nums">
                            <span className="block text-xs font-medium text-muted">mulai</span>
                            {rp(startingPrice(pr))}
                          </span>
                        </Go>
                      </li>
                    );
                  })}
              </ul>
            )}
          </section>
        )}

        {pkg && result && step === 2 && (
          <section aria-labelledby="h-jadwal" className="flex flex-col gap-6">
            <div>
              <h1 id="h-jadwal" className="text-[28px] font-bold leading-tight tracking-tight">
                Pilih <span className="text-primary">jadwal</span>
              </h1>
              <p className="mt-1 text-sm text-muted">
                {pkg.name} ·{" "}
                <Go patch={reset} className="font-semibold text-primary-ink underline-offset-2 hover:underline">
                  Ganti paket
                </Go>
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 md:p-5">
              <h2 className="text-sm font-semibold">Jumlah kamar</h2>
              <RoomStepper
                min={pkg.minRooms}
                max={pkg.maxRooms}
                value={room}
                onChange={(n) => nav({ room: String(n), start_time: undefined }, true)}
              />
              <p className="text-sm text-muted">
                {rp(pkg.basePrice)} biaya dasar + {room} × {rp(pkg.pricePerRoom)} per kamar
              </p>
              <p className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-3">
                <span className="text-sm text-muted">Estimasi durasi {durationLabel(result.duration)}</span>
                <span className="text-xl font-bold tabular-nums">{rp(result.total)}</span>
              </p>
            </div>

            {schedule.error && !schedule.data ? (
              <Alert tone="danger" title="Jadwal gagal dimuat">
                Periksa koneksi internet Anda.{" "}
                <button type="button" onClick={schedule.retry} className="cursor-pointer font-semibold underline underline-offset-2">
                  Coba lagi
                </button>
              </Alert>
            ) : !schedule.data ? (
              <ScheduleSkeleton />
            ) : (
              <>
                <div>
                  <h2 className="mb-3 text-sm font-semibold">Tanggal</h2>
                  <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden">
                    {days.slice(0, DAY_RANGE).map((d) => {
                      const full = !d.slots.some((s) => s.fits);
                      const dateObj = asUtc(d.date);
                      const active = d.date === dateParam;
                      const inner = (
                        <>
                          <span className="text-xs font-medium">
                            {dateObj.toLocaleDateString("id-ID", { weekday: "short", timeZone: "UTC" })}
                          </span>
                          <span className="text-xl font-bold tabular-nums">{dateObj.getUTCDate()}</span>
                          <span className="text-xs">
                            {full ? "Penuh" : dateObj.toLocaleDateString("id-ID", { month: "short", timeZone: "UTC" })}
                          </span>
                        </>
                      );
                      const cls = "flex h-[72px] w-16 shrink-0 flex-col items-center justify-center rounded-pill border";
                      return (
                        <li key={d.date}>
                          {full ? (
                            <span aria-disabled="true" className={cn(cls, "cursor-not-allowed border-border bg-surface-2 text-muted opacity-70")}>
                              {inner}
                            </span>
                          ) : (
                            <Go
                              patch={{ date: d.date, start_time: undefined }}
                              aria-current={active ? "date" : undefined}
                              className={cn(
                                cls,
                                "transition duration-150",
                                active ? "border-primary bg-primary text-on-primary" : "border-border-strong bg-surface hover:bg-surface-2",
                              )}
                            >
                              {inner}
                            </Go>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div>
                  <h2 className="mb-3 text-sm font-semibold">Jam</h2>
                  {!dayEntry ? (
                    <p className="text-sm text-muted">Pilih tanggal terlebih dahulu untuk melihat jam yang tersedia.</p>
                  ) : (
                    <>
                      {!dayEntry.slots.some((s) => s.fits) && (
                        <Alert tone="warn" title="Tidak ada jam yang muat di tanggal ini" className="mb-3">
                          Tidak ada slot yang cukup panjang dan masih tersedia untuk {room} kamar (estimasi {durationLabel(result.duration)}).{" "}
                          {nearest ? (
                            <>
                              Tanggal terdekat yang tersedia:{" "}
                              <Go patch={{ date: nearest, start_time: undefined }} className="font-semibold underline underline-offset-2">
                                {dateId(asUtc(nearest))}
                              </Go>
                              .
                            </>
                          ) : (
                            "Belum ada tanggal yang tersedia dalam 60 hari ke depan. Kurangi jumlah kamar atau hubungi admin."
                          )}
                        </Alert>
                      )}
                      {dayEntry.slots.length === 0 ? (
                        <p className="text-sm text-muted">Tidak ada jam operasional pada tanggal ini.</p>
                      ) : (
                        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                          {dayEntry.slots.map((s) => (
                            <li key={`${s.start_time}-${s.end_time}`}>
                              {s.fits ? (
                                <Go
                                  patch={{ start_time: s.start_time }}
                                  className="flex min-h-14 flex-col items-center justify-center rounded-pill border border-border-strong bg-surface px-3 text-[15px] font-semibold transition duration-150 hover:bg-surface-2"
                                >
                                  {s.start_time}–{s.end_time}
                                  <span className="text-xs font-normal text-muted">sisa {s.remaining}</span>
                                </Go>
                              ) : (
                                <span
                                  aria-disabled="true"
                                  className="flex min-h-14 cursor-not-allowed flex-col items-center justify-center rounded-pill border border-border bg-surface-2 px-3 text-center text-[15px] font-semibold text-muted"
                                >
                                  {s.start_time}–{s.end_time}
                                  <span className="text-xs font-normal">{s.reason}</span>
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {pkg && result && step === 3 && (
          <section aria-labelledby="h-detail" className="flex flex-col gap-6">
            <div>
              <h1 id="h-detail" className="text-[28px] font-bold leading-tight tracking-tight">
                Detail <span className="text-primary">lokasi</span>
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                <IconCheck size={16} className="text-ok" />
                {pkg.name}, {room} kamar, {dateId(asUtc(dateParam))}, {timeParam}
                <Go patch={{ start_time: undefined }} className="font-semibold text-primary-ink underline-offset-2 hover:underline">
                  Ubah jadwal
                </Go>
              </p>
            </div>
            {schedule.error && !timeSlot && (
              <Alert tone="warn" title="Ketersediaan belum bisa dipastikan">
                Koneksi bermasalah.{" "}
                <Button type="button" size="sm" variant="outline" onClick={schedule.retry}>
                  Coba lagi
                </Button>
              </Alert>
            )}
            <OrderForm
              packageId={pkg.id}
              packageName={pkg.name}
              room={room}
              breakdown={`${rp(pkg.basePrice)} dasar + ${room} × ${rp(pkg.pricePerRoom)}`}
              durationLabel={durationLabel(result.duration)}
              date={dateParam}
              startTime={timeParam}
              dateLabel={dateId(asUtc(dateParam))}
              hourLabel={timeSlot ? `${timeSlot.start_time}–${timeSlot.end_time} WIB` : `${timeParam} WIB`}
              totalLabel={rp(result.total)}
              defaultAddress={sp.get("address") ?? undefined}
              defaultNotes={sp.get("notes") ?? undefined}
              notice={notice}
              checking={schedule.fetching || !timeSlot}
            />
          </section>
        )}
      </div>
    </>
  );
}

function Chip({ patch, active, children }: { patch: Patch; active: boolean; children: ReactNode }) {
  return (
    <Go
      patch={patch}
      replace
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-pill border px-5 text-[15px] font-semibold transition duration-150",
        active ? "border-primary bg-primary text-on-primary" : "border-border-strong bg-transparent text-foreground hover:bg-surface-2",
      )}
    >
      {active && <IconCheck size={16} />}
      {children}
    </Go>
  );
}

export function PackagesSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      <Skeleton className="h-9 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-11 w-20 rounded-pill" />
        <Skeleton className="h-11 w-24 rounded-pill" />
        <Skeleton className="h-11 w-28 rounded-pill" />
      </div>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-20 rounded-lg" />
      ))}
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6">
      <div>
        <Skeleton className="mb-3 h-5 w-20" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-[72px] w-16 shrink-0 rounded-pill" />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="mb-3 h-5 w-12" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-14 rounded-pill" />
          ))}
        </div>
      </div>
    </div>
  );
}
