import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dynamic, Dyn } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { updateKaryawan } from "@/lib/actions/master";
import { KaryawanForm } from "@/components/admin/forms";
import { PageHeader } from "@/components/dash/page-header";

export const metadata: Metadata = { title: "Ubah karyawan" };

async function Isi({ params }: { params: Promise<{ id: string }> }) {
  await dynamic();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const k = await prisma.user.findFirst({
    where: { id_user: id, role: "karyawan" },
    select: { nama: true, email: true, no_hp: true, status_aktif: true },
  });
  if (!k) notFound();
  return <KaryawanForm edit action={updateKaryawan.bind(null, id)} initial={k} submitLabel="Simpan perubahan" />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <PageHeader title="Ubah" accent="karyawan" />
      <Dyn>
        <Isi params={params} />
      </Dyn>
    </>
  );
}
