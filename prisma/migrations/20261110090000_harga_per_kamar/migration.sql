-- Harga per kamar: satu paket per (jenis_properti, tingkat_detail), jumlah kamar dipilih
-- saat booking. Dikerjakan tanpa reset: booking, pembayaran, dan slot lama tetap utuh.

-- 1. Kolom baru pada layanan (sementara boleh NULL sampai diisi di langkah 4).
ALTER TABLE "layanan"
  ADD COLUMN "harga_dasar" INTEGER,
  ADD COLUMN "harga_per_kamar" INTEGER,
  ADD COLUMN "durasi_dasar_menit" INTEGER,
  ADD COLUMN "durasi_per_kamar_menit" INTEGER,
  ADD COLUMN "min_kamar" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "max_kamar" INTEGER;

-- 2. Snapshot pada booking, diisi dari data lama supaya total tiap booking tetap sama:
--    harga_per_kamar = total / jumlah_kamar (dibulatkan ke bawah), sisanya masuk harga_dasar,
--    sehingga harga_dasar + harga_per_kamar * jumlah_kamar = total_harga persis.
ALTER TABLE "booking"
  ADD COLUMN "jumlah_kamar" INTEGER,
  ADD COLUMN "harga_dasar" INTEGER,
  ADD COLUMN "harga_per_kamar" INTEGER,
  ADD COLUMN "durasi_menit" INTEGER;

UPDATE "booking" b
SET "jumlah_kamar"    = GREATEST(l."jumlah_kamar", 1),
    "durasi_menit"    = l."durasi_menit",
    "harga_per_kamar" = b."total_harga" / GREATEST(l."jumlah_kamar", 1),
    "harga_dasar"     = b."total_harga" - (b."total_harga" / GREATEST(l."jumlah_kamar", 1)) * GREATEST(l."jumlah_kamar", 1)
FROM "layanan" l
WHERE l."id_layanan" = b."id_layanan";

ALTER TABLE "booking"
  ALTER COLUMN "jumlah_kamar" SET NOT NULL,
  ALTER COLUMN "harga_dasar" SET NOT NULL,
  ALTER COLUMN "harga_per_kamar" SET NOT NULL,
  ALTER COLUMN "durasi_menit" SET NOT NULL;

-- 3. Gabungkan paket duplikat per (jenis_properti, tingkat_detail): yang ber-id terkecil
--    dipertahankan, booking dari paket lain dipindahkan ke sana.
UPDATE "booking" b
SET "id_layanan" = k."keep"
FROM (
  SELECT "id_layanan",
         MIN("id_layanan") OVER (PARTITION BY "jenis_properti", "tingkat_detail") AS "keep"
  FROM "layanan"
) k
WHERE b."id_layanan" = k."id_layanan" AND k."keep" <> k."id_layanan";

DELETE FROM "layanan" l
WHERE l."id_layanan" <> (
  SELECT MIN(x."id_layanan") FROM "layanan" x
  WHERE x."jenis_properti" = l."jenis_properti" AND x."tingkat_detail" = l."tingkat_detail"
);

-- 4. Paket yang bertahan memakai nilai baku model baru (sama dengan prisma/seed.ts).
UPDATE "layanan" l
SET "nama_layanan" = v."nama",
    "deskripsi" = v."deskripsi",
    "harga_dasar" = v."harga_dasar",
    "harga_per_kamar" = v."harga_per_kamar",
    "durasi_dasar_menit" = v."durasi_dasar",
    "durasi_per_kamar_menit" = v."durasi_per_kamar",
    "min_kamar" = 1,
    "max_kamar" = v."max_kamar",
    "status_aktif" = true
FROM (VALUES
  ('rumah', 'reguler', 'Rumah - Reguler',        'Sapu, pel, kamar mandi, dapur.',                                         50000, 40000, 30, 15, 6),
  ('rumah', 'detail',  'Rumah - Detail',         'Termasuk kaca, sudut, dan perabot.',                                     75000, 60000, 30, 20, 4),
  ('rumah', 'deep',    'Rumah - Deep Cleaning',  'Pembersihan menyeluruh, noda membandel, dan kerak.',                    100000, 90000, 40, 20, 4),
  ('kos',   'reguler', 'Kos - Reguler',          'Kamar, lorong, dan kamar mandi bersama.',                                50000, 25000, 20,  8, 12),
  ('kos',   'detail',  'Kos - Detail',           'Semua kamar, lorong, dapur, dan area umum secara detail.',               75000, 40000, 20, 12, 8),
  ('kos',   'deep',    'Kos - Deep Cleaning',    'Pembersihan menyeluruh semua kamar dan area bersama, termasuk noda membandel.', 100000, 60000, 24, 16, 6)
) AS v("jenis", "tingkat", "nama", "deskripsi", "harga_dasar", "harga_per_kamar", "durasi_dasar", "durasi_per_kamar", "max_kamar")
WHERE l."jenis_properti" = v."jenis"::"JenisProperti" AND l."tingkat_detail" = v."tingkat"::"TingkatDetail";

-- 5. Kunci skema akhir.
ALTER TABLE "layanan"
  ALTER COLUMN "harga_dasar" SET NOT NULL,
  ALTER COLUMN "harga_per_kamar" SET NOT NULL,
  ALTER COLUMN "durasi_dasar_menit" SET NOT NULL,
  ALTER COLUMN "durasi_per_kamar_menit" SET NOT NULL,
  ALTER COLUMN "max_kamar" SET NOT NULL,
  DROP COLUMN "jumlah_kamar",
  DROP COLUMN "harga",
  DROP COLUMN "durasi_menit";

CREATE UNIQUE INDEX "layanan_jenis_properti_tingkat_detail_key" ON "layanan"("jenis_properti", "tingkat_detail");
