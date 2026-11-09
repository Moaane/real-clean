import type { Metadata } from "next";
import { dynamic, ActiveDot, AddLink, Dyn, th } from "@/components/admin/ui";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteLayanan } from "@/lib/actions/master";
import { durasiLabel, JENIS_PROPERTI, TINGKAT_DETAIL } from "@/lib/katalog";
import { rp } from "@/lib/booking-status";
import { Alert, EmptyState } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/dash/page-header";
import { IconTag } from "@/components/icons";

export const metadata: Metadata = { title: "Layanan" };

async function Daftar({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await dynamic();
  const { error } = await searchParams;
  const rows = await prisma.layanan.findMany({ orderBy: [{ jenis_properti: "asc" }, { jumlah_kamar: "asc" }, { harga: "asc" }] });
  return (
    <>
      {error === "dipakai" && (
        <Alert tone="warn" className="mb-4">
          Paket sudah dipakai booking sehingga tidak bisa dihapus. Nonaktifkan saja lewat tombol Ubah.
        </Alert>
      )}
      {rows.length === 0 ? (
        <EmptyState icon={IconTag} title="Belum ada paket layanan." action={<AddLink href="/admin/layanan/baru">Tambah paket</AddLink>} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface p-5">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr>
                <th className={th}>Paket</th>
                <th className={th}>Jenis</th>
                <th className={th}>Tingkat</th>
                <th className={th}>Durasi</th>
                <th className={th}>Harga</th>
                <th className={th}>Status</th>
                <th className={th + " text-right"}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((l) => (
                <tr key={l.id_layanan} className="transition duration-150 hover:bg-surface-2/60">
                  <td className="py-3 pr-4 font-semibold">{l.nama_layanan}</td>
                  <td className="py-3 pr-4">{JENIS_PROPERTI[l.jenis_properti].label} · {l.jumlah_kamar} kamar</td>
                  <td className="py-3 pr-4">{TINGKAT_DETAIL[l.tingkat_detail]}</td>
                  <td className="py-3 pr-4">{durasiLabel(l.durasi_menit)}</td>
                  <td className="py-3 pr-4 font-semibold tabular-nums">{rp(l.harga)}</td>
                  <td className="py-3 pr-4"><ActiveDot aktif={l.status_aktif} /></td>
                  <td className="py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/layanan/${l.id_layanan}`} className={buttonClass("outline", "sm")}>Ubah</Link>
                      <ConfirmDialog trigger="Hapus" title="Hapus paket?" description={`“${l.nama_layanan}” akan dihapus permanen. Paket yang sudah dipakai booking tidak bisa dihapus.`} confirmLabel="Hapus" action={deleteLayanan} fields={{ id: String(l.id_layanan) }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <>
      <PageHeader title="Paket" accent="layanan" description="Kelola paket yang tampil di katalog dan halaman pemesanan.">
        <AddLink href="/admin/layanan/baru">Tambah paket</AddLink>
      </PageHeader>
      <Dyn>
        <Daftar searchParams={searchParams} />
      </Dyn>
    </>
  );
}
