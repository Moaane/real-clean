import type { Role } from "@/generated/prisma/enums";

export const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  karyawan: "/karyawan",
  pelanggan: "/akun",
};

// Which role may open which area.
export const AREA_ROLE: Record<string, Role> = {
  "/admin": "admin",
  "/karyawan": "karyawan",
  "/akun": "pelanggan",
};
