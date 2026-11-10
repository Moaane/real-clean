import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dynamic, Dyn } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { updateStaff } from "@/lib/actions/master";
import { StaffForm } from "@/components/admin/forms";
import { PageHeader } from "@/components/dash/page-header";

export const metadata: Metadata = { title: "Ubah karyawan" };

async function Content({ params }: { params: Promise<{ id: string }> }) {
  await dynamic();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const k = await prisma.user.findFirst({
    where: { id_user: id, role: "staff" },
    select: { name: true, email: true, phone: true, is_active: true },
  });
  if (!k) notFound();
  return <StaffForm edit action={updateStaff.bind(null, id)} initial={k} submitLabel="Simpan perubahan" />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <PageHeader title="Ubah" accent="karyawan" />
      <Dyn>
        <Content params={params} />
      </Dyn>
    </>
  );
}
