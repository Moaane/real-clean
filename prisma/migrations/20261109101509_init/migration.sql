-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'karyawan', 'pelanggan');

-- CreateEnum
CREATE TYPE "JenisBooking" AS ENUM ('kebersihan', 'kos');

-- CreateEnum
CREATE TYPE "StatusBooking" AS ENUM ('MENUNGGU_PEMBAYARAN', 'KEDALUWARSA', 'DIBAYAR', 'DITUGASKAN', 'DALAM_PERJALANAN', 'DIKERJAKAN', 'MENUNGGU_VERIFIKASI', 'SELESAI', 'DIBATALKAN', 'DIREFUND');

-- CreateEnum
CREATE TYPE "StatusKamar" AS ENUM ('tersedia', 'terisi', 'perawatan');

-- CreateEnum
CREATE TYPE "StatusBayar" AS ENUM ('pending', 'settlement', 'expire', 'refund');

-- CreateEnum
CREATE TYPE "StatusRefund" AS ENUM ('diproses', 'sukses', 'gagal');

-- CreateEnum
CREATE TYPE "StatusTugas" AS ENUM ('ditugaskan', 'dalam_perjalanan', 'dikerjakan', 'menunggu_verifikasi', 'revisi', 'selesai');

-- CreateTable
CREATE TABLE "users" (
    "id_user" SERIAL NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "no_hp" VARCHAR(20),
    "role" "Role" NOT NULL,
    "status_aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "layanan" (
    "id_layanan" SERIAL NOT NULL,
    "nama_layanan" VARCHAR(100) NOT NULL,
    "deskripsi" TEXT,
    "harga" INTEGER NOT NULL,
    "durasi_menit" INTEGER NOT NULL,
    "status_aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "layanan_pkey" PRIMARY KEY ("id_layanan")
);

