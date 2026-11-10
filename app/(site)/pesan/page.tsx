import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getActivePackages, PROPERTY_TYPES, durationLabel } from "@/lib/katalog";
import { addDays, findNearestDate, getSlotRange, nowWib, parseDate } from "@/lib/availability";
import { rp, dateId } from "@/lib/booking-status";
import { startDuration, startingPrice, computePackagePrice, initialRooms, roomRange } from "@/lib/harga";
import { cn } from "@/lib/cn";
import { OrderForm } from "@/components/pesan/pesan-form";
import { RoomStepper } from "@/components/pesan/kamar-stepper";
import { Alert, EmptyState, Skeleton, Stepper } from "@/components/ui";
import { ChipLink } from "@/components/ui/chip-link";
import { IconCheck, IconClock, IconSparkle } from "@/components/icons";

export const metadata: Metadata = { title: "Pesan layanan" };

type Params = Promise<{
  pkg?: string;
  room?: string;
  date?: string;
  start_time?: string;
  type?: string;
  address?: string;
  notes?: string;
}>;

const DAY_RANGE = 14;

const q = (o: Record<string, string | undefined>) => {
  const s = new URLSearchParams(Object.entries(o).filter(([, v]) => v) as [string, string][]).toString();
  return s ? `/pesan?${s}` : "/pesan";
};

