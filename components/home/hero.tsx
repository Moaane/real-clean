import { Photo } from "@/components/ui/photo";
import { ButtonLink } from "@/components/ui";
import { IconCalendar, IconShield, IconTag } from "@/components/icons";

const TRUST = [
  { icon: IconShield, label: "Petugas terverifikasi" },
  { icon: IconTag, label: "Harga transparan" },
  { icon: IconCalendar, label: "Jadwal fleksibel" },
];

/** Mockup 1: judul besar kiri, paragraf + CTA kanan, foto lebar di bawah. */
export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 md:px-6 md:pt-20">
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-end lg:gap-16">
        <h1 className="anim-rise text-4xl title-display md:text-[56px]">
          Selamat datang di tempat <span className="text-primary">kebersihan bertemu harga terjangkau</span>
        </h1>
        <div className="anim-rise flex flex-col gap-6" style={{ animationDelay: "120ms" }}>
          <p className="max-w-md text-[15px] text-muted">
            Kami menyediakan jasa kebersihan rumah dan kos berkualitas. Tujuan kami membuat hunian Anda bersih dan
            nyaman, dengan peralatan lengkap dan petugas yang sudah terverifikasi.
          </p>
          <ul className="flex flex-wrap gap-2">
            {TRUST.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex h-9 cursor-default items-center gap-1.5 rounded-pill border border-border bg-surface px-3 text-[13px] font-semibold transition duration-200 hover:-translate-y-0.5 hover:border-primary"
              >
                <Icon size={16} className="text-primary" />
                {label}
              </li>
            ))}
          </ul>
          <div>
            <ButtonLink href="/pesan" size="lg" arrow>
              Pesan sekarang
            </ButtonLink>
          </div>
        </div>
      </div>

      <Photo
        name="hero"
        alt="Petugas GoClean membersihkan lampu dengan alat pembersih"
        priority
        sizes="(min-width: 1152px) 1152px, 100vw"
        className="anim-fade mt-10 aspect-[4/3] rounded-xl md:mt-14 md:aspect-[21/9]"
      />
    </section>
  );
}
