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
    { nama_layanan: "Cleaning Rumah Reguler", deskripsi: "Sapu, pel, kamar mandi, dapur untuk rumah tipe kecil-menengah.", harga: 150000, durasi_menit: 120 },
    { nama_layanan: "Deep Cleaning", deskripsi: "Pembersihan menyeluruh termasuk sudut, kaca, dan perabot.", harga: 350000, durasi_menit: 240 },
    { nama_layanan: "Cuci Sofa & Kasur", deskripsi: "Pembersihan tungau dan noda untuk sofa atau kasur.", harga: 200000, durasi_menit: 90 },
  ];

  for (const l of layanan) {
    const exists = await prisma.layanan.findFirst({ where: { nama_layanan: l.nama_layanan } });
    if (!exists) await prisma.layanan.create({ data: l });
  }

  const kamar = [
    { nomor_kamar: "A1", tipe_kamar: "Standar", fasilitas: "Kasur, lemari, kipas", harga_per_bulan: 900000 },
    { nomor_kamar: "A2", tipe_kamar: "Standar", fasilitas: "Kasur, lemari, kipas", harga_per_bulan: 900000 },
    { nomor_kamar: "B1", tipe_kamar: "Deluxe", fasilitas: "Kasur, lemari, AC, kamar mandi dalam", harga_per_bulan: 1500000 },
    { nomor_kamar: "B2", tipe_kamar: "Deluxe", fasilitas: "Kasur, lemari, AC, kamar mandi dalam", harga_per_bulan: 1500000 },
    { nomor_kamar: "C1", tipe_kamar: "VIP", fasilitas: "Kasur queen, AC, TV, kamar mandi dalam", harga_per_bulan: 2200000 },
  ];

  for (const k of kamar) {
    await prisma.kamar.upsert({
      where: { nomor_kamar: k.nomor_kamar },
      update: {},
      create: k,
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
