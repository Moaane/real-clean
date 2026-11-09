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

      <section className="card flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Cek slot tersedia</h2>
        <form className="flex flex-wrap items-end gap-3">
          <label className="flex w-56 flex-col gap-1.5 text-sm font-medium">
            Tanggal
            <input
              type="date"
              name="tanggal"
              min={today}
              defaultValue={tanggal ?? today}
              required
              className="input"
            />
          </label>
          <button type="submit" className="btn btn-primary">
            Cek
          </button>
        </form>
        {result && !result.ok && (
          <p role="alert" className="alert-error">
            {result.error}
          </p>
        )}
        {result?.ok && (
          <ul className="flex flex-wrap gap-2">
            {result.slots.map((s, index) => (
              <li key={index} className="badge badge-soft !px-3 !py-1.5 !text-sm">
                {s.jam_mulai} – {s.jam_selesai}
                <span className="ml-2 text-muted font-normal">sisa {s.sisa}</span>
              </li>
            ))}
            {result.slots.length === 0 && (
              <li className="text-muted">Tidak ada slot tersedia pada tanggal ini.</li>
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
      <main className="page">
        <h1 className="text-2xl font-semibold">Paket &amp; Slot Kebersihan</h1>
        <Suspense fallback={<p>Memuat…</p>}>
          <Content searchParams={props.searchParams} />
        </Suspense>
      </main>
    </>
  );
}
