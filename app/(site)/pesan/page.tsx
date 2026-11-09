import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPaketAktif, JENIS_PROPERTI, durasiLabel } from "@/lib/katalog";
import { getSlotTersedia, nowWib, parseDate } from "@/lib/availability";
import { rp, tanggalId } from "@/lib/booking-status";
import { cn } from "@/lib/cn";
import { PesanForm } from "@/components/pesan/pesan-form";
import { EmptyState, Skeleton, Stepper } from "@/components/ui";
import { ChipLink } from "@/components/ui/chip-link";
import { IconCheck, IconClock, IconSparkle } from "@/components/icons";

export const metadata: Metadata = { title: "Pesan layanan" };

type Params = Promise<{
  paket?: string;
  tanggal?: string;
  jam_mulai?: string;
  jenis?: string;
  alamat?: string;
  catatan?: string;
}>;

const HARI_RANGE = 14;

function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const q = (o: Record<string, string | undefined>) => {
  const s = new URLSearchParams(Object.entries(o).filter(([, v]) => v) as [string, string][]).toString();
  return s ? `/pesan?${s}` : "/pesan";
};

async function Langkah({ searchParams }: { searchParams: Params }) {
  await connection();
  const sp = await searchParams;
  const [user, semua] = await Promise.all([getCurrentUser(), getPaketAktif()]);

  const paket = semua.find((p) => String(p.id_layanan) === sp.paket);
  const today = nowWib().date;
  const tanggal = sp.tanggal && parseDate(sp.tanggal) && sp.tanggal >= today ? sp.tanggal : undefined;

  // Ketersediaan 14 hari ke depan (hanya perlu saat sudah memilih paket).
  const days = paket
    ? await Promise.all(
        Array.from({ length: HARI_RANGE }, async (_, i) => {
          const date = addDays(today, i);
          const r = await getSlotTersedia(date);
          return { date, slots: r.ok ? r.slots : [] };
        }),
      )
    : [];
  const hari = days.find((d) => d.date === tanggal);
  const jam = hari?.slots.find((s) => s.jam_mulai === sp.jam_mulai);

  const step = !paket ? 1 : !hari || !jam ? 2 : 3;
  const steps = [
    { label: "Layanan", href: "/pesan" },
    { label: "Jadwal", href: q({ paket: sp.paket }) },
    { label: "Detail" },
    { label: "Bayar" },
  ];

  const jenis = sp.jenis && sp.jenis in JENIS_PROPERTI ? sp.jenis : undefined;

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
              <ChipLink href="/pesan" active={!jenis} scroll={false}>
                Semua
              </ChipLink>
              {(Object.keys(JENIS_PROPERTI) as (keyof typeof JENIS_PROPERTI)[]).map((k) => (
                <ChipLink key={k} href={q({ jenis: k })} active={jenis === k} scroll={false}>
                  {JENIS_PROPERTI[k].label}
                </ChipLink>
              ))}
            </nav>
            {semua.length === 0 ? (
              <EmptyState icon={IconSparkle} title="Belum ada paket yang tersedia. Silakan coba lagi nanti." />
            ) : (
              <ul className="flex flex-col gap-3">
                {semua
                  .filter((p) => !jenis || p.jenis_properti === jenis)
                  .map((p) => (
                    <li key={p.id_layanan}>
                      <Link
                        href={q({ paket: String(p.id_layanan) })}
                        className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 md:p-5"
                      >
                        <span>
                          <span className="block font-semibold">{p.nama_layanan}</span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                            <IconClock size={16} />
                            {durasiLabel(p.durasi_menit)} · {JENIS_PROPERTI[p.jenis_properti].label}
                          </span>
                        </span>
                        <span className="shrink-0 font-bold tabular-nums">{rp(p.harga)}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        )}

        {paket && step === 2 && (
          <section aria-labelledby="h-jadwal" className="flex flex-col gap-6">
            <div>
              <h1 id="h-jadwal" className="text-[28px] font-bold leading-tight tracking-tight">
                Pilih <span className="text-primary">jadwal</span>
              </h1>
              <p className="mt-1 text-sm text-muted">
                {paket.nama_layanan} · {rp(paket.harga)} ·{" "}
                <Link href="/pesan" className="font-semibold text-primary-ink underline-offset-2 hover:underline">
                  Ganti paket
                </Link>
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold">Tanggal</h2>
              <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden">
                {days.map((d) => {
                  const full = d.slots.length === 0;
                  const date = new Date(`${d.date}T00:00:00.000Z`);
                  const active = d.date === tanggal;
                  const inner = (
                    <>
                      <span className="text-xs font-medium">
                        {date.toLocaleDateString("id-ID", { weekday: "short", timeZone: "UTC" })}
                      </span>
                      <span className="text-xl font-bold tabular-nums">{date.getUTCDate()}</span>
                      <span className="text-xs">
                        {full ? "Penuh" : date.toLocaleDateString("id-ID", { month: "short", timeZone: "UTC" })}
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
                          href={q({ paket: sp.paket, tanggal: d.date })}
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
              {!hari ? (
                <p className="text-sm text-muted">Pilih tanggal terlebih dahulu untuk melihat jam yang tersedia.</p>
              ) : (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {hari.slots.map((s) => (
                    <li key={`${s.jam_mulai}-${s.jam_selesai}`}>
                      <Link
                        href={q({
                          paket: sp.paket,
                          tanggal: hari.date,
                          jam_mulai: s.jam_mulai,
                          alamat: sp.alamat,
                          catatan: sp.catatan,
                        })}
                        className="flex min-h-14 flex-col items-center justify-center rounded-pill border border-border-strong bg-surface px-3 text-[15px] font-semibold transition duration-150 hover:bg-surface-2"
                      >
                        {s.jam_mulai}–{s.jam_selesai}
                        <span className="text-xs font-normal text-muted">sisa {s.sisa}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {paket && hari && jam && step === 3 && (
          <section aria-labelledby="h-detail" className="flex flex-col gap-6">
            <div>
              <h1 id="h-detail" className="text-[28px] font-bold leading-tight tracking-tight">
                Detail <span className="text-primary">lokasi</span>
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                <IconCheck size={16} className="text-ok" />
                {paket.nama_layanan}, {tanggalId(new Date(`${hari.date}T00:00:00.000Z`))}, {jam.jam_mulai}
                <Link
                  href={q({ paket: sp.paket, tanggal: hari.date })}
                  className="font-semibold text-primary-ink underline-offset-2 hover:underline"
                >
                  Ubah jadwal
                </Link>
              </p>
            </div>
            <PesanForm
              paketId={paket.id_layanan}
              paketNama={paket.nama_layanan}
              tanggal={hari.date}
              jamMulai={jam.jam_mulai}
              tanggalLabel={tanggalId(new Date(`${hari.date}T00:00:00.000Z`))}
              jamLabel={`${jam.jam_mulai}–${jam.jam_selesai} WIB`}
              totalLabel={rp(paket.harga)}
              defaultAlamat={sp.alamat}
              defaultCatatan={sp.catatan}
              loggedIn={!!user}
            />
          </section>
        )}
      </div>
    </>
  );
}

function LangkahSkeleton() {
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

export default function PesanPage({ searchParams }: { searchParams: Params }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-14">
      <Suspense fallback={<LangkahSkeleton />}>
        <Langkah searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
