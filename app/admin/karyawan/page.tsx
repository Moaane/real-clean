import type { Metadata } from "next";
import Link from "next/link";
import { dynamic, ActiveDot, AddLink, Dyn, th } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { toggleKaryawan } from "@/lib/actions/master";
import { EmptyState } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/dash/page-header";
import { IconUsers } from "@/components/icons";

export const metadata: Metadata = { title: "Karyawan" };

async function Daftar() {
  await dynamic();
  const rows = await prisma.user.findMany({
    where: { role: "karyawan" },
    orderBy: { nama: "asc" },
    select: { id_user: true, nama: true, email: true, no_hp: true, status_aktif: true },
  });
  if (rows.length === 0)
    return <EmptyState icon={IconUsers} title="Belum ada akun karyawan." action={<AddLink href="/admin/karyawan/baru">Tambah karyawan</AddLink>} />;
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface p-5">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr>
            <th className={th}>Nama</th>
            <th className={th}>Kontak</th>
            <th className={th}>Status</th>
            <th className={th + " text-right"}>Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((k) => (
            <tr key={k.id_user} className="transition duration-150 hover:bg-surface-2/60">
              <td className="py-3 pr-4 font-semibold">{k.nama}</td>
              <td className="py-3 pr-4">
                <span className="block">{k.email}</span>
                <span className="text-muted">{k.no_hp}</span>
              </td>
              <td className="py-3 pr-4">
                <ActiveDot aktif={k.status_aktif} />
              </td>
              <td className="py-3">
                <div className="flex justify-end gap-2">
                  <Link href={`/admin/karyawan/${k.id_user}`} className={buttonClass("outline", "sm")}>
                    Ubah
                  </Link>
                  <ConfirmDialog
                    trigger={k.status_aktif ? "Nonaktifkan" : "Aktifkan"}
                    variant={k.status_aktif ? "danger" : "soft"}
                    title={k.status_aktif ? "Nonaktifkan karyawan?" : "Aktifkan karyawan?"}
                    description={
                      k.status_aktif
                        ? `${k.nama} tidak akan bisa masuk dan tidak bisa ditugaskan.`
                        : `${k.nama} bisa masuk dan ditugaskan kembali.`
                    }
                    confirmLabel={k.status_aktif ? "Nonaktifkan" : "Aktifkan"}
                    action={toggleKaryawan}
                    fields={{ id: String(k.id_user), aktif: String(!k.status_aktif) }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <PageHeader title="Akun" accent="karyawan" description="Buat dan kelola akun petugas lapangan.">
        <AddLink href="/admin/karyawan/baru">Tambah karyawan</AddLink>
      </PageHeader>
      <Dyn>
        <Daftar />
      </Dyn>
    </>
  );
}
