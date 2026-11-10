-- AlterEnum
ALTER TYPE "StatusTugas" ADD VALUE 'dibatalkan';

-- AlterTable
ALTER TABLE "refund" ADD COLUMN     "pesan_gagal" TEXT;
