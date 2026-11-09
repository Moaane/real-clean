import { notFound } from "next/navigation";
import { Suspense } from "react";
import { layananFields } from "@/components/admin/layanan-fields";
import { MasterForm } from "@/components/admin/master-form";
import { updateLayanan } from "@/lib/actions/master";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function Content({ params }: { params: PageProps<"/admin/layanan/[id]">["params"] }) {
  await requireRole("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const l = await prisma.layanan.findUnique({ where: { id_layanan: id } });
  if (!l) notFound();
  return (
    <MasterForm
      action={updateLayanan.bind(null, id)}
      fields={layananFields}
      initial={{
        nama_layanan: l.nama_layanan,
        deskripsi: l.deskripsi ?? "",
        jenis_properti: l.jenis_properti,
        jumlah_kamar: String(l.jumlah_kamar),
        tingkat_detail: l.tingkat_detail,
        harga: String(l.harga),
        durasi_menit: String(l.durasi_menit),
        ...(l.status_aktif ? { status_aktif: "on" } : {}),
      }}
      submitLabel="Simpan perubahan"
      cancelHref="/admin/layanan"
    />
  );
}

export default function Page(props: PageProps<"/admin/layanan/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold">Ubah Layanan</h1>
      <Suspense fallback={<p>Memuat…</p>}>
        <Content params={props.params} />
      </Suspense>
    </main>
  );
}
