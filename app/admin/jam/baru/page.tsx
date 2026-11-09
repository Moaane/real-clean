import type { Metadata } from "next";
import { createJam } from "@/lib/actions/master";
import { JamForm } from "@/components/admin/forms";
import { PageHeader } from "@/components/dash/page-header";

export const metadata: Metadata = { title: "Tambah jam" };

export default function Page() {
  return (
    <>
      <PageHeader title="Tambah" accent="jam" />
      <JamForm action={createJam} submitLabel="Simpan jam" />
    </>
  );
}
