import { DashShell } from "@/components/dash/shell";
import type { RailItem } from "@/components/dash/rail-link";

const ITEMS: RailItem[] = [
  { href: "/admin", label: "Ringkasan", icon: "grid", exact: true },
  { href: "/admin/booking", label: "Booking", icon: "receipt" },
  { href: "/admin/layanan", label: "Layanan", icon: "tag" },
  { href: "/admin/jam", label: "Jam", icon: "calendar" },
  { href: "/admin/karyawan", label: "Karyawan", icon: "users" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashShell role="admin" items={ITEMS}>
      {children}
    </DashShell>
  );
}
