import Link from "next/link";
import { Icon } from "@/components/icons";
import { SectionHeading } from "@/components/ui";
import { Photo } from "@/components/ui/photo";
import { TINGKAT_DETAIL } from "@/lib/katalog";

const ITEMS: { key: keyof typeof TINGKAT_DETAIL; text: string }[] = [
  { key: "reguler", text: "Perawatan rutin: menyapu, mengepel, dan merapikan area yang sering dipakai." },
  { key: "detail", text: "Termasuk sudut, perabot, dan permukaan yang jarang tersentuh." },
  { key: "deep", text: "Pembersihan menyeluruh untuk ruangan yang lama tidak dibersihkan atau baru ditempati." },
];

export function Tingkat() {
  return (
    <section aria-labelledby="tingkat-judul" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <SectionHeading
        id="tingkat-judul"
        align="split"
        upper
        title="Pilih tingkat"
        highlight="kebersihan"
        lead="Setiap paket tersedia dalam tiga tingkat. Pilih sesuai kondisi ruangan Anda."
      />
      <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {ITEMS.map((t, i) => (
          <li key={t.key} className="card flex flex-col gap-4 p-3 md:p-3">
            <Photo
              src={`/images/landing/tingkat-${t.key}.webp`}
              alt={`Contoh pembersihan tingkat ${TINGKAT_DETAIL[t.key].toLowerCase()}`}
              ratio="4 / 5"
              sizes="(min-width: 1024px) 270px, (min-width: 640px) 45vw, 100vw"
              icon="sparkle"
            />
            <div className="px-2 pb-3">
              <p className="text-sm font-semibold text-primary">0{i + 1}/</p>
              <h3 className="mt-0.5 text-lg font-semibold">{TINGKAT_DETAIL[t.key]}</h3>
              <p className="mt-1 text-sm text-muted">{t.text}</p>
            </div>
          </li>
        ))}
        <li className="flex min-h-48 flex-col items-start justify-between gap-6 rounded-lg bg-primary-soft p-6 text-on-primary-soft sm:col-span-2 lg:col-span-1">
          <p className="h2">Lihat semua paket rumah dan kos</p>
          <Link
            href="#paket"
            aria-label="Lihat semua paket"
            className="grid size-14 place-items-center rounded-pill bg-primary text-on-primary transition-colors duration-150 hover:bg-primary-hover"
          >
            <Icon name="arrow" size={24} />
          </Link>
        </li>
      </ol>
    </section>
  );
}
