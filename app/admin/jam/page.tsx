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
    <div className="card overflow-x-auto p-0">
      <table className="data-table">
      <thead>
        <tr>
          <th>Jam</th>
          <th>Kuota</th>
          <th>Status</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {items.map((j) => (
          <tr key={j.id}>
            <td>
              {j.jam_mulai} – {j.jam_selesai}
            </td>
            <td>{j.kuota}</td>
            <td><span className={`badge ${j.aktif ? "badge-on" : "badge-off"}`}>{j.aktif ? "Aktif" : "Nonaktif"}</span></td>
            <td><div className="flex items-center gap-3">
              <Link href={`/admin/jam/${j.id}`} className="link">
                Ubah
              </Link>
              <form action={deleteJam}>
                <input type="hidden" name="id" value={j.id} />
                <ConfirmButton message={`Hapus jam ${j.jam_mulai}–${j.jam_selesai}?`}>Hapus</ConfirmButton>
              </form>
            </div></td>
          </tr>
        ))}
        {items.length === 0 && (
          <tr>
            <td colSpan={4} className="text-muted">
              Belum ada jam operasional.
            </td>
          </tr>
        )}
      </tbody>
    </table>
      </div>
  );
}

export default function Page() {
  return (
    <main className="page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Jam Operasional</h1>
        <Link href="/admin/jam/baru" className="btn btn-primary">
          Tambah
        </Link>
      </div>
      <Suspense fallback={<p>Memuat…</p>}>
        <List />
      </Suspense>
    </main>
  );
}
