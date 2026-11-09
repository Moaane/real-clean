-- CreateEnum
CREATE TYPE "JenisProperti" AS ENUM ('rumah', 'kos');

-- CreateEnum
CREATE TYPE "TingkatDetail" AS ENUM ('reguler', 'detail', 'deep');

-- DropForeignKey
ALTER TABLE "booking" DROP CONSTRAINT "booking_id_kamar_fkey";

-- DropForeignKey
ALTER TABLE "booking" DROP CONSTRAINT "booking_id_layanan_fkey";

-- DropForeignKey
ALTER TABLE "booking" DROP CONSTRAINT "booking_id_slot_fkey";

-- DropIndex
DROP INDEX "booking_id_kamar_tanggal_checkin_idx";

-- AlterTable
ALTER TABLE "booking" DROP COLUMN "durasi_bulan",
DROP COLUMN "id_kamar",
DROP COLUMN "jenis_booking",
DROP COLUMN "tanggal_checkin",
ALTER COLUMN "id_layanan" SET NOT NULL,
ALTER COLUMN "id_slot" SET NOT NULL,
ALTER COLUMN "alamat_layanan" SET NOT NULL;

-- AlterTable
ALTER TABLE "layanan" ADD COLUMN     "jenis_properti" "JenisProperti" NOT NULL DEFAULT 'rumah',
ADD COLUMN     "jumlah_kamar" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "tingkat_detail" "TingkatDetail" NOT NULL DEFAULT 'reguler';

-- Existing rows got placeholder values; the defaults were only for backfill.
ALTER TABLE "layanan" ALTER COLUMN "jenis_properti" DROP DEFAULT,
ALTER COLUMN "jumlah_kamar" DROP DEFAULT,
ALTER COLUMN "tingkat_detail" DROP DEFAULT;

-- DropTable
DROP TABLE "kamar";

-- DropEnum
DROP TYPE "JenisBooking";

-- DropEnum
DROP TYPE "StatusKamar";

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_id_layanan_fkey" FOREIGN KEY ("id_layanan") REFERENCES "layanan"("id_layanan") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_id_slot_fkey" FOREIGN KEY ("id_slot") REFERENCES "jadwal_slot"("id_slot") ON DELETE RESTRICT ON UPDATE CASCADE;

