import type { Metadata } from "next";
import { createStaff } from "@/lib/actions/master";
import { StaffForm } from "@/components/admin/forms";
import { PageHeader } from "@/components/dash/page-header";

export const metadata: Metadata = { title: "Tambah karyawan" };

export default function Page() {
  return (
    <>
      <PageHeader title="Tambah" accent="karyawan" />
      <StaffForm action={createStaff} submitLabel="Simpan karyawan" />
    </>
  );
}
