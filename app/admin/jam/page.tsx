import Link from "next/link";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { deleteJam } from "@/lib/actions/master";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function List() {
  await requireRole("admin");
  const items = await prisma.jamOperasional.findMany({ orderBy: { jam_mulai: "asc" } });

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-zinc-300">
          <th className="py-2">Jam</th>
          <th>Kuota</th>
          <th>Status</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {items.map((j) => (
          <tr key={j.id} className="border-b border-zinc-200">
            <td className="py-2">
              {j.jam_mulai} – {j.jam_selesai}
            </td>
            <td>{j.kuota}</td>
            <td>{j.aktif ? "Aktif" : "Nonaktif"}</td>
            <td className="flex gap-3 py-2">
              <Link href={`/admin/jam/${j.id}`} className="underline">
                Ubah
              </Link>
              <form action={deleteJam}>
                <input type="hidden" name="id" value={j.id} />
                <ConfirmButton message={`Hapus jam ${j.jam_mulai}–${j.jam_selesai}?`}>Hapus</ConfirmButton>
              </form>
            </td>
          </tr>
        ))}
        {items.length === 0 && (
          <tr>
            <td colSpan={4} className="py-4 text-zinc-500">
              Belum ada jam operasional.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Jam Operasional</h1>
        <Link href="/admin/jam/baru" className="rounded bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black">
          Tambah
        </Link>
      </div>
      <Suspense fallback={<p>Memuat…</p>}>
        <List />
      </Suspense>
    </main>
  );
}
