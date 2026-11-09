import { connection } from "next/server";
import { getPaketAktif, TINGKAT_DETAIL } from "@/lib/katalog";
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
    tingkatKey: p.tingkat_detail,
    tingkat: TINGKAT_DETAIL[p.tingkat_detail],
    hargaDasar: p.harga_dasar,
    hargaPerKamar: p.harga_per_kamar,
    durasiDasar: p.durasi_dasar_menit,
    durasiPerKamar: p.durasi_per_kamar_menit,
    minKamar: p.min_kamar,
    maxKamar: p.max_kamar,
  }));

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
