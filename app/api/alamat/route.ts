import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SavedAddressesResponse = { addresses: { id: number; address: string }[] };

// Per-user data: never cached. Guests and non-customers simply get an empty list.
export async function GET() {
  const user = await getCurrentUser();
  const addresses =
    user?.role === "customer"
      ? await prisma.savedAddress.findMany({
          where: { id_user: user.id_user },
          orderBy: { created_at: "desc" },
          select: { id_address: true, address: true },
        })
      : [];
  return Response.json(
    { addresses: addresses.map((a) => ({ id: a.id_address, address: a.address })) } satisfies SavedAddressesResponse,
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
