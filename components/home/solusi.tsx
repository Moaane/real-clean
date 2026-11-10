import { Photo } from "@/components/ui/photo";
import { IconDroplet, IconLeaf, IconBroom } from "@/components/icons";

const BUBBLES = [
  { icon: IconDroplet, label: "Cairan pembersih aman" },
  { icon: IconLeaf, label: "Ramah lingkungan" },
  { icon: IconBroom, label: "Peralatan lengkap" },
];

/** Mockup 4 (top): soft panel, title top left, paragraph bottom left, photo on the right, three icon bubbles. */
export function Solutions() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 md:px-6 md:pt-24">
      <div className="relative grid overflow-hidden rounded-xl bg-primary-soft md:min-h-[480px] md:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col justify-between gap-10 p-6 md:p-10">
          <h2 className="max-w-md text-[32px] title-display text-on-primary-soft md:text-5xl">
            Solusi kebersihan <span className="text-primary">kami</span>
          </h2>
          <p className="max-w-md text-[15px] text-foreground">
            Di Real Clean kami memakai peralatan dan cairan pembersih yang efektif sekaligus aman bagi keluarga dan
            lingkungan. Setiap pekerjaan diperiksa sebelum dinyatakan selesai.
          </p>
        </div>
        <div className="relative min-h-[320px] md:min-h-0">
          <div className="absolute inset-0">
            <Photo
              name="solusi"
              alt="Petugas Real Clean membawa peralatan pembersih"
              sizes="(min-width: 768px) 40vw, 100vw"
              className="h-full w-full bg-transparent"
            />
          </div>
          <ul className="absolute bottom-4 right-4 flex gap-3 md:bottom-6 md:right-6">
            {BUBBLES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                title={label}
                className="flex size-16 cursor-default items-center justify-center rounded-pill bg-surface/80 text-primary-ink backdrop-blur transition duration-300 hover:-translate-y-1 hover:scale-110 hover:bg-surface md:size-20"
              >
                <Icon size={28} strokeWidth={1.5} />
                <span className="sr-only">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
