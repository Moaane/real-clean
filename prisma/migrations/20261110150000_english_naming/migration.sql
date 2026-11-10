-- Rename Indonesian identifiers to English. Pure renames: no data is dropped or rewritten.

-- Enum types and values
ALTER TYPE "JenisProperti" RENAME TO "PropertyType";
ALTER TYPE "TingkatDetail" RENAME TO "DetailLevel";
ALTER TYPE "StatusBooking" RENAME TO "BookingStatus";
ALTER TYPE "StatusBayar" RENAME TO "PaymentStatus";
ALTER TYPE "StatusRefund" RENAME TO "RefundStatus";
ALTER TYPE "StatusTugas" RENAME TO "TaskStatus";

ALTER TYPE "Role" RENAME VALUE 'karyawan' TO 'staff';
ALTER TYPE "Role" RENAME VALUE 'pelanggan' TO 'customer';

ALTER TYPE "PropertyType" RENAME VALUE 'rumah' TO 'house';
ALTER TYPE "PropertyType" RENAME VALUE 'kos' TO 'boarding_house';

ALTER TYPE "DetailLevel" RENAME VALUE 'reguler' TO 'regular';
ALTER TYPE "DetailLevel" RENAME VALUE 'detail' TO 'detailed';

ALTER TYPE "BookingStatus" RENAME VALUE 'MENUNGGU_PEMBAYARAN' TO 'PENDING_PAYMENT';
ALTER TYPE "BookingStatus" RENAME VALUE 'KEDALUWARSA' TO 'EXPIRED';
ALTER TYPE "BookingStatus" RENAME VALUE 'DIBAYAR' TO 'PAID';
ALTER TYPE "BookingStatus" RENAME VALUE 'DITUGASKAN' TO 'ASSIGNED';
ALTER TYPE "BookingStatus" RENAME VALUE 'DALAM_PERJALANAN' TO 'ON_THE_WAY';
ALTER TYPE "BookingStatus" RENAME VALUE 'DIKERJAKAN' TO 'IN_PROGRESS';
ALTER TYPE "BookingStatus" RENAME VALUE 'MENUNGGU_VERIFIKASI' TO 'AWAITING_VERIFICATION';
ALTER TYPE "BookingStatus" RENAME VALUE 'SELESAI' TO 'COMPLETED';
ALTER TYPE "BookingStatus" RENAME VALUE 'DIBATALKAN' TO 'CANCELLED';
ALTER TYPE "BookingStatus" RENAME VALUE 'DIREFUND' TO 'REFUNDED';

ALTER TYPE "RefundStatus" RENAME VALUE 'diproses' TO 'processing';
ALTER TYPE "RefundStatus" RENAME VALUE 'sukses' TO 'success';
ALTER TYPE "RefundStatus" RENAME VALUE 'gagal' TO 'failed';

ALTER TYPE "TaskStatus" RENAME VALUE 'ditugaskan' TO 'assigned';
ALTER TYPE "TaskStatus" RENAME VALUE 'dalam_perjalanan' TO 'on_the_way';
ALTER TYPE "TaskStatus" RENAME VALUE 'dikerjakan' TO 'in_progress';
ALTER TYPE "TaskStatus" RENAME VALUE 'menunggu_verifikasi' TO 'awaiting_verification';
ALTER TYPE "TaskStatus" RENAME VALUE 'revisi' TO 'revision';
ALTER TYPE "TaskStatus" RENAME VALUE 'selesai' TO 'completed';
ALTER TYPE "TaskStatus" RENAME VALUE 'dibatalkan' TO 'cancelled';

-- Tables
ALTER TABLE "layanan" RENAME TO "service";
ALTER TABLE "jam_operasional" RENAME TO "operating_hour";
ALTER TABLE "jadwal_slot" RENAME TO "schedule_slot";
ALTER TABLE "pembayaran" RENAME TO "payment";
ALTER TABLE "penugasan" RENAME TO "assignment";
ALTER TABLE "bukti_kerja" RENAME TO "work_proof";

-- Columns: users
ALTER TABLE "users" RENAME COLUMN "nama" TO "name";
ALTER TABLE "users" RENAME COLUMN "no_hp" TO "phone";
ALTER TABLE "users" RENAME COLUMN "status_aktif" TO "is_active";

