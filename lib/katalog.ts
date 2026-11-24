import { cache } from "react";
import type { Service } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export { PROPERTY_TYPES, DETAIL_LEVELS } from "./paket-dto";

export { durationLabel } from "./harga";

/** Active packages (one per property_type + detail_level). Deduped per request. Callers must `await connection()` first so it is never prerendered. */
export const getActivePackages = cache(async (): Promise<Service[]> => {
  return prisma.service.findMany({
    where: { is_active: true },
    orderBy: [{ property_type: "asc" }, { detail_level: "asc" }],
  });
});
