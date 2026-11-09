import Link from "next/link";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { deleteLayanan } from "@/lib/actions/master";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const rp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

async function List({ searchParams }: { searchParams: PageProps<"/admin/layanan">["searchParams"] }) {
  await requireRole("admin");
  const { error } = await searchParams;
  const items = await prisma.layanan.findMany({ orderBy: { id_layanan: "asc" } });

  return (
    <>
      {error === "dipakai" && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          Layanan sudah dipakai booking dan tidak bisa dihapus. Nonaktifkan saja.
        </p>
      )}
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-300">
            <th className="py-2">Nama</th>
            <th>Properti</th>
            <th>Kamar</th>
            <th>Detail</th>
            <th>Harga</th>
            <th>Durasi</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((l) => (
            <tr key={l.id_layanan} className="border-b border-zinc-200">
              <td className="py-2">{l.nama_layanan}</td>
              <td>{l.jenis_properti}</td>
              <td>{l.jumlah_kamar}</td>
              <td>{l.tingkat_detail}</td>
              <td>{rp(l.harga)}</td>
              <td>{l.durasi_menit} menit</td>
              <td>{l.status_aktif ? "Aktif" : "Nonaktif"}</td>
              <td className="flex gap-3 py-2">
                <Link href={`/admin/layanan/${l.id_layanan}`} className="underline">
                  Ubah
                </Link>
                <form action={deleteLayanan}>
                  <input type="hidden" name="id" value={l.id_layanan} />
                  <ConfirmButton message={`Hapus layanan "${l.nama_layanan}"?`}>Hapus</ConfirmButton>
                </form>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={8} className="py-4 text-zinc-500">
                Belum ada layanan.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}

export default function Page(props: PageProps<"/admin/layanan">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Paket Kebersihan</h1>
        <Link href="/admin/layanan/baru" className="rounded bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black">
          Tambah
        </Link>
      </div>
      <Suspense fallback={<p>Memuat…</p>}>
        <List searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
