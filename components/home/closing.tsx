import { ButtonLink } from "@/components/ui";
import { IconCheck } from "@/components/icons";
import { QuickBookLoader } from "./paket-list";

const POINTS = ["Petugas membawa alat dan cairan sendiri", "Harga jelas sebelum bayar, tanpa biaya tersembunyi", "Pilih jadwal sesuai slot yang tersedia"];

/** Closing CTA: pastel panel in the style of mockup 6 + live package configurator. */
export function Closing() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 md:px-6 md:pt-24">
      <div className="grid gap-8 rounded-xl border border-border bg-surface p-5 md:p-12 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-14">

        <div className="flex flex-col items-start gap-6">
          <h2 className="title-display text-[34px] md:text-[52px]">
            Hunian bersih,
            <br />
            <span className="text-primary">tinggal pesan.</span>
          </h2>
          <p className="max-w-md text-[15px] text-muted">
            Atur pilihan Anda di samping dan lihat harganya langsung. Siap jadwal dalam beberapa klik.
          </p>
          <ul className="flex flex-col gap-3">
            {POINTS.map((t) => (
              <li key={t} className="flex items-start gap-3 text-[15px]">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-pill bg-primary text-on-primary">
                  <IconCheck size={14} strokeWidth={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <ButtonLink href="/layanan" variant="outline" arrow>
            Lihat semua paket
          </ButtonLink>
        </div>

        <QuickBookLoader />
      </div>
    </section>
  );
}
