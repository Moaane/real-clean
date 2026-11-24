import { prisma } from "@/lib/prisma";

export const MAX_SAVED_ADDRESSES = 10;

/** Called after a booking is created. Keeps the newest MAX_SAVED_ADDRESSES; an address already saved is not duplicated. */
export async function rememberAddress(userId: number, address: string) {
  const text = address.trim();
  try {
    await prisma.savedAddress.upsert({
      where: { id_user_address: { id_user: userId, address: text } },
      create: { id_user: userId, address: text },
      update: {},
    });
    const stale = await prisma.savedAddress.findMany({
      where: { id_user: userId },
      orderBy: { created_at: "desc" },
      skip: MAX_SAVED_ADDRESSES,
      select: { id_address: true },
    });
    if (stale.length > 0) {
      await prisma.savedAddress.deleteMany({ where: { id_address: { in: stale.map((s) => s.id_address) } } });
    }
  } catch (e) {
    // The booking already exists; failing to remember the address must not break it.
    console.error("rememberAddress failed", e);
  }
}
