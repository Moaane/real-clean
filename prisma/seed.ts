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
    { nama: "Admin GoClean", email: "admin@goclean.test", no_hp: "081200000001", role: "admin" },
    { nama: "Budi Karyawan", email: "budi@goclean.test", no_hp: "081200000002", role: "karyawan" },
    { nama: "Sari Karyawan", email: "sari@goclean.test", no_hp: "081200000003", role: "karyawan" },
    { nama: "Pelanggan Demo", email: "pelanggan@goclean.test", no_hp: "081200000004", role: "pelanggan" },
  ] as const;

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: hash },
    });
  }

  const layanan = [
    { nama_layanan: "Rumah 2 Kamar - Reguler", deskripsi: "Sapu, pel, kamar mandi, dapur.", jenis_properti: "rumah", jumlah_kamar: 2, tingkat_detail: "reguler", harga: 150000, durasi_menit: 120 },
    { nama_layanan: "Rumah 4 Kamar - Detail", deskripsi: "Termasuk kaca, sudut, dan perabot.", jenis_properti: "rumah", jumlah_kamar: 4, tingkat_detail: "detail", harga: 350000, durasi_menit: 240 },
    { nama_layanan: "Rumah 3 Kamar - Deep Cleaning", deskripsi: "Pembersihan menyeluruh, noda membandel, dan kerak.", jenis_properti: "rumah", jumlah_kamar: 3, tingkat_detail: "deep", harga: 500000, durasi_menit: 300 },
    { nama_layanan: "Kos 10 Kamar - Reguler", deskripsi: "Kamar, lorong, dan kamar mandi bersama.", jenis_properti: "kos", jumlah_kamar: 10, tingkat_detail: "reguler", harga: 450000, durasi_menit: 240 },
    { nama_layanan: "Kos 20 Kamar - Detail", deskripsi: "Semua kamar, lorong, dapur, dan area umum secara detail.", jenis_properti: "kos", jumlah_kamar: 20, tingkat_detail: "detail", harga: 1100000, durasi_menit: 420 },
  ] as const;

  for (const l of layanan) {
    const exists = await prisma.layanan.findFirst({ where: { nama_layanan: l.nama_layanan } });
    if (!exists) await prisma.layanan.create({ data: l });
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
