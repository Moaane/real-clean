import { connection } from "next/server";
import { durasiLabel, getPaketAktif, TINGKAT_DETAIL } from "@/lib/katalog";
import { rp } from "@/lib/booking-status";
import { ButtonLink } from "@/components/ui";
import { IconCheck } from "@/components/icons";
import { QuickBook, type QuickPaket } from "./quick-book";

const POIN = ["Petugas membawa alat dan cairan sendiri", "Harga jelas sebelum bayar, tanpa biaya tersembunyi", "Pilih jadwal sesuai slot yang tersedia"];

/** CTA penutup: panel pastel bergaya mockup 6 + konfigurator paket langsung. */
export async function Closing() {
  await connection();
  const paket = await getPaketAktif();
  const items: QuickPaket[] = paket.map((p) => ({
    id: p.id_layanan,
    nama: p.nama_layanan,
    jenis: p.jenis_properti,
    kamar: p.jumlah_kamar,
    tingkatKey: p.tingkat_detail,
    tingkat: TINGKAT_DETAIL[p.tingkat_detail],
    durasi: durasiLabel(p.durasi_menit),
    harga: p.harga,
    hargaLabel: rp(p.harga),
  }));

  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 md:px-6 md:pt-24">
      <div className="relative isolate grid gap-8 overflow-hidden rounded-xl bg-primary-soft p-5 md:p-12 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-14">
        {/* Bentuk dekoratif lembut */}
        <span aria-hidden="true" className="anim-float absolute -left-16 -top-16 -z-10 size-64 rounded-pill bg-primary/20" />
        <span aria-hidden="true" className="anim-float absolute -bottom-24 left-1/3 -z-10 size-72 rounded-pill bg-surface/70 [animation-delay:-3s]" />
        <span aria-hidden="true" className="anim-float absolute -right-10 -top-10 -z-10 size-40 rounded-pill bg-primary/15 [animation-delay:-5s]" />

        <div className="flex flex-col items-start gap-6">
          <h2 className="title-display text-[34px] md:text-[52px]">
            Hunian bersih,
            <br />
            <span className="text-primary">tinggal pesan.</span>
          </h2>
          <p className="max-w-md text-[15px] text-on-primary-soft">
            Atur pilihan Anda di samping dan lihat harganya langsung. Siap jadwal dalam beberapa klik.
          </p>
          <ul className="flex flex-col gap-3">
            {POIN.map((t) => (
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

        {items.length > 0 ? (
          <QuickBook paket={items} />
        ) : (
          <div className="rounded-xl bg-surface p-6 text-center text-muted">Paket belum tersedia. Silakan kembali lagi nanti.</div>
        )}
      </div>
    </section>
  );
}