async function OrderStep({ searchParams }: { searchParams: Params }) {
  await connection();
  const sp = await searchParams;
  const [user, allPkgs] = await Promise.all([getCurrentUser(), getActivePackages()]);

  const pkg = allPkgs.find((p) => String(p.id_service) === sp.pkg);
  const today = nowWib().date;
  const date = sp.date && parseDate(sp.date) && sp.date >= today ? sp.date : undefined;

  // Jumlah kamar dipilih pelanggan (default min_kamar). Total dan durasi di sini hanya
  // tampilan; server menghitung ulang dan memvalidasi saat booking dibuat.
  const room = pkg ? initialRooms(pkg, sp.room) : 0;
  const result = pkg ? computePackagePrice(pkg, room) : null;
  const roomsStr = pkg ? String(room) : undefined;

  // Ketersediaan 14 hari ke depan (hanya perlu saat sudah memilih paket). Slot yang tidak muat
  // (penuh atau lebih pendek dari durasi) tetap ada dengan `alasan`; `muat` menentukan bisa dipilih.
  const days =
    pkg && result
      ? [...(await getSlotRange(today, DAY_RANGE, result.duration))].map(([date, slots]) => ({ date, slots }))
      : [];
  const dayEntry = days.find((d) => d.date === date);
  const timeSlot = dayEntry?.slots.find((s) => s.start_time === sp.start_time && s.fits);
  // Tanggal terpilih tidak punya slot yang muat: tawarkan tanggal terdekat sesudahnya untuk jumlah kamar ini.
  const nearest =
    result && dayEntry && !dayEntry.slots.some((s) => s.fits) ? await findNearestDate(addDays(dayEntry.date, 1), result.duration) : null;

  const step = !pkg ? 1 : !dayEntry || !timeSlot ? 2 : 3;
  const steps = [
    { label: "Layanan", href: "/pesan" },
    { label: "Jadwal", href: q({ pkg: sp.pkg, room: roomsStr }) },
    { label: "Detail" },
    { label: "Bayar" },
  ];

  const type = sp.type && sp.type in PROPERTY_TYPES ? sp.type : undefined;

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
              <ChipLink href="/pesan" active={!type} scroll={false}>
                Semua
              </ChipLink>
              {(Object.keys(PROPERTY_TYPES) as (keyof typeof PROPERTY_TYPES)[]).map((k) => (
                <ChipLink key={k} href={q({ type: k })} active={type === k} scroll={false}>
                  {PROPERTY_TYPES[k].label}
                </ChipLink>
              ))}
            </nav>
            {allPkgs.length === 0 ? (
              <EmptyState icon={IconSparkle} title="Belum ada paket yang tersedia. Silakan coba lagi nanti." />
            ) : (
              <ul className="flex flex-col gap-3">
                {allPkgs
                  .filter((p) => !type || p.property_type === type)
                  .map((p) => (
                    <li key={p.id_service}>
                      <Link
                        href={q({ pkg: String(p.id_service) })}
                        className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 md:p-5"
                      >
                        <span>
                          <span className="block font-semibold">{p.service_name}</span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                            <IconClock size={16} />
                            {PROPERTY_TYPES[p.property_type].label} · {roomRange(p)} · mulai {durationLabel(startDuration(p))}
                          </span>
                        </span>
                        <span className="shrink-0 text-right font-bold tabular-nums">
                          <span className="block text-xs font-medium text-muted">mulai</span>
                          {rp(startingPrice(p))}
                        </span>
                      </Link>
                    </li>
                  ))}
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
                {pkg.service_name} ·{" "}
                <Link href="/pesan" className="font-semibold text-primary-ink underline-offset-2 hover:underline">
                  Ganti paket
                </Link>
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 md:p-5">
              <h2 className="text-sm font-semibold">Jumlah kamar</h2>
              <RoomStepper
                min={pkg.min_rooms}
                max={pkg.max_rooms}
                value={room}
                base={Object.fromEntries(
                  Object.entries({ pkg: sp.pkg, date, address: sp.address, notes: sp.notes }).filter(([, v]) => v),
                ) as Record<string, string>}
              />
              <p className="text-sm text-muted">
                {rp(pkg.base_price)} biaya dasar + {room} × {rp(pkg.price_per_room)} per kamar
              </p>
              <p className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-3">
                <span className="text-sm text-muted">Estimasi durasi {durationLabel(result.duration)}</span>
                <span className="text-xl font-bold tabular-nums">{rp(result.total)}</span>
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold">Tanggal</h2>
              <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden">
                {days.map((d) => {
                  const full = !d.slots.some((s) => s.fits);
                  const dateObj = new Date(`${d.date}T00:00:00.000Z`);
                  const active = d.date === date;
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
                        <span
                          aria-disabled="true"
                          className={cn(cls, "cursor-not-allowed border-border bg-surface-2 text-muted opacity-70")}
                        >
                          {inner}
                        </span>
                      ) : (
                        <Link
                          href={q({ pkg: sp.pkg, room: roomsStr, date: d.date })}
                          scroll={false}
                          aria-current={active ? "date" : undefined}
                          className={cn(
                            cls,
                            "transition duration-150",
                            active
                              ? "border-primary bg-primary text-on-primary"
                              : "border-border-strong bg-surface hover:bg-surface-2",
                          )}
                        >
                          {inner}
                        </Link>
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
                          <Link
                            href={q({ pkg: sp.pkg, room: roomsStr, date: nearest, address: sp.address, notes: sp.notes })}
                            scroll={false}
                            className="font-semibold underline underline-offset-2"
                          >
                            {dateId(new Date(`${nearest}T00:00:00.000Z`))}
                          </Link>
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
                            <Link
                              href={q({
                                pkg: sp.pkg,
                                room: roomsStr,
                                date: dayEntry.date,
                                start_time: s.start_time,
                                address: sp.address,
                                notes: sp.notes,
                              })}
                              className="flex min-h-14 flex-col items-center justify-center rounded-pill border border-border-strong bg-surface px-3 text-[15px] font-semibold transition duration-150 hover:bg-surface-2"
                            >
                              {s.start_time}–{s.end_time}
                              <span className="text-xs font-normal text-muted">sisa {s.remaining}</span>
                            </Link>
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
          </section>
        )}

        {pkg && result && dayEntry && timeSlot && step === 3 && (
          <section aria-labelledby="h-detail" className="flex flex-col gap-6">
            <div>
              <h1 id="h-detail" className="text-[28px] font-bold leading-tight tracking-tight">
                Detail <span className="text-primary">lokasi</span>
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                <IconCheck size={16} className="text-ok" />
                {pkg.service_name}, {room} kamar, {dateId(new Date(`${dayEntry.date}T00:00:00.000Z`))}, {timeSlot.start_time}
                <Link
                  href={q({ pkg: sp.pkg, room: roomsStr, date: dayEntry.date })}
                  className="font-semibold text-primary-ink underline-offset-2 hover:underline"
                >
                  Ubah jadwal
                </Link>
              </p>
            </div>
            <OrderForm
              packageId={pkg.id_service}
              packageName={pkg.service_name}
              room={room}
              breakdown={`${rp(pkg.base_price)} dasar + ${room} × ${rp(pkg.price_per_room)}`}
              durationLabel={durationLabel(result.duration)}
              date={dayEntry.date}
              startTime={timeSlot.start_time}
              dateLabel={dateId(new Date(`${dayEntry.date}T00:00:00.000Z`))}
              hourLabel={`${timeSlot.start_time}–${timeSlot.end_time} WIB`}
              totalLabel={rp(result.total)}
              defaultAddress={sp.address}
              defaultNotes={sp.notes}
              loggedIn={!!user}
            />
          </section>
        )}
      </div>
    </>
  );
}

function StepsSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="h-8 w-full" />
      <div className="mt-8 flex flex-col gap-3">
        <Skeleton className="h-9 w-2/3" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function OrderPage({ searchParams }: { searchParams: Params }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-14">
      <Suspense fallback={<StepsSkeleton />}>
        <OrderStep searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
