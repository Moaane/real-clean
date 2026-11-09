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
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8">
        <h1 className="text-3xl font-semibold">Jasa Kebersihan Rumah &amp; Kos</h1>
        <Link href="/layanan" className="text-sm underline">
          Cek slot tersedia
        </Link>
        <Suspense fallback={<p>Memuat…</p>}>
          <Katalog />
        </Suspense>
      </main>
    </>
  );
}
