import Link from "next/link";
import { KONTAK } from "@/lib/kontak";
import { IconMail, IconPhone, LogoMark } from "@/components/icons";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface-2 md:mt-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3 md:px-6">
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <LogoMark size={32} />
            GoClean
          </Link>
          <p className="max-w-xs text-sm text-muted">
            Jasa kebersihan rumah dan kos dengan jadwal yang bisa Anda pilih sendiri.
          </p>
        </div>

        <nav aria-label="Tautan footer" className="flex flex-col gap-1 text-[15px]">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">Jelajah</h2>
          <Link href="/layanan" className="flex h-11 items-center hover:text-primary-ink">
            Layanan
          </Link>
          <Link href="/#cara-kerja" className="flex h-11 items-center hover:text-primary-ink">
            Cara Kerja
          </Link>
        </nav>

        <div className="flex flex-col gap-1 text-[15px]">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">Kontak</h2>
          <a href={KONTAK.waHref} target="_blank" rel="noreferrer" className="flex h-11 items-center gap-2 hover:text-primary-ink">
            <IconPhone size={18} />
            Hubungi kami
          </a>
          <a href={`mailto:${KONTAK.email}`} className="flex h-11 items-center gap-2 hover:text-primary-ink">
            <IconMail size={18} />
            {KONTAK.email}
          </a>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs font-medium text-muted">
        © 2026 GoClean. Seluruh hak cipta dilindungi.
      </div>
    </footer>
  );
}
