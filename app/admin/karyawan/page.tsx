import Link from "next/link";
import { Icon } from "@/components/icons";
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
    <div className="card overflow-x-auto p-0">
      <table className="data-table">
      <thead>
        <tr>
          <th>Nama</th>
          <th>Email</th>
          <th>No. HP</th>
          <th>Status</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {items.map((u) => (
          <tr key={u.id_user}>
            <td>{u.nama}</td>
            <td>{u.email}</td>
            <td>{u.no_hp}</td>
            <td><span className={`badge ${u.status_aktif ? "badge-on" : "badge-off"}`}>{u.status_aktif ? "Aktif" : "Nonaktif"}</span></td>
            <td><div className="flex items-center gap-3">
              <Link href={`/admin/karyawan/${u.id_user}`} className="link">
                Ubah
              </Link>
              <form action={toggleKaryawan}>
                <input type="hidden" name="id" value={u.id_user} />
                <input type="hidden" name="aktif" value={String(!u.status_aktif)} />
                <button type="submit" className="link">
                  {u.status_aktif ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </form>
            </div></td>
          </tr>
        ))}
        {items.length === 0 && (
          <tr>
            <td colSpan={5} className="text-muted">
              Belum ada karyawan.
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
        <h1 className="text-3xl font-extrabold tracking-tight">Akun Karyawan</h1>
        <Link href="/admin/karyawan/baru" className="btn btn-primary">
          <Icon name="plus" size={18} />
          Tambah
        </Link>
      </div>
      <Suspense fallback={<p>Memuat…</p>}>
        <List />
      </Suspense>
    </main>
  );
}
