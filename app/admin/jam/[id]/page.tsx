import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dynamic, Dyn } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { updateOperatingHour } from "@/lib/actions/master";
import { OperatingHourForm } from "@/components/admin/forms";
import { PageHeader } from "@/components/dash/page-header";

export const metadata: Metadata = { title: "Ubah jam" };

async function Content({ params }: { params: Promise<{ id: string }> }) {
  await dynamic();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const j = await prisma.operatingHour.findUnique({ where: { id } });
  if (!j) notFound();
  return <OperatingHourForm action={updateOperatingHour.bind(null, id)} initial={j} submitLabel="Simpan perubahan" />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <PageHeader title="Ubah" accent="jam" />
      <Dyn>
        <Content params={params} />
      </Dyn>
    </>
  );
}
