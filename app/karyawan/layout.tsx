import { DashShell } from "@/components/dash/shell";
import type { RailItem } from "@/components/dash/rail-link";

const ITEMS: RailItem[] = [{ href: "/karyawan", label: "Tugas", icon: "calendar", exact: true }];

export default function KaryawanLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashShell role="karyawan" items={ITEMS}>
      {children}
    </DashShell>
  );
}
