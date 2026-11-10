import type { Metadata } from "next";
import Link from "next/link";
import { dynamic, ActiveDot, AddLink, Dyn, th } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { toggleStaff } from "@/lib/actions/master";
import { EmptyState } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/dash/page-header";
import { IconUsers } from "@/components/icons";

export const metadata: Metadata = { title: "Karyawan" };

async function List() {
  await dynamic();
  const rows = await prisma.user.findMany({
    where: { role: "staff" },
    orderBy: { name: "asc" },
    select: { id_user: true, name: true, email: true, phone: true, is_active: true },
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
              <td className="py-3 pr-4 font-semibold">{k.name}</td>
              <td className="py-3 pr-4">
                <span className="block">{k.email}</span>
                <span className="text-muted">{k.phone}</span>
              </td>
              <td className="py-3 pr-4">
                <ActiveDot active={k.is_active} />
              </td>
              <td className="py-3">
                <div className="flex justify-end gap-2">
                  <Link href={`/admin/karyawan/${k.id_user}`} className={buttonClass("outline", "sm")}>
                    Ubah
                  </Link>
                  <ConfirmDialog
                    trigger={k.is_active ? "Nonaktifkan" : "Aktifkan"}
                    variant={k.is_active ? "danger" : "soft"}
                    title={k.is_active ? "Nonaktifkan karyawan?" : "Aktifkan karyawan?"}
                    description={
                      k.is_active
                        ? `${k.name} tidak akan bisa masuk dan tidak bisa ditugaskan.`
                        : `${k.name} bisa masuk dan ditugaskan kembali.`
                    }
                    confirmLabel={k.is_active ? "Nonaktifkan" : "Aktifkan"}
                    action={toggleStaff}
                    fields={{ id: String(k.id_user), active: String(!k.is_active) }}
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
        <List />
      </Dyn>
    </>
  );
}
