import Link from "next/link";
import { Icon } from "@/components/icons";
import { buttonClass, SectionHeading } from "@/components/ui";

const FAQ: { q: string; a: string }[] = [
  {
    q: "Apakah saya harus login untuk melihat harga?",
    a: "Tidak. Daftar paket, harga, dan durasi bisa dilihat siapa saja. Login baru diperlukan saat Anda melanjutkan ke pembayaran.",
  },
  {
    q: "Bagaimana cara membayar?",
    a: "Setelah memilih jadwal, Anda diarahkan ke halaman pembayaran online. Booking yang tidak dibayar sampai batas waktunya akan kedaluwarsa dan slotnya dilepas.",
  },
  {
    q: "Kapan status booking berubah menjadi Dibayar?",
    a: "Setelah pembayaran terkonfirmasi oleh gateway. Jika Anda baru kembali dari halaman bayar, Anda akan melihat \"Menunggu konfirmasi pembayaran\" sampai konfirmasi itu masuk.",
  },
  {
    q: "Bisakah saya membatalkan booking?",
    a: "Bisa, dari halaman Booking Saya saat status Dibayar atau Ditugaskan. Refund penuh berlaku bila diajukan minimal 24 jam sebelum jadwal. Keputusan akhir ada pada admin.",
  },
  {
    q: "Paket mana yang cocok untuk kos-kosan?",
    a: "Gunakan filter Kos-kosan di bagian paket. Pilih jumlah kamar yang sesuai dengan kos Anda, lalu tingkat kebersihan Reguler, Detail, atau Deep cleaning.",
  },
];

export function Faq() {
  return (
    <section aria-labelledby="faq-judul" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <SectionHeading id="faq-judul" title="Pertanyaan yang" highlight="sering muncul" />
          <div className="card flex w-full flex-col items-start gap-4 bg-primary-soft/40">
            <p className="font-semibold">Sudah punya pesanan?</p>
            <p className="text-sm text-muted">Pantau status dan ajukan pembatalan dari halaman Booking Saya.</p>
            <Link href="/akun" className={buttonClass("outline")}>
              <Icon name="user" size={18} />
              Booking Saya
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group card p-0 open:border-primary md:p-0">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-5 py-3 font-semibold marker:content-none md:px-6 [&::-webkit-details-marker]:hidden">
                {f.q}
                <Icon
                  name="chevron"
                  size={20}
                  className="shrink-0 text-primary transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="px-5 pb-5 text-sm text-muted md:px-6">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
