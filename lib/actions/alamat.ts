"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Deletes one of the signed-in customer's own saved addresses. */
export async function deleteSavedAddress(id: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer" || !Number.isInteger(id)) return;
  await prisma.savedAddress.deleteMany({ where: { id_address: id, id_user: user.id_user } });
}
