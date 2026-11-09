import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dynamic, Dyn } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { updateLayanan } from "@/lib/actions/master";
import { LayananForm } from "@/components/admin/forms";
import { PageHeader } from "@/components/dash/page-header";

export const metadata: Metadata = { title: "Ubah paket" };

async function Isi({ params }: { params: Promise<{ id: string }> }) {
  await dynamic();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const l = await prisma.layanan.findUnique({ where: { id_layanan: id } });
  if (!l) notFound();
  return <LayananForm action={updateLayanan.bind(null, id)} initial={l} submitLabel="Simpan perubahan" />;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <PageHeader title="Ubah" accent="paket" />
      <Dyn>
        <Isi params={params} />
      </Dyn>
    </>
  );
}
