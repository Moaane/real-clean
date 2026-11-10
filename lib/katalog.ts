import { cache } from "react";
import type { Service } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const PROPERTY_TYPES = {
  house: { label: "Rumah", icon: "home", hint: "Rumah tinggal dan apartemen" },
  boarding_house: { label: "Kos-kosan", icon: "building", hint: "Kamar, lorong, dan area bersama" },
} as const;

export const DETAIL_LEVELS = { regular: "Reguler", detailed: "Detail", deep: "Deep cleaning" } as const;

export { durationLabel } from "./harga";

/** Active packages (one per property_type + detail_level). Deduped per request. Callers must `await connection()` first so it is never prerendered. */
export const getActivePackages = cache(async (): Promise<Service[]> => {
  return prisma.service.findMany({
    where: { is_active: true },
    orderBy: [{ property_type: "asc" }, { detail_level: "asc" }],
  });
});
