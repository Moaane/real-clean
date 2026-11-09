import { notFound } from "next/navigation";
import { Suspense } from "react";
import { jamFields } from "@/components/admin/jam-fields";
import { MasterForm } from "@/components/admin/master-form";
import { updateJam } from "@/lib/actions/master";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function Content({ params }: { params: PageProps<"/admin/jam/[id]">["params"] }) {
  await requireRole("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const j = await prisma.jamOperasional.findUnique({ where: { id } });
  if (!j) notFound();
  return (
    <MasterForm
      action={updateJam.bind(null, id)}
      fields={jamFields}
      initial={{
        jam_mulai: j.jam_mulai,
        jam_selesai: j.jam_selesai,
        kuota: String(j.kuota),
        ...(j.aktif ? { aktif: "on" } : {}),
      }}
      submitLabel="Simpan perubahan"
      cancelHref="/admin/jam"
    />
  );
}

export default function Page(props: PageProps<"/admin/jam/[id]">) {
  return (
    <main className="page">
      <h1 className="text-2xl font-semibold">Ubah Jam Operasional</h1>
      <Suspense fallback={<p>Memuat…</p>}>
        <Content params={props.params} />
      </Suspense>
    </main>
  );
}
