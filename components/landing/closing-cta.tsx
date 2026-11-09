import Link from "next/link";
import { Icon } from "@/components/icons";
import { buttonClass, SectionHeading } from "@/components/ui";

export function ClosingCta() {
  return (
    <section aria-labelledby="penutup-judul" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
      <div className="card-section flex flex-col items-start gap-6 bg-surface-2 md:flex-row md:items-center md:justify-between">
        <SectionHeading
          id="penutup-judul"
          title="Ruangan bersih,"
          highlight="hati tenang"
          lead="Pilih paket, ambil jam yang kosong, dan selesaikan pembayaran dalam beberapa menit."
        />
        <Link href="#paket" className={buttonClass("primary", "lg")}>
          Pilih paket
          <Icon name="arrow" size={20} />
        </Link>
      </div>
    </section>
  );
}
