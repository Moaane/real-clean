import type { Metadata } from "next";
import { createService } from "@/lib/actions/master";
import { ServiceForm } from "@/components/admin/forms";
import { PageHeader } from "@/components/dash/page-header";

export const metadata: Metadata = { title: "Tambah paket" };

export default function Page() {
  return (
    <>
      <PageHeader title="Tambah" accent="paket" />
      <ServiceForm action={createService} submitLabel="Simpan paket" />
    </>
  );
}
