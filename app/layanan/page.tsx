import { connection } from "next/server";
import { Suspense } from "react";
import { PaketList } from "@/components/paket-list";
import { SiteHeader } from "@/components/site-header";
import { getSlotTersedia, nowWib } from "@/lib/availability";
import { prisma } from "@/lib/prisma";

async function Content({ searchParams }: { searchParams: PageProps<"/layanan">["searchParams"] }) {
  await connection();
  const sp = await searchParams;
  const tanggal = typeof sp.tanggal === "string" ? sp.tanggal : undefined;
  const today = nowWib().date;

  const layanan = await prisma.layanan.findMany({
    where: { status_aktif: true },
    orderBy: [{ jumlah_kamar: "asc" }, { harga: "asc" }],
  });
  const result = tanggal ? await getSlotTersedia(tanggal) : null;

  return (
    <>
      <PaketList items={layanan} />

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Cek slot tersedia</h2>
        <form className="flex items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Tanggal
            <input
              type="date"
              name="tanggal"
              min={today}
              defaultValue={tanggal ?? today}
              required
              className="rounded border border-zinc-300 bg-transparent px-3 py-2"
            />
          </label>
          <button type="submit" className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black">
            Cek
          </button>
        </form>
        {result && !result.ok && (
          <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {result.error}
          </p>
        )}
        {result?.ok && (
          <ul className="flex flex-wrap gap-2">
            {result.slots.map((s) => (
              <li key={s.jam_mulai} className="rounded border border-zinc-300 px-3 py-2 text-sm">
                {s.jam_mulai} – {s.jam_selesai}
                <span className="ml-2 text-zinc-500">sisa {s.sisa}</span>
              </li>
            ))}
            {result.slots.length === 0 && (
              <li className="text-zinc-500">Tidak ada slot tersedia pada tanggal ini.</li>
            )}
          </ul>
        )}
      </section>
    </>
  );
}

export default function Page(props: PageProps<"/layanan">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8">
        <h1 className="text-2xl font-semibold">Paket & Slot Kebersihan</h1>
        <Suspense fallback={<p>Memuat…</p>}>
          <Content searchParams={props.searchParams} />
        </Suspense>
      </main>
    </>
  );
}
