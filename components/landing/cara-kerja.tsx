import { Icon, type IconName } from "@/components/icons";
import { SectionHeading } from "@/components/ui";

const LANGKAH: { icon: IconName; title: string; text: string }[] = [
  { icon: "layers", title: "Pilih paket", text: "Sesuaikan jumlah kamar dan tingkat kebersihan. Harga langsung terlihat." },
  { icon: "calendar", title: "Pilih jadwal dan bayar", text: "Ambil tanggal dan jam yang masih kosong, isi alamat, lalu bayar online." },
  { icon: "sparkle", title: "Petugas datang", text: "Tim membersihkan lokasi Anda. Booking selesai setelah hasil kerja diverifikasi." },
];

export function CaraKerja() {
  return (
    <section id="cara" aria-labelledby="cara-judul" className="scroll-mt-20 bg-surface-2 py-16 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <SectionHeading
          id="cara-judul"
          align="center"
          title="Pesan dalam"
          highlight="tiga langkah"
          lead="Dari memilih paket sampai ruangan bersih, tanpa telepon bolak-balik."
        />
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
          {LANGKAH.map((s, i) => (
            <li key={s.title} className="relative flex gap-5 md:flex-col md:items-center md:text-center">
              {i < LANGKAH.length - 1 && (
                <>
                  <span aria-hidden="true" className="absolute left-8 top-16 -bottom-10 w-0.5 bg-border-strong md:hidden" />
                  <span
                    aria-hidden="true"
                    className="absolute left-[calc(50%+3.5rem)] top-10 hidden h-0.5 w-[calc(100%-7rem+1.5rem)] bg-border-strong md:block"
                  />
                </>
              )}
              <span className="relative grid size-16 shrink-0 place-items-center rounded-pill border-2 border-primary bg-surface text-primary md:size-20">
                <Icon name={s.icon} size={28} />
              </span>
              <div>
                <p className="text-sm font-semibold text-primary">Langkah {i + 1}</p>
                <h3 className="mt-0.5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
