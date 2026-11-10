import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dynamic, Dyn } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { updateService } from "@/lib/actions/master";
import { ServiceForm } from "@/components/admin/forms";
import { PageHeader } from "@/components/dash/page-header";

export const metadata: Metadata = { title: "Ubah paket" };

async function Content({ params }: { params: Promise<{ id: string }> }) {
  await dynamic();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const l = await prisma.service.findUnique({ where: { id_service: id } });
  if (!l) notFound();
  return <ServiceForm action={updateService.bind(null, id)} initial={l} submitLabel="Simpan perubahan" />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <PageHeader title="Ubah" accent="paket" />
      <Dyn>
        <Content params={params} />
      </Dyn>
    </>
  );
}
