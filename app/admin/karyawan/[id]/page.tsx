import { notFound } from "next/navigation";
import { Suspense } from "react";
import { karyawanFields } from "@/components/admin/karyawan-fields";
import { MasterForm } from "@/components/admin/master-form";
import { updateKaryawan } from "@/lib/actions/master";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function Content({ params }: { params: PageProps<"/admin/karyawan/[id]">["params"] }) {
  await requireRole("admin");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const u = await prisma.user.findFirst({ where: { id_user: id, role: "karyawan" } });
  if (!u) notFound();
  return (
    <MasterForm
      action={updateKaryawan.bind(null, id)}
      fields={karyawanFields("ubah")}
      initial={{
        nama: u.nama,
        email: u.email,
        no_hp: u.no_hp ?? "",
        ...(u.status_aktif ? { status_aktif: "on" } : {}),
      }}
      submitLabel="Simpan perubahan"
      cancelHref="/admin/karyawan"
    />
  );
}

export default function Page(props: PageProps<"/admin/karyawan/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold">Ubah Karyawan</h1>
      <Suspense fallback={<p>Memuat…</p>}>
        <Content params={props.params} />
      </Suspense>
    </main>
  );
}
