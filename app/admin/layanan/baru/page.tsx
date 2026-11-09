import { Suspense } from "react";
import { layananFields } from "@/components/admin/layanan-fields";
import { MasterForm } from "@/components/admin/master-form";
import { createLayanan } from "@/lib/actions/master";
import { requireRole } from "@/lib/auth";

async function Content() {
  await requireRole("admin");
  return (
    <MasterForm
      action={createLayanan}
      fields={layananFields}
      initial={{ jenis_properti: "rumah", tingkat_detail: "reguler", jumlah_kamar: "1", status_aktif: "on" }}
      submitLabel="Simpan"
      cancelHref="/admin/layanan"
    />
  );
}

export default function Page() {
  return (
    <main className="page">
      <h1 className="text-2xl font-semibold">Tambah Layanan</h1>
      <Suspense fallback={<p>Memuat…</p>}>
        <Content />
      </Suspense>
    </main>
  );
}
