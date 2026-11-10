import type { Role } from "@/generated/prisma/enums";

export const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  staff: "/karyawan",
  customer: "/akun",
};

// Which role may open which area.
export const AREA_ROLE: Record<string, Role> = {
  "/admin": "admin",
  "/karyawan": "staff",
  "/akun": "customer",
};
