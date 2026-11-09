import { notFound } from "next/navigation";
import { Suspense } from "react";
import { kamarFields } from "@/components/admin/kamar-fields";
import { MasterForm } from "@/components/admin/master-form";
import { updateKamar } from "@/lib/actions/master";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function Content({ params }: { params: PageProps<"/admin/kamar/[id]">["params"] }) {
  await requireRole("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const k = await prisma.kamar.findUnique({ where: { id_kamar: id } });
  if (!k) notFound();
  return (
    <MasterForm
      action={updateKamar.bind(null, id)}
      fields={kamarFields}
      initial={{
        nomor_kamar: k.nomor_kamar,
        tipe_kamar: k.tipe_kamar,
        fasilitas: k.fasilitas ?? "",
        harga_per_bulan: String(k.harga_per_bulan),
        status_kamar: k.status_kamar,
      }}
      submitLabel="Simpan perubahan"
      cancelHref="/admin/kamar"
    />
  );
}

export default function Page(props: PageProps<"/admin/kamar/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold">Ubah Kamar</h1>
      <Suspense fallback={<p>Memuat…</p>}>
        <Content params={props.params} />
      </Suspense>
    </main>
  );
}
