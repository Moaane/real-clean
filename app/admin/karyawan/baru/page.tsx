import type { Metadata } from "next";
import { createKaryawan } from "@/lib/actions/master";
import { KaryawanForm } from "@/components/admin/forms";
import { PageHeader } from "@/components/dash/page-header";

export const metadata: Metadata = { title: "Tambah karyawan" };

export default function Page() {
  return (
    <>
      <PageHeader title="Tambah" accent="karyawan" />
      <KaryawanForm action={createKaryawan} submitLabel="Simpan karyawan" />
    </>
  );
}
