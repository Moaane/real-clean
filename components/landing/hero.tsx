import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Icon, type IconName } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import { Photo } from "@/components/ui/photo";
import { rp } from "@/lib/booking-status";
import { getPaketAktif } from "@/lib/katalog";

const CHIPS: { icon: IconName; text: string }[] = [
  { icon: "shield", text: "Petugas terverifikasi" },
  { icon: "receipt", text: "Harga tetap" },
  { icon: "check", text: "Bayar online" },
];

async function HargaMulai() {
  await connection();
  let teks = "Lihat daftar harga";
  try {
    const items = await getPaketAktif();
    if (items.length) teks = rp(Math.min(...items.map((i) => i.harga)));
  } catch {
    // The package section below shows the error state; here we just fall back.
  }
  return <span className="text-lg font-bold tabular-nums">{teks}</span>;
}

export function Hero() {
  return (
    <section aria-labelledby="hero-judul" className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 md:pb-24 md:pt-14">
      <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end md:gap-12">
        <h1 id="hero-judul" className="display uppercase">
          Rumah &amp; kos bersih, <span className="text-primary">tanpa repot</span>
        </h1>
        <div className="flex flex-col gap-6">
          <p className="text-muted">
            Pilih paket, tentukan tanggal dan jam, lalu petugas kami datang ke lokasi Anda. Harga dan durasi jelas
            sebelum Anda mendaftar.
          </p>
          <p className="flex items-center gap-3 text-sm text-muted">
            <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-primary-soft text-on-primary-soft">
              <Icon name="receipt" size={20} />
            </span>
            <span className="flex flex-col leading-tight">
              Mulai dari
              <Suspense fallback={<span aria-hidden="true" className="mt-1 block h-6 w-28 animate-pulse rounded-pill bg-surface-2" />}>
                <span className="text-foreground">
                  <HargaMulai />
                </span>
              </Suspense>
            </span>
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="#paket" className={buttonClass("primary", "lg")}>
              Lihat paket
              <Icon name="arrow" size={20} />
            </Link>
            <Link href="#cara" className={buttonClass("outline", "lg")}>
              Cara kerja
            </Link>
          </div>
        </div>
      </div>

      <div className="relative mt-10 md:mt-12">
        <Photo
          src="/images/landing/hero.webp"
          alt="Petugas GoClean membersihkan langit-langit rumah"
          ratio="4 / 3"
          sizes="(min-width: 1152px) 1104px, 100vw"
          icon="sparkle"
          priority
          className="rounded-xl md:aspect-[16/7]!"
        />
        <ul aria-label="Keunggulan" className="mt-4 flex flex-wrap gap-2 md:absolute md:bottom-6 md:left-6 md:mt-0">
          {CHIPS.map((c) => (
            <li
              key={c.text}
              className="inline-flex min-h-10 items-center gap-2 rounded-pill border border-border bg-surface px-4 text-sm font-semibold"
            >
              <Icon name={c.icon} size={18} className="text-primary" />
              {c.text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
