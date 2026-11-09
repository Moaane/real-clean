import { Icon, type IconName } from "@/components/icons";

const TRUST: { icon: IconName; title: string; text: string }[] = [
  { icon: "shield", title: "Petugas terverifikasi", text: "Akun petugas dibuat dan dikelola admin." },
  { icon: "receipt", title: "Harga transparan", text: "Harga dan durasi terlihat sebelum login." },
  { icon: "check", title: "Hasil dicek admin", text: "Selesai setelah bukti kerja diverifikasi." },
  { icon: "layers", title: "Bayar aman", text: "Lewat gateway pembayaran, status otomatis." },
];

export function TrustBar() {
  return (
    <section aria-labelledby="trust-judul" className="border-y border-border bg-surface">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <h2 id="trust-judul" className="mb-8 text-center text-base font-semibold text-muted">
          Kenapa pelanggan memilih GoClean
        </h2>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {TRUST.map((t) => (
            <li key={t.title} className="flex flex-col items-center gap-3 text-center">
              <span className="grid size-12 place-items-center rounded-pill bg-primary-soft text-on-primary-soft">
                <Icon name={t.icon} size={24} />
              </span>
              <div>
                <p className="font-semibold">{t.title}</p>
                <p className="mt-1 text-sm text-muted">{t.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
