import Link from "next/link";
import { Brand } from "@/components/site-header";

const KOLOM: { judul: string; links: [string, string][] }[] = [
  {
    judul: "Layanan",
    links: [
      ["/#paket", "Paket rumah"],
      ["/#paket", "Paket kos-kosan"],
      ["/#cara", "Cara kerja"],
    ],
  },
  {
    judul: "Akun",
    links: [
      ["/login", "Masuk"],
      ["/daftar", "Daftar"],
      ["/akun", "Booking Saya"],
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Brand />
          <p className="max-w-xs text-sm text-muted">Jasa kebersihan panggilan untuk rumah dan kos-kosan.</p>
        </div>
        {KOLOM.map((k) => (
          <nav key={k.judul} aria-label={k.judul}>
            <p className="font-semibold">{k.judul}</p>
            <ul className="mt-3 flex flex-col">
              {k.links.map(([href, label]) => (
                <li key={label}>
                  <Link href={href} className="link min-h-11 font-medium text-muted hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <p className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-muted sm:px-6">
          © GoClean. Mode pembayaran sandbox.
        </p>
      </div>
    </footer>
  );
}
