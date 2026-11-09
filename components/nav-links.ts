import type { Role } from "@/generated/prisma/enums";

export type NavItem = { href: string; label: string };

/** Tautan menu utama menurut peran. Tamu tidak melihat Booking Saya; admin tidak melihat Booking Saya. */
export function navLinks(role?: Role | null): NavItem[] {
  const base: NavItem[] = [
    { href: "/layanan", label: "Layanan" },
    { href: "/#cara-kerja", label: "Cara Kerja" },
  ];
  if (role === "pelanggan") return [...base, { href: "/akun", label: "Booking Saya" }];
  if (role === "admin") return [...base, { href: "/admin", label: "Dashboard" }];
  if (role === "karyawan") return [...base, { href: "/karyawan", label: "Tugas Saya" }];
  return base;
}

/** Isi dropdown profil menurut peran (tanpa tombol Keluar, itu ditambahkan terpisah). */
export function profileItems(role: Role): NavItem[] {
  if (role === "pelanggan") return [{ href: "/akun", label: "Booking Saya" }];
  if (role === "admin") return [{ href: "/admin", label: "Dashboard" }];
  return [{ href: "/karyawan", label: "Tugas Saya" }];
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  karyawan: "Karyawan",
  pelanggan: "Pelanggan",
};
