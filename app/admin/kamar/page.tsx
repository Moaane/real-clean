import Link from "next/link";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { deleteKamar } from "@/lib/actions/master";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const rp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

async function List({ searchParams }: { searchParams: PageProps<"/admin/kamar">["searchParams"] }) {
  await requireRole("admin");
  const { error } = await searchParams;
  const items = await prisma.kamar.findMany({ orderBy: { nomor_kamar: "asc" } });

  return (
    <>
      {error === "dipakai" && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          Kamar sudah dipakai booking dan tidak bisa dihapus. Ubah statusnya menjadi perawatan.
        </p>
      )}
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-300">
            <th className="py-2">No.</th>
            <th>Tipe</th>
            <th>Harga/bulan</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((k) => (
            <tr key={k.id_kamar} className="border-b border-zinc-200">
              <td className="py-2">{k.nomor_kamar}</td>
              <td>{k.tipe_kamar}</td>
              <td>{rp(k.harga_per_bulan)}</td>
              <td>{k.status_kamar}</td>
              <td className="flex gap-3 py-2">
                <Link href={`/admin/kamar/${k.id_kamar}`} className="underline">
                  Ubah
                </Link>
                <form action={deleteKamar}>
                  <input type="hidden" name="id" value={k.id_kamar} />
                  <ConfirmButton message={`Hapus kamar ${k.nomor_kamar}?`}>Hapus</ConfirmButton>
                </form>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-zinc-500">
                Belum ada kamar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}

export default function Page(props: PageProps<"/admin/kamar">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kamar Kos</h1>
        <Link href="/admin/kamar/baru" className="rounded bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black">
          Tambah
        </Link>
      </div>
      <Suspense fallback={<p>Memuat…</p>}>
        <List searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
