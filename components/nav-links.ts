import type { Role } from "@/generated/prisma/enums";

export type NavItem = { href: string; label: string };

/** Main menu links by role. Guests do not see My Bookings; admins do not see My Bookings. */
export function navLinks(role?: Role | null): NavItem[] {
  const base: NavItem[] = [
    { href: "/layanan", label: "Layanan" },
    { href: "/#cara-kerja", label: "Cara Kerja" },
  ];
  if (role === "customer") return [...base, { href: "/akun", label: "Booking Saya" }];
  if (role === "admin") return [...base, { href: "/admin", label: "Dashboard" }];
  if (role === "staff") return [...base, { href: "/karyawan", label: "Tugas Saya" }];
  return base;
}

/** Profile dropdown contents by role (without the Logout button, which is added separately). */
export function profileItems(role: Role): NavItem[] {
  if (role === "customer") return [{ href: "/akun", label: "Booking Saya" }];
  if (role === "admin") return [{ href: "/admin", label: "Dashboard" }];
  return [{ href: "/karyawan", label: "Tugas Saya" }];
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  staff: "Karyawan",
  customer: "Pelanggan",
};
