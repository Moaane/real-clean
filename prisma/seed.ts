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
    { nama: "Admin Real Clean", email: "admin@realclean.test", no_hp: "081200000001", role: "admin" },
    { nama: "Budi Karyawan", email: "budi@realclean.test", no_hp: "081200000002", role: "karyawan" },
    { nama: "Sari Karyawan", email: "sari@realclean.test", no_hp: "081200000003", role: "karyawan" },
    { nama: "Pelanggan Demo", email: "pelanggan@realclean.test", no_hp: "081200000004", role: "pelanggan" },
  ] as const;

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: hash },
    });
  }

  // Satu paket per (jenis_properti, tingkat_detail). Harga/durasi: dasar + per kamar × jumlah kamar.
  // Nilai sama dengan migrasi 20261110090000_harga_per_kamar. Durasi maksimum (max_kamar) muat di slot 2 jam.
  const layanan = [
    { nama_layanan: "Rumah - Reguler", deskripsi: "Sapu, pel, kamar mandi, dapur.", jenis_properti: "rumah", tingkat_detail: "reguler", harga_dasar: 50000, harga_per_kamar: 40000, durasi_dasar_menit: 30, durasi_per_kamar_menit: 15, min_kamar: 1, max_kamar: 6 },
    { nama_layanan: "Rumah - Detail", deskripsi: "Termasuk kaca, sudut, dan perabot.", jenis_properti: "rumah", tingkat_detail: "detail", harga_dasar: 75000, harga_per_kamar: 60000, durasi_dasar_menit: 30, durasi_per_kamar_menit: 20, min_kamar: 1, max_kamar: 4 },
    { nama_layanan: "Rumah - Deep Cleaning", deskripsi: "Pembersihan menyeluruh, noda membandel, dan kerak.", jenis_properti: "rumah", tingkat_detail: "deep", harga_dasar: 100000, harga_per_kamar: 90000, durasi_dasar_menit: 40, durasi_per_kamar_menit: 20, min_kamar: 1, max_kamar: 4 },
    { nama_layanan: "Kos - Reguler", deskripsi: "Kamar, lorong, dan kamar mandi bersama.", jenis_properti: "kos", tingkat_detail: "reguler", harga_dasar: 50000, harga_per_kamar: 25000, durasi_dasar_menit: 20, durasi_per_kamar_menit: 8, min_kamar: 1, max_kamar: 12 },
    { nama_layanan: "Kos - Detail", deskripsi: "Semua kamar, lorong, dapur, dan area umum secara detail.", jenis_properti: "kos", tingkat_detail: "detail", harga_dasar: 75000, harga_per_kamar: 40000, durasi_dasar_menit: 20, durasi_per_kamar_menit: 12, min_kamar: 1, max_kamar: 8 },
    { nama_layanan: "Kos - Deep Cleaning", deskripsi: "Pembersihan menyeluruh semua kamar dan area bersama, termasuk noda membandel.", jenis_properti: "kos", tingkat_detail: "deep", harga_dasar: 100000, harga_per_kamar: 60000, durasi_dasar_menit: 24, durasi_per_kamar_menit: 16, min_kamar: 1, max_kamar: 6 },
  ] as const;

  // update kosong: menjalankan seed ulang tidak menimpa perubahan harga dari admin.
  for (const l of layanan) {
    await prisma.layanan.upsert({
      where: { jenis_properti_tingkat_detail: { jenis_properti: l.jenis_properti, tingkat_detail: l.tingkat_detail } },
      update: {},
      create: l,
    });
  }

  const jam = [
    { jam_mulai: "08:00", jam_selesai: "10:00", kuota: 2 },
    { jam_mulai: "10:00", jam_selesai: "12:00", kuota: 2 },
    { jam_mulai: "13:00", jam_selesai: "15:00", kuota: 2 },
  ];

  for (const j of jam) {
    await prisma.jamOperasional.upsert({
      where: { jam_mulai_jam_selesai: { jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai } },
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
