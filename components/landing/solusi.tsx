import { Icon, type IconName } from "@/components/icons";
import { SectionHeading } from "@/components/ui";
import { Photo } from "@/components/ui/photo";

const POIN: { icon: IconName; title: string; text: string }[] = [
  { icon: "clock", title: "Jadwal yang jelas", text: "Slot yang penuh ditandai, tanpa menebak jam yang tersedia." },
  {
    icon: "droplet",
    title: "Pembayaran tercatat otomatis",
    text: "Status menjadi Dibayar setelah pembayaran terkonfirmasi, bukan sekadar setelah kembali dari halaman bayar.",
  },
  {
    icon: "leaf",
    title: "Refund bila batal lebih awal",
    text: "Ajukan pembatalan minimal 24 jam sebelum jadwal. Admin memprosesnya dari Booking Saya.",
  },
];

export function Solusi() {
  return (
    <section aria-labelledby="solusi-judul" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <div className="card-section grid gap-8 bg-primary-soft/40 md:grid-cols-2 md:items-center md:gap-12">
        <div className="flex flex-col gap-6">
          <SectionHeading id="solusi-judul" upper title="Standar" highlight="kebersihan" after="kami" />
          <ul className="flex flex-col gap-4">
            {POIN.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-pill bg-primary-soft text-on-primary-soft">
                  <Icon name={p.icon} size={22} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <Photo
          src="/images/landing/solusi.webp"
          alt="Petugas GoClean membawa perlengkapan kebersihan"
          ratio="4 / 5"
          sizes="(min-width: 1024px) 480px, 100vw"
          icon="sparkle"
          className="order-first md:order-last"
        />
      </div>
    </section>
  );
}
