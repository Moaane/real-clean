import { ButtonLink } from "@/components/ui";
import { Navbar } from "@/components/navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main id="konten" className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-24 text-center">
        <p className="text-6xl font-medium text-primary">404</p>
        <h1 className="text-[28px] font-bold leading-tight">Halaman tidak ditemukan</h1>
        <p className="text-muted">Alamat yang Anda buka tidak ada atau sudah dipindahkan.</p>
        <ButtonLink href="/" arrow>
          Kembali ke beranda
        </ButtonLink>
      </main>
    </>
  );
}
