// Run with: pnpm db:seed  (Node strips types natively, so keep this file
// free of enums/namespaces and use explicit .ts import extensions.)
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client.ts";

try {
  process.loadEnvFile();
} catch {
  // variables may already be set in the environment
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const hash = await bcrypt.hash(process.env.SEED_PASSWORD ?? "password123", 10);

  const users = [
    { name: "Admin Real Clean", email: "admin@realclean.test", phone: "081200000001", role: "admin" },
    { name: "Budi Karyawan", email: "budi@realclean.test", phone: "081200000002", role: "staff" },
    { name: "Sari Karyawan", email: "sari@realclean.test", phone: "081200000003", role: "staff" },
    { name: "Pelanggan Demo", email: "pelanggan@realclean.test", phone: "081200000004", role: "customer" },
  ] as const;

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: hash },
    });
  }

  // One package per (property_type, detail_level). Price/duration: base + per room × room count.
  // Same values as migration 20261110090000_harga_per_kamar. The maximum duration (max_rooms) fits in a 2-hour slot.
  const service = [
    { service_name: "Rumah - Reguler", description: "Sapu, pel, kamar mandi, dapur.", property_type: "house", detail_level: "regular", base_price: 50000, price_per_room: 40000, base_duration_minutes: 30, duration_per_room_minutes: 15, min_rooms: 1, max_rooms: 6 },
    { service_name: "Rumah - Detail", description: "Termasuk kaca, sudut, dan perabot.", property_type: "house", detail_level: "detailed", base_price: 75000, price_per_room: 60000, base_duration_minutes: 30, duration_per_room_minutes: 20, min_rooms: 1, max_rooms: 4 },
    { service_name: "Rumah - Deep Cleaning", description: "Pembersihan menyeluruh, noda membandel, dan kerak.", property_type: "house", detail_level: "deep", base_price: 100000, price_per_room: 90000, base_duration_minutes: 40, duration_per_room_minutes: 20, min_rooms: 1, max_rooms: 4 },
    { service_name: "Kos - Reguler", description: "Kamar, lorong, dan kamar mandi bersama.", property_type: "boarding_house", detail_level: "regular", base_price: 50000, price_per_room: 25000, base_duration_minutes: 20, duration_per_room_minutes: 8, min_rooms: 1, max_rooms: 12 },
    { service_name: "Kos - Detail", description: "Semua kamar, lorong, dapur, dan area umum secara detail.", property_type: "boarding_house", detail_level: "detailed", base_price: 75000, price_per_room: 40000, base_duration_minutes: 20, duration_per_room_minutes: 12, min_rooms: 1, max_rooms: 8 },
    { service_name: "Kos - Deep Cleaning", description: "Pembersihan menyeluruh semua kamar dan area bersama, termasuk noda membandel.", property_type: "boarding_house", detail_level: "deep", base_price: 100000, price_per_room: 60000, base_duration_minutes: 24, duration_per_room_minutes: 16, min_rooms: 1, max_rooms: 6 },
  ] as const;

  // empty update: re-running the seed does not overwrite price changes made by the admin.
  for (const l of service) {
    await prisma.service.upsert({
      where: { property_type_detail_level: { property_type: l.property_type, detail_level: l.detail_level } },
      update: {},
      create: l,
    });
  }

  const timeSlot = [
    { start_time: "08:00", end_time: "10:00", quota: 2 },
    { start_time: "10:00", end_time: "12:00", quota: 2 },
    { start_time: "13:00", end_time: "15:00", quota: 2 },
  ];

  for (const j of timeSlot) {
    await prisma.operatingHour.upsert({
      where: { start_time_end_time: { start_time: j.start_time, end_time: j.end_time } },
      update: {},
      create: j,
    });
  }

  console.log("Seed selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