-- Columns: service
ALTER TABLE "service" RENAME COLUMN "id_layanan" TO "id_service";
ALTER TABLE "service" RENAME COLUMN "nama_layanan" TO "service_name";
ALTER TABLE "service" RENAME COLUMN "deskripsi" TO "description";
ALTER TABLE "service" RENAME COLUMN "jenis_properti" TO "property_type";
ALTER TABLE "service" RENAME COLUMN "tingkat_detail" TO "detail_level";
ALTER TABLE "service" RENAME COLUMN "harga_dasar" TO "base_price";
ALTER TABLE "service" RENAME COLUMN "harga_per_kamar" TO "price_per_room";
ALTER TABLE "service" RENAME COLUMN "durasi_dasar_menit" TO "base_duration_minutes";
ALTER TABLE "service" RENAME COLUMN "durasi_per_kamar_menit" TO "duration_per_room_minutes";
ALTER TABLE "service" RENAME COLUMN "min_kamar" TO "min_rooms";
ALTER TABLE "service" RENAME COLUMN "max_kamar" TO "max_rooms";
ALTER TABLE "service" RENAME COLUMN "status_aktif" TO "is_active";

-- Columns: operating_hour
ALTER TABLE "operating_hour" RENAME COLUMN "jam_mulai" TO "start_time";
ALTER TABLE "operating_hour" RENAME COLUMN "jam_selesai" TO "end_time";
ALTER TABLE "operating_hour" RENAME COLUMN "kuota" TO "quota";
ALTER TABLE "operating_hour" RENAME COLUMN "aktif" TO "active";

-- Columns: schedule_slot
ALTER TABLE "schedule_slot" RENAME COLUMN "tanggal" TO "date";
ALTER TABLE "schedule_slot" RENAME COLUMN "jam_mulai" TO "start_time";
ALTER TABLE "schedule_slot" RENAME COLUMN "jam_selesai" TO "end_time";
ALTER TABLE "schedule_slot" RENAME COLUMN "kuota" TO "quota";
ALTER TABLE "schedule_slot" RENAME COLUMN "terisi" TO "filled";

-- Columns: booking
ALTER TABLE "booking" RENAME COLUMN "kode_booking" TO "booking_code";
ALTER TABLE "booking" RENAME COLUMN "id_pelanggan" TO "id_customer";
ALTER TABLE "booking" RENAME COLUMN "id_layanan" TO "id_service";
ALTER TABLE "booking" RENAME COLUMN "alamat_layanan" TO "service_address";
ALTER TABLE "booking" RENAME COLUMN "jumlah_kamar" TO "room_count";
ALTER TABLE "booking" RENAME COLUMN "harga_dasar" TO "base_price";
ALTER TABLE "booking" RENAME COLUMN "harga_per_kamar" TO "price_per_room";
ALTER TABLE "booking" RENAME COLUMN "durasi_menit" TO "duration_minutes";
ALTER TABLE "booking" RENAME COLUMN "total_harga" TO "total_price";
ALTER TABLE "booking" RENAME COLUMN "batas_bayar" TO "payment_deadline";
ALTER TABLE "booking" RENAME COLUMN "catatan" TO "notes";
ALTER TABLE "booking" RENAME COLUMN "alasan_batal" TO "cancel_reason";
ALTER TABLE "booking" RENAME COLUMN "batal_diajukan_at" TO "cancel_requested_at";
ALTER TABLE "booking" RENAME COLUMN "batal_ditolak" TO "cancel_rejected";

-- Columns: payment
ALTER TABLE "payment" RENAME COLUMN "id_pembayaran" TO "id_payment";
ALTER TABLE "payment" RENAME COLUMN "metode_bayar" TO "payment_method";
ALTER TABLE "payment" RENAME COLUMN "jumlah" TO "amount";
ALTER TABLE "payment" RENAME COLUMN "status_bayar" TO "payment_status";
ALTER TABLE "payment" RENAME COLUMN "waktu_bayar" TO "paid_at";
ALTER TABLE "payment" RENAME COLUMN "payload_webhook" TO "webhook_payload";

