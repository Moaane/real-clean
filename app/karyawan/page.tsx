import { Suspense } from "react";
import { RoleHome } from "@/components/role-home";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6">Memuat…</p>}>
      <RoleHome role="karyawan" title="Dashboard Karyawan" />
    </Suspense>
  );
}
