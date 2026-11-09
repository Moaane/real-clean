import { Suspense } from "react";
import { jamFields } from "@/components/admin/jam-fields";
import { MasterForm } from "@/components/admin/master-form";
import { createJam } from "@/lib/actions/master";
import { requireRole } from "@/lib/auth";

async function Content() {
  await requireRole("admin");
  return (
    <MasterForm
      action={createJam}
      fields={jamFields}
      initial={{ kuota: "1", aktif: "on" }}
      submitLabel="Simpan"
      cancelHref="/admin/jam"
    />
  );
}

export default function Page() {
  return (
    <main className="page">
      <h1 className="text-2xl font-semibold">Tambah Jam Operasional</h1>
      <Suspense fallback={<p>Memuat…</p>}>
        <Content />
      </Suspense>
    </main>
  );
}
