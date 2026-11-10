import type { Metadata } from "next";
import { createOperatingHour } from "@/lib/actions/master";
import { OperatingHourForm } from "@/components/admin/forms";
import { PageHeader } from "@/components/dash/page-header";

export const metadata: Metadata = { title: "Tambah jam" };

export default function Page() {
  return (
    <>
      <PageHeader title="Tambah" accent="jam" />
      <OperatingHourForm action={createOperatingHour} submitLabel="Simpan jam" />
    </>
  );
}
