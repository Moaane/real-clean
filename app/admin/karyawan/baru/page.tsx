import { Suspense } from "react";
import { karyawanFields } from "@/components/admin/karyawan-fields";
import { MasterForm } from "@/components/admin/master-form";
import { createKaryawan } from "@/lib/actions/master";
import { requireRole } from "@/lib/auth";

async function Content() {
  await requireRole("admin");
  return (
    <MasterForm
      action={createKaryawan}
      fields={karyawanFields("baru")}
      initial={{ status_aktif: "on" }}
      submitLabel="Simpan"
      cancelHref="/admin/karyawan"
    />
  );
}

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold">Tambah Karyawan</h1>
      <Suspense fallback={<p>Memuat…</p>}>
        <Content />
      </Suspense>
    </main>
  );
}
