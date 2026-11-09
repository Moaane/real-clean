import { KONTAK } from "@/lib/kontak";
import { Accordion, ButtonLink, Card, SectionHeading } from "@/components/ui";
import { IconPhone } from "@/components/icons";

const FAQ = [
  {
    q: "Bagaimana cara membayar?",
    a: "Pembayaran dilakukan online lewat Midtrans. Booking baru dianggap dibayar setelah pembayaran dikonfirmasi sistem, bukan hanya setelah Anda kembali dari halaman bayar.",
  },
  {
    q: "Berapa lama batas waktu pembayaran?",
    a: "Anda punya waktu 1 jam setelah membuat booking. Lewat dari itu booking kedaluwarsa dan slot dilepas untuk pelanggan lain.",
  },
  {
    q: "Apakah peralatan dan cairan pembersih disediakan?",
    a: "Ya. Petugas membawa peralatan dan cairan pembersih sendiri. Anda cukup memastikan akses air dan listrik tersedia.",
  },
  {
    q: "Bisakah saya membatalkan pesanan?",
    a: "Bisa, selama booking berstatus Dibayar atau Petugas ditugaskan. Admin akan memeriksa apakah pembatalan memenuhi syarat sebelum jadwal.",
  },
  {
    q: "Berapa lama pekerjaan berlangsung?",
    a: "Durasi tercantum di setiap paket, mulai dari sekitar satu jam untuk kebersihan reguler sampai beberapa jam untuk deep cleaning.",
  },
];

/** Mockup 5: kiri judul + kartu kontak, kanan accordion. */
export function Faq() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 md:px-6 md:pt-24">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
        <div className="flex flex-col gap-6">
          <SectionHeading title="Pertanyaan" accent="umum" className="md:flex-col md:items-start" />
          <Card className="flex flex-col gap-4 bg-primary-soft">
            <p className="text-lg font-semibold text-on-primary-soft">Masih ada pertanyaan? Hubungi kami sekarang.</p>
            <div>
              <ButtonLink href={KONTAK.waHref} variant="outline" className="bg-surface">
                <IconPhone size={18} />
                Hubungi kami
              </ButtonLink>
            </div>
          </Card>
        </div>
        <Accordion items={FAQ} />
      </div>
    </section>
  );
}
