import type { Service } from "@/generated/prisma/client";

// Client-safe (no prisma import at runtime): shared by server routes and client components.
export const PROPERTY_TYPES = {
  house: { label: "Rumah", icon: "home", hint: "Rumah tinggal dan apartemen" },
  boarding_house: { label: "Kos-kosan", icon: "building", hint: "Kamar, lorong, dan area bersama" },
} as const;

export const DETAIL_LEVELS = { regular: "Reguler", detailed: "Detail", deep: "Deep cleaning" } as const;

/** Package shape sent by /api/paket. Plain JSON, safe for the client. Prices/durations are for DISPLAY: the server recomputes on booking. */
export type PackageDTO = {
  id: number;
  name: string;
  type: "house" | "boarding_house";
  levelKey: keyof typeof DETAIL_LEVELS;
  level: string;
  basePrice: number;
  pricePerRoom: number;
  baseDuration: number;
  durationPerRoom: number;
  minRooms: number;
  maxRooms: number;
};

export function toPackageDTO(p: Service): PackageDTO {
  return {
    id: p.id_service,
    name: p.service_name,
    type: p.property_type,
    levelKey: p.detail_level,
    level: DETAIL_LEVELS[p.detail_level],
    basePrice: p.base_price,
    pricePerRoom: p.price_per_room,
    baseDuration: p.base_duration_minutes,
    durationPerRoom: p.duration_per_room_minutes,
    minRooms: p.min_rooms,
    maxRooms: p.max_rooms,
  };
}

/** Adapter to the pricing helpers in lib/harga.ts. */
export const pricingOf = (p: PackageDTO) => ({
  base_price: p.basePrice,
  price_per_room: p.pricePerRoom,
  base_duration_minutes: p.baseDuration,
  duration_per_room_minutes: p.durationPerRoom,
  min_rooms: p.minRooms,
  max_rooms: p.maxRooms,
});
