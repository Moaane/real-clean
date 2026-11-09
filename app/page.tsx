import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PaketList } from "@/components/paket-list";
import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/prisma";

async function Katalog() {
  await connection(); // always read fresh data, never bake it in at build time
  const items = await prisma.layanan.findMany({
    where: { status_aktif: true },
    orderBy: [{ jumlah_kamar: "asc" }, { harga: "asc" }],
  });
  return <PaketList items={items} />;
}

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="page gap-10">
        <section className="rounded-2xl bg-primary-soft px-6 py-12 sm:px-10">
          <h1 className="max-w-xl text-3xl font-bold leading-tight sm:text-4xl">
            Rumah dan kos bersih, tanpa repot.
          </h1>
          <p className="mt-3 max-w-lg text-muted">
            Pilih paket sesuai jumlah kamar dan tingkat kebersihan, tentukan tanggal dan jam, tim kami datang ke lokasi.
          </p>
          <Link href="/layanan" className="btn btn-primary mt-6">
            Cek slot tersedia
          </Link>
        </section>
        <Suspense fallback={<p className="text-muted">Memuat…</p>}>
          <Katalog />
        </Suspense>
      </main>
    </>
  );
}
