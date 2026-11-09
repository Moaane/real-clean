import Link from "next/link";
import { Icon } from "@/components/icons";
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
        <p role="alert" className="alert-error">
          Paket sudah dipakai booking dan tidak bisa dihapus. Nonaktifkan saja.
        </p>
      )}
      <div className="card overflow-x-auto p-0">
      <table className="data-table">
        <thead>
          <tr>
            <th>Nama</th>
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
            <tr key={l.id_layanan}>
              <td>{l.nama_layanan}</td>
              <td>{l.jenis_properti}</td>
              <td>{l.jumlah_kamar}</td>
              <td>{l.tingkat_detail}</td>
              <td>{rp(l.harga)}</td>
              <td>{l.durasi_menit} menit</td>
              <td><span className={`badge ${l.status_aktif ? "badge-on" : "badge-off"}`}>{l.status_aktif ? "Aktif" : "Nonaktif"}</span></td>
              <td><div className="flex items-center gap-3">
                <Link href={`/admin/layanan/${l.id_layanan}`} className="link">
                  Ubah
                </Link>
                <form action={deleteLayanan}>
                  <input type="hidden" name="id" value={l.id_layanan} />
                  <ConfirmButton message={`Hapus paket "${l.nama_layanan}"?`}>Hapus</ConfirmButton>
                </form>
              </div></td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={8} className="text-muted">
                Belum ada paket.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </>
  );
}

export default function Page(props: PageProps<"/admin/layanan">) {
  return (
    <main className="page">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">Paket Kebersihan</h1>
        <Link href="/admin/layanan/baru" className="btn btn-primary">
          <Icon name="plus" size={18} />
          Tambah
        </Link>
      </div>
      <Suspense fallback={<p>Memuat…</p>}>
        <List searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
