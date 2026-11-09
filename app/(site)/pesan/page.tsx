import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPaketAktif, JENIS_PROPERTI, durasiLabel } from "@/lib/katalog";
import { addDays, cariTanggalTerdekat, getSlotRange, nowWib, parseDate } from "@/lib/availability";
import { rp, tanggalId } from "@/lib/booking-status";
import { durasiMulai, hargaMulai, hitungPaket, kamarAwal, rentangKamar } from "@/lib/harga";
import { cn } from "@/lib/cn";
import { PesanForm } from "@/components/pesan/pesan-form";
import { KamarStepper } from "@/components/pesan/kamar-stepper";
import { Alert, EmptyState, Skeleton, Stepper } from "@/components/ui";
import { ChipLink } from "@/components/ui/chip-link";
import { IconCheck, IconClock, IconSparkle } from "@/components/icons";

export const metadata: Metadata = { title: "Pesan layanan" };

type Params = Promise<{
  paket?: string;
  kamar?: string;
  tanggal?: string;
  jam_mulai?: string;
  jenis?: string;
  alamat?: string;
  catatan?: string;
}>;

const HARI_RANGE = 14;

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

  // Jumlah kamar dipilih pelanggan (default min_kamar). Total dan durasi di sini hanya
  // tampilan; server menghitung ulang dan memvalidasi saat booking dibuat.
  const kamar = paket ? kamarAwal(paket, sp.kamar) : 0;
  const hasil = paket ? hitungPaket(paket, kamar) : null;
  const kamarStr = paket ? String(kamar) : undefined;

  // Ketersediaan 14 hari ke depan (hanya perlu saat sudah memilih paket). Slot yang tidak muat
  // (penuh atau lebih pendek dari durasi) tetap ada dengan `alasan`; `muat` menentukan bisa dipilih.
  const days =
    paket && hasil
      ? [...(await getSlotRange(today, HARI_RANGE, hasil.durasi))].map(([date, slots]) => ({ date, slots }))
      : [];
  const hari = days.find((d) => d.date === tanggal);
  const jam = hari?.slots.find((s) => s.jam_mulai === sp.jam_mulai && s.muat);
  // Tanggal terpilih tidak punya slot yang muat: tawarkan tanggal terdekat sesudahnya untuk jumlah kamar ini.
  const terdekat =
    hasil && hari && !hari.slots.some((s) => s.muat) ? await cariTanggalTerdekat(addDays(hari.date, 1), hasil.durasi) : null;

  const step = !paket ? 1 : !hari || !jam ? 2 : 3;
  const steps = [
    { label: "Layanan", href: "/pesan" },
    { label: "Jadwal", href: q({ paket: sp.paket, kamar: kamarStr }) },
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
                            {JENIS_PROPERTI[p.jenis_properti].label} · {rentangKamar(p)} · mulai {durasiLabel(durasiMulai(p))}
                          </span>
                        </span>
                        <span className="shrink-0 text-right font-bold tabular-nums">
                          <span className="block text-xs font-medium text-muted">mulai</span>
                          {rp(hargaMulai(p))}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        )}

        {paket && hasil && step === 2 && (
          <section aria-labelledby="h-jadwal" className="flex flex-col gap-6">
            <div>
              <h1 id="h-jadwal" className="text-[28px] font-bold leading-tight tracking-tight">
                Pilih <span className="text-primary">jadwal</span>
              </h1>
              <p className="mt-1 text-sm text-muted">
                {paket.nama_layanan} ·{" "}
                <Link href="/pesan" className="font-semibold text-primary-ink underline-offset-2 hover:underline">
                  Ganti paket
                </Link>
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 md:p-5">
              <h2 className="text-sm font-semibold">Jumlah kamar</h2>
              <KamarStepper
                min={paket.min_kamar}
                max={paket.max_kamar}
                value={kamar}
                base={Object.fromEntries(
                  Object.entries({ paket: sp.paket, tanggal, alamat: sp.alamat, catatan: sp.catatan }).filter(([, v]) => v),
                ) as Record<string, string>}
              />
              <p className="text-sm text-muted">
                {rp(paket.harga_dasar)} biaya dasar + {kamar} × {rp(paket.harga_per_kamar)} per kamar
              </p>
              <p className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-3">
                <span className="text-sm text-muted">Estimasi durasi {durasiLabel(hasil.durasi)}</span>
                <span className="text-xl font-bold tabular-nums">{rp(hasil.total)}</span>
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold">Tanggal</h2>
              <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden">
                {days.map((d) => {
                  const full = !d.slots.some((s) => s.muat);
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
                          href={q({ paket: sp.paket, kamar: kamarStr, tanggal: d.date })}
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
                <>
                  {!hari.slots.some((s) => s.muat) && (
                    <Alert tone="warn" title="Tidak ada jam yang muat di tanggal ini" className="mb-3">
                      Tidak ada slot yang cukup panjang dan masih tersedia untuk {kamar} kamar (estimasi {durasiLabel(hasil.durasi)}).{" "}
                      {terdekat ? (
                        <>
                          Tanggal terdekat yang tersedia:{" "}
                          <Link
                            href={q({ paket: sp.paket, kamar: kamarStr, tanggal: terdekat, alamat: sp.alamat, catatan: sp.catatan })}
                            scroll={false}
                            className="font-semibold underline underline-offset-2"
                          >
                            {tanggalId(new Date(`${terdekat}T00:00:00.000Z`))}
                          </Link>
                          .
                        </>
                      ) : (
                        "Belum ada tanggal yang tersedia dalam 60 hari ke depan. Kurangi jumlah kamar atau hubungi admin."
                      )}
                    </Alert>
                  )}
                  {hari.slots.length === 0 ? (
                    <p className="text-sm text-muted">Tidak ada jam operasional pada tanggal ini.</p>
                  ) : (
                    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {hari.slots.map((s) => (
                        <li key={`${s.jam_mulai}-${s.jam_selesai}`}>
                          {s.muat ? (
                            <Link
                              href={q({
                                paket: sp.paket,
                                kamar: kamarStr,
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
                          ) : (
                            <span
                              aria-disabled="true"
                              className="flex min-h-14 cursor-not-allowed flex-col items-center justify-center rounded-pill border border-border bg-surface-2 px-3 text-center text-[15px] font-semibold text-muted"
                            >
                              {s.jam_mulai}–{s.jam_selesai}
                              <span className="text-xs font-normal">{s.alasan}</span>
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

        {paket && hasil && hari && jam && step === 3 && (
          <section aria-labelledby="h-detail" className="flex flex-col gap-6">
            <div>
              <h1 id="h-detail" className="text-[28px] font-bold leading-tight tracking-tight">
                Detail <span className="text-primary">lokasi</span>
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                <IconCheck size={16} className="text-ok" />
                {paket.nama_layanan}, {kamar} kamar, {tanggalId(new Date(`${hari.date}T00:00:00.000Z`))}, {jam.jam_mulai}
                <Link
                  href={q({ paket: sp.paket, kamar: kamarStr, tanggal: hari.date })}
                  className="font-semibold text-primary-ink underline-offset-2 hover:underline"
                >
                  Ubah jadwal
                </Link>
              </p>
            </div>
            <PesanForm
              paketId={paket.id_layanan}
              paketNama={paket.nama_layanan}
              kamar={kamar}
              rincian={`${rp(paket.harga_dasar)} dasar + ${kamar} × ${rp(paket.harga_per_kamar)}`}
              durasiLabel={durasiLabel(hasil.durasi)}
              tanggal={hari.date}
              jamMulai={jam.jam_mulai}
              tanggalLabel={tanggalId(new Date(`${hari.date}T00:00:00.000Z`))}
              jamLabel={`${jam.jam_mulai}–${jam.jam_selesai} WIB`}
              totalLabel={rp(hasil.total)}
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
