import { cache } from "react";
import type { Layanan } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const JENIS_PROPERTI = {
  rumah: { label: "Rumah", icon: "home", hint: "Rumah tinggal dan apartemen" },
  kos: { label: "Kos-kosan", icon: "building", hint: "Kamar, lorong, dan area bersama" },
} as const;

export const TINGKAT_DETAIL = { reguler: "Reguler", detail: "Detail", deep: "Deep cleaning" } as const;

export { durasiLabel } from "./harga";

/** Active packages (one per jenis_properti + tingkat_detail). Deduped per request. Callers must `await connection()` first so it is never prerendered. */
export const getPaketAktif = cache(async (): Promise<Layanan[]> => {
  return prisma.layanan.findMany({
    where: { status_aktif: true },
    orderBy: [{ jenis_properti: "asc" }, { tingkat_detail: "asc" }],
  });
});
