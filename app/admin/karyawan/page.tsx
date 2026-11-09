import Link from "next/link";
import { Suspense } from "react";
import { toggleKaryawan } from "@/lib/actions/master";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function List() {
  await requireRole("admin");
  const items = await prisma.user.findMany({
    where: { role: "karyawan" },
    orderBy: { id_user: "asc" },
    select: { id_user: true, nama: true, email: true, no_hp: true, status_aktif: true },
  });

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-zinc-300">
          <th className="py-2">Nama</th>
          <th>Email</th>
          <th>No. HP</th>
          <th>Status</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {items.map((u) => (
          <tr key={u.id_user} className="border-b border-zinc-200">
            <td className="py-2">{u.nama}</td>
            <td>{u.email}</td>
            <td>{u.no_hp}</td>
            <td>{u.status_aktif ? "Aktif" : "Nonaktif"}</td>
            <td className="flex gap-3 py-2">
              <Link href={`/admin/karyawan/${u.id_user}`} className="underline">
                Ubah
              </Link>
              <form action={toggleKaryawan}>
                <input type="hidden" name="id" value={u.id_user} />
                <input type="hidden" name="aktif" value={String(!u.status_aktif)} />
                <button type="submit" className="underline">
                  {u.status_aktif ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </form>
            </td>
          </tr>
        ))}
        {items.length === 0 && (
          <tr>
            <td colSpan={5} className="py-4 text-zinc-500">
              Belum ada karyawan.
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
        <h1 className="text-2xl font-semibold">Akun Karyawan</h1>
        <Link href="/admin/karyawan/baru" className="rounded bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black">
          Tambah
        </Link>
      </div>
      <Suspense fallback={<p>Memuat…</p>}>
        <List />
      </Suspense>
    </main>
  );
}
