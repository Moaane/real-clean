import { connection } from "next/server";
import { getPaketAktif } from "@/lib/katalog";
import { rp } from "@/lib/booking-status";
import { ButtonLink, EmptyState, SectionHeading } from "@/components/ui";
import { IconSparkle } from "@/components/icons";
import { fotoAda } from "@/components/ui/photo";
import { PaketCarousel, type PaketTile } from "./paket-carousel";

/** Mockup 2: judul kiri, deskripsi kanan, chip + carousel kartu foto. */
export async function LayananSection() {
  await connection();
  const paket = await getPaketAktif();
  const items: PaketTile[] = paket.map((p) => ({
    id: p.id_layanan,
    nama: p.nama_layanan,
    jenis: p.jenis_properti,
    hargaLabel: rp(p.harga),
    adaFoto: fotoAda(`paket-${p.jenis_properti}`),
  }));

  return (
    <section id="layanan" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-16 md:px-6 md:pt-24">
      <SectionHeading
        accent="Layanan kebersihan"
        after="kami"
        description="Dari kebersihan rutin sampai deep cleaning, kami memastikan hunian dan kos Anda selalu bersih dan higienis."
      />
      {items.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={IconSparkle}
          title="Paket layanan belum tersedia. Silakan kembali lagi nanti."
        />
      ) : (
        <>
          <PaketCarousel items={items} />
          <div className="mt-4">
            <ButtonLink href="/layanan" variant="outline" arrow>
              Lihat semua paket
            </ButtonLink>
          </div>
        </>
      )}
    </section>
  );
}
