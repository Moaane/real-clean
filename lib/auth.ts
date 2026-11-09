import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";
import { prisma } from "./prisma";
import { ROLE_HOME } from "./roles";
import { readSession } from "./session";

// The cookie only proves who the user was at login time. Always re-check the
// database so deactivated accounts and role changes take effect immediately.
export const getCurrentUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id_user: session.userId },
    select: { id_user: true, nama: true, email: true, role: true, status_aktif: true },
  });
  if (!user || !user.status_aktif) return null;
  return user;
});

export async function requireRole(role: Role) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect(ROLE_HOME[user.role]);
  return user;
}