-- CreateTable
CREATE TABLE "jam_operasional" (
    "id" SERIAL NOT NULL,
    "jam_mulai" VARCHAR(5) NOT NULL,
    "jam_selesai" VARCHAR(5) NOT NULL,
    "kuota" INTEGER NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "jam_operasional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jadwal_slot" (
    "id_slot" SERIAL NOT NULL,
    "tanggal" DATE NOT NULL,
    "jam_mulai" VARCHAR(5) NOT NULL,
    "jam_selesai" VARCHAR(5) NOT NULL,
    "kuota" INTEGER NOT NULL,
    "terisi" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "jadwal_slot_pkey" PRIMARY KEY ("id_slot")
);

-- CreateTable
CREATE TABLE "kamar" (
    "id_kamar" SERIAL NOT NULL,
    "nomor_kamar" VARCHAR(10) NOT NULL,
    "tipe_kamar" VARCHAR(50) NOT NULL,
    "fasilitas" TEXT,
    "harga_per_bulan" INTEGER NOT NULL,
    "status_kamar" "StatusKamar" NOT NULL DEFAULT 'tersedia',

    CONSTRAINT "kamar_pkey" PRIMARY KEY ("id_kamar")
);

-- CreateTable
CREATE TABLE "booking" (
    "id_booking" SERIAL NOT NULL,
    "kode_booking" VARCHAR(12) NOT NULL,
    "id_pelanggan" INTEGER NOT NULL,
    "jenis_booking" "JenisBooking" NOT NULL,
    "id_layanan" INTEGER,
    "id_slot" INTEGER,
    "alamat_layanan" TEXT,
    "id_kamar" INTEGER,
    "tanggal_checkin" DATE,
    "durasi_bulan" INTEGER,
    "total_harga" INTEGER NOT NULL,
    "status" "StatusBooking" NOT NULL DEFAULT 'MENUNGGU_PEMBAYARAN',
    "batas_bayar" TIMESTAMP(3) NOT NULL,
    "catatan" TEXT,
    "alasan_batal" TEXT,
    "batal_diajukan_at" TIMESTAMP(3),
    "batal_ditolak" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id_booking")
);

-- CreateTable
CREATE TABLE "pembayaran" (
    "id_pembayaran" SERIAL NOT NULL,
    "id_booking" INTEGER NOT NULL,
    "order_id" VARCHAR(50) NOT NULL,
    "metode_bayar" VARCHAR(30),
    "jumlah" INTEGER NOT NULL,
    "status_bayar" "StatusBayar" NOT NULL DEFAULT 'pending',
    "payment_url" TEXT,
    "waktu_bayar" TIMESTAMP(3),
    "payload_webhook" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pembayaran_pkey" PRIMARY KEY ("id_pembayaran")
);

-- CreateTable
CREATE TABLE "penugasan" (
    "id_penugasan" SERIAL NOT NULL,
    "id_booking" INTEGER NOT NULL,
    "id_karyawan" INTEGER NOT NULL,
    "id_admin" INTEGER NOT NULL,
    "status_tugas" "StatusTugas" NOT NULL DEFAULT 'ditugaskan',
    "catatan_revisi" TEXT,
    "ditugaskan_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mulai_at" TIMESTAMP(3),
    "selesai_at" TIMESTAMP(3),

    CONSTRAINT "penugasan_pkey" PRIMARY KEY ("id_penugasan")
);

-- CreateTable
CREATE TABLE "bukti_kerja" (
    "id_bukti" SERIAL NOT NULL,
    "id_penugasan" INTEGER NOT NULL,
    "foto_url" VARCHAR(255) NOT NULL,
    "keterangan" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bukti_kerja_pkey" PRIMARY KEY ("id_bukti")
);

-- CreateTable
CREATE TABLE "refund" (
    "id_refund" SERIAL NOT NULL,
    "id_pembayaran" INTEGER NOT NULL,
    "id_admin" INTEGER NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "alasan" TEXT,
    "status_refund" "StatusRefund" NOT NULL DEFAULT 'diproses',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refund_pkey" PRIMARY KEY ("id_refund")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "jam_operasional_jam_mulai_jam_selesai_key" ON "jam_operasional"("jam_mulai", "jam_selesai");

-- CreateIndex
CREATE UNIQUE INDEX "jadwal_slot_tanggal_jam_mulai_key" ON "jadwal_slot"("tanggal", "jam_mulai");

-- CreateIndex
CREATE UNIQUE INDEX "kamar_nomor_kamar_key" ON "kamar"("nomor_kamar");

-- CreateIndex
CREATE UNIQUE INDEX "booking_kode_booking_key" ON "booking"("kode_booking");

-- CreateIndex
CREATE INDEX "booking_id_pelanggan_idx" ON "booking"("id_pelanggan");

-- CreateIndex
CREATE INDEX "booking_status_idx" ON "booking"("status");

-- CreateIndex
CREATE INDEX "booking_id_kamar_tanggal_checkin_idx" ON "booking"("id_kamar", "tanggal_checkin");

-- CreateIndex
CREATE UNIQUE INDEX "pembayaran_id_booking_key" ON "pembayaran"("id_booking");

-- CreateIndex
CREATE UNIQUE INDEX "pembayaran_order_id_key" ON "pembayaran"("order_id");

-- CreateIndex
CREATE INDEX "penugasan_id_booking_idx" ON "penugasan"("id_booking");

-- CreateIndex
CREATE INDEX "penugasan_id_karyawan_idx" ON "penugasan"("id_karyawan");

-- CreateIndex
CREATE INDEX "bukti_kerja_id_penugasan_idx" ON "bukti_kerja"("id_penugasan");

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_id_pelanggan_fkey" FOREIGN KEY ("id_pelanggan") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_id_layanan_fkey" FOREIGN KEY ("id_layanan") REFERENCES "layanan"("id_layanan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_id_slot_fkey" FOREIGN KEY ("id_slot") REFERENCES "jadwal_slot"("id_slot") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_id_kamar_fkey" FOREIGN KEY ("id_kamar") REFERENCES "kamar"("id_kamar") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_id_booking_fkey" FOREIGN KEY ("id_booking") REFERENCES "booking"("id_booking") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penugasan" ADD CONSTRAINT "penugasan_id_booking_fkey" FOREIGN KEY ("id_booking") REFERENCES "booking"("id_booking") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penugasan" ADD CONSTRAINT "penugasan_id_karyawan_fkey" FOREIGN KEY ("id_karyawan") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penugasan" ADD CONSTRAINT "penugasan_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bukti_kerja" ADD CONSTRAINT "bukti_kerja_id_penugasan_fkey" FOREIGN KEY ("id_penugasan") REFERENCES "penugasan"("id_penugasan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_id_pembayaran_fkey" FOREIGN KEY ("id_pembayaran") REFERENCES "pembayaran"("id_pembayaran") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;
