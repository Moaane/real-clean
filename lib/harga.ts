// Per-room pricing model (SPEC 1, 6). Pure (no DB) so it is safe to use on both server and client.
// On the client the result is for DISPLAY ONLY: the server always recomputes from the package data.

export type PackagePricing = {
  base_price: number;
  price_per_room: number;
  base_duration_minutes: number;
  duration_per_room_minutes: number;
  min_rooms: number;
  max_rooms: number;
};

/** total = base_price + price_per_room × rooms; duration = base duration + duration per room × rooms. */
export function computePackagePrice(p: PackagePricing, room: number) {
  return {
    total: p.base_price + p.price_per_room * room,
    duration: p.base_duration_minutes + p.duration_per_room_minutes * room,
  };
}

/** Error message when the room count is invalid for the package, or null when it is allowed. */
export function checkRoomCount(p: Pick<PackagePricing, "min_rooms" | "max_rooms">, room: number): string | null {
  if (!Number.isInteger(room)) return "Jumlah kamar harus bilangan bulat";
  if (room < p.min_rooms || room > p.max_rooms) {
    return p.min_rooms === p.max_rooms
      ? `Jumlah kamar untuk paket ini harus ${p.min_rooms}`
      : `Jumlah kamar harus antara ${p.min_rooms} dan ${p.max_rooms}`;
  }
  return null;
}

/** Jumlah kamar dari input mentah (URL), dijepit ke min..max; kosong/tidak valid jadi min_kamar. */
export function initialRooms(p: Pick<PackagePricing, "min_rooms" | "max_rooms">, raw: string | undefined): number {
  const n = Number(raw);
  if (!raw || !Number.isInteger(n)) return p.min_rooms;
  return Math.min(p.max_rooms, Math.max(p.min_rooms, n));
}

/** "HH:mm" → menit sejak 00:00. */
export function minutesFrom(timeSlot: string): number {
  const [h, m] = timeSlot.split(":").map(Number);
  return h * 60 + m;
}

/** Panjang slot dalam menit. */
export const slotLengthMinutes = (start: string, completed: string) => minutesFrom(completed) - minutesFrom(start);

/** Harga "mulai dari" katalog: total untuk min_kamar. */
export const startingPrice = (p: PackagePricing) => computePackagePrice(p, p.min_rooms).total;
export const startDuration = (p: PackagePricing) => computePackagePrice(p, p.min_rooms).duration;

/** Teks rentang kamar, mis. "1–6 kamar". */
export const roomRange = (p: Pick<PackagePricing, "min_rooms" | "max_rooms">) =>
  p.min_rooms === p.max_rooms ? `${p.min_rooms} kamar` : `${p.min_rooms}–${p.max_rooms} kamar`;

/** 150 -> "2 jam 30 menit". */
export function durationLabel(minutes: number) {
  const j = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [j ? `${j} jam` : "", m ? `${m} menit` : ""].filter(Boolean).join(" ");
}
