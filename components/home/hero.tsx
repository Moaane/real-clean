import { Photo } from "@/components/ui/photo"
import { ButtonLink } from "@/components/ui"
import {
  IconArrowRight,
  IconCalendar,
  IconShield,
  IconTag,
  IconSparkle,
} from "@/components/icons"

const TRUST = [
  {
    icon: IconShield,
    label: "Petugas terverifikasi",
    pos: "md:right-0 md:top-16",
  },
  { icon: IconTag, label: "Harga transparan", pos: "md:right-10 md:top-36" },
  {
    icon: IconCalendar,
    label: "Jadwal fleksibel",
    pos: "md:right-2 md:top-56",
  },
]

/** Mockup 6: judul di tengah, foto berbingkai lengkung di atas lingkaran, chip melayang, tombol di bawah foto. */
export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-6 md:px-6 md:pt-8">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-primary-soft via-primary-soft/50 to-surface px-4 pt-12 md:px-10 md:pt-16">
        <div className="anim-rise mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          <h1 className="title-display text-[38px] md:text-[60px]">
            Ciptakan kenyamanan lewat{" "}
            <span className="text-primary">kebersihan</span>
          </h1>
          <p className="max-w-xl text-[15px] text-muted md:text-base">
            Dari rumah hingga kos, kami hadirkan hunian yang bersih dan nyaman
            dengan petugas terverifikasi, peralatan lengkap, dan harga yang
            jelas sejak awal.
          </p>
        </div>

        <div className="relative mx-auto mt-10 max-w-3xl md:mt-14">
          {/* Panggung: setengah lingkaran hanya latar, foto setengah badan di atasnya, rata dasar */}
          <div className="anim-fade relative mx-auto flex justify-center overflow-hidden">
            <span
              aria-hidden="true"
              className="absolute bottom-0 left-1/2 aspect-square w-[min(96%,680px)] -translate-x-1/2 translate-y-1/2 rounded-pill bg-primary"
            />
            <span
              aria-hidden="true"
              className="absolute bottom-0 left-1/2 aspect-square w-[min(112%,780px)] -translate-x-1/2 translate-y-1/2 rounded-pill border border-primary/30"
            />

            <Photo
              name="hero"
              alt="Petugas Real Clean membawa peralatan pembersih"
              priority
              sizes="400px"
              className="relative aspect-[2/3] w-[min(80%,400px)] bg-transparent!"
              imageClassName="object-bottom"
            />
          </div>

          {/* Chip: baris biasa di mobile, melayang di desktop */}
          <ul className="mt-6 flex flex-wrap justify-center gap-2 pb-8 md:mt-0 md:pb-0">
            {TRUST.map(({ icon: Icon, label, pos }) => (
              <li
                key={label}
                className={
                  "anim-rise inline-flex h-10 cursor-default items-center gap-2 rounded-pill border border-border bg-surface px-4 text-[13px] font-semibold shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary md:absolute " +
                  pos
                }
              >
                <Icon size={16} className="text-primary" />
                {label}
              </li>
            ))}
          </ul>

          {/* Kartu kiri (desktop) */}
          <div className="anim-rise absolute left-0 top-32 hidden items-center gap-3 rounded-lg border border-border bg-surface p-3 pr-5 shadow-sm md:flex">
            <span className="flex size-10 items-center justify-center rounded-pill bg-primary-soft text-primary-ink">
              <IconSparkle size={20} />
            </span>
            <div className="text-sm">
              <p className="font-bold">Alat &amp; cairan lengkap</p>
              <p className="text-muted">Dibawa petugas sendiri</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
