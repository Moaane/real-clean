import { IconArrowRight, IconCalendar, IconCheck, IconSparkle } from "@/components/icons";
import { SectionHeading } from "@/components/ui";

const STEPS = [
  { icon: IconSparkle, title: "Pilih paket", text: "Pilih paket rumah atau kos sesuai kebutuhan dan jumlah kamar." },
  { icon: IconCalendar, title: "Pilih jadwal", text: "Tentukan tanggal dan jam kedatangan dari slot yang masih tersedia." },
  { icon: IconCheck, title: "Bayar dan santai", text: "Bayar online, lalu petugas kami datang tepat waktu." },
];

/** Mockup 5 "Quick and Easy": tiga lingkaran ikon dihubungkan panah. */
export function CaraKerja() {
  return (
    <section id="cara-kerja" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-16 md:px-6 md:pt-24">
      <SectionHeading title="Cara kerja" accent="mudah" after="dan cepat" />
      <ol className="mt-10 grid gap-10 md:mt-14 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-start md:gap-6">
        {STEPS.flatMap((s, i) => {
          const Icon = s.icon;
          const item = (
            <li key={s.title} className="group flex flex-col items-center gap-4 text-center">
              <span className="flex size-28 items-center justify-center rounded-pill border border-border bg-surface text-primary transition duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary md:size-32">
                <Icon size={40} strokeWidth={1.5} />
              </span>
              <h3 className="text-lg font-semibold md:text-xl">
                {i + 1}. {s.title}
              </h3>
              <p className="max-w-[16rem] text-sm text-muted">{s.text}</p>
            </li>
          );
          return i < STEPS.length - 1
            ? [
                item,
                <li
                  key={`a${i}`}
                  aria-hidden="true"
                  className="hidden animate-pulse items-center self-start pt-14 text-border-strong motion-reduce:animate-none md:flex"
                >
                  <IconArrowRight size={32} strokeWidth={1.25} />
                </li>,
              ]
            : [item];
        })}
      </ol>
    </section>
  );
}