-- Columns: assignment
ALTER TABLE "assignment" RENAME COLUMN "id_penugasan" TO "id_assignment";
ALTER TABLE "assignment" RENAME COLUMN "id_karyawan" TO "id_staff";
ALTER TABLE "assignment" RENAME COLUMN "status_tugas" TO "task_status";
ALTER TABLE "assignment" RENAME COLUMN "catatan_revisi" TO "revision_notes";
ALTER TABLE "assignment" RENAME COLUMN "ditugaskan_at" TO "assigned_at";
ALTER TABLE "assignment" RENAME COLUMN "mulai_at" TO "started_at";
ALTER TABLE "assignment" RENAME COLUMN "selesai_at" TO "completed_at";

-- Columns: work_proof
ALTER TABLE "work_proof" RENAME COLUMN "id_bukti" TO "id_proof";
ALTER TABLE "work_proof" RENAME COLUMN "id_penugasan" TO "id_assignment";
ALTER TABLE "work_proof" RENAME COLUMN "foto_url" TO "photo_url";
ALTER TABLE "work_proof" RENAME COLUMN "keterangan" TO "remarks";

-- Columns: refund
ALTER TABLE "refund" RENAME COLUMN "id_pembayaran" TO "id_payment";
ALTER TABLE "refund" RENAME COLUMN "jumlah" TO "amount";
ALTER TABLE "refund" RENAME COLUMN "alasan" TO "reason";
ALTER TABLE "refund" RENAME COLUMN "status_refund" TO "refund_status";
ALTER TABLE "refund" RENAME COLUMN "pesan_gagal" TO "failure_message";

-- Primary keys
ALTER INDEX "layanan_pkey" RENAME TO "service_pkey";
ALTER INDEX "jam_operasional_pkey" RENAME TO "operating_hour_pkey";
ALTER INDEX "jadwal_slot_pkey" RENAME TO "schedule_slot_pkey";
ALTER INDEX "pembayaran_pkey" RENAME TO "payment_pkey";
ALTER INDEX "penugasan_pkey" RENAME TO "assignment_pkey";
ALTER INDEX "bukti_kerja_pkey" RENAME TO "work_proof_pkey";

-- Indexes
ALTER INDEX "layanan_jenis_properti_tingkat_detail_key" RENAME TO "service_property_type_detail_level_key";
ALTER INDEX "jam_operasional_jam_mulai_jam_selesai_key" RENAME TO "operating_hour_start_time_end_time_key";
ALTER INDEX "jadwal_slot_tanggal_jam_mulai_key" RENAME TO "schedule_slot_date_start_time_key";
ALTER INDEX "booking_kode_booking_key" RENAME TO "booking_booking_code_key";
ALTER INDEX "booking_id_pelanggan_idx" RENAME TO "booking_id_customer_idx";
ALTER INDEX "pembayaran_id_booking_key" RENAME TO "payment_id_booking_key";
ALTER INDEX "pembayaran_order_id_key" RENAME TO "payment_order_id_key";
ALTER INDEX "penugasan_id_booking_idx" RENAME TO "assignment_id_booking_idx";
ALTER INDEX "penugasan_id_karyawan_idx" RENAME TO "assignment_id_staff_idx";
ALTER INDEX "bukti_kerja_id_penugasan_idx" RENAME TO "work_proof_id_assignment_idx";

-- Foreign keys
ALTER TABLE "booking" RENAME CONSTRAINT "booking_id_pelanggan_fkey" TO "booking_id_customer_fkey";
ALTER TABLE "booking" RENAME CONSTRAINT "booking_id_layanan_fkey" TO "booking_id_service_fkey";
ALTER TABLE "payment" RENAME CONSTRAINT "pembayaran_id_booking_fkey" TO "payment_id_booking_fkey";
ALTER TABLE "assignment" RENAME CONSTRAINT "penugasan_id_booking_fkey" TO "assignment_id_booking_fkey";
ALTER TABLE "assignment" RENAME CONSTRAINT "penugasan_id_karyawan_fkey" TO "assignment_id_staff_fkey";
ALTER TABLE "assignment" RENAME CONSTRAINT "penugasan_id_admin_fkey" TO "assignment_id_admin_fkey";
ALTER TABLE "work_proof" RENAME CONSTRAINT "bukti_kerja_id_penugasan_fkey" TO "work_proof_id_assignment_fkey";
ALTER TABLE "refund" RENAME CONSTRAINT "refund_id_pembayaran_fkey" TO "refund_id_payment_fkey";
