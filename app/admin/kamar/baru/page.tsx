import { Suspense } from "react";
import { kamarFields } from "@/components/admin/kamar-fields";
import { MasterForm } from "@/components/admin/master-form";
import { createKamar } from "@/lib/actions/master";
import { requireRole } from "@/lib/auth";

async function Content() {
  await requireRole("admin");
  return (
    <MasterForm
      action={createKamar}
      fields={kamarFields}
      initial={{ status_kamar: "tersedia" }}
      submitLabel="Simpan"
      cancelHref="/admin/kamar"
    />
  );
}

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold">Tambah Kamar</h1>
      <Suspense fallback={<p>Memuat…</p>}>
        <Content />
      </Suspense>
    </main>
  );
}
