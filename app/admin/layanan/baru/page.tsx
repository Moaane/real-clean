import type { Metadata } from "next";
import { createLayanan } from "@/lib/actions/master";
import { LayananForm } from "@/components/admin/forms";
import { PageHeader } from "@/components/dash/page-header";

export const metadata: Metadata = { title: "Tambah paket" };

export default function Page() {
  return (
    <>
      <PageHeader title="Tambah" accent="paket" />
      <LayananForm action={createLayanan} submitLabel="Simpan paket" />
    </>
  );
}
