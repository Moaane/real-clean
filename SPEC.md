# SPEC: Jasa Kebersihan & Kos-kosan (GoClean clone)

Sumber: diagram di `docs/` (flowchart utama/admin/karyawan, status booking, ERD, LRS) ditambah keputusan hasil interview. Bila ada perbedaan, **dokumen ini yang berlaku**. Daftar perbedaannya ada di bagian akhir.

## 1. Ringkasan

Website booking dua jenis layanan:

- **Kebersihan**: pelanggan memilih paket, mengisi alamat, lalu memilih tanggal dan jam. Karyawan datang ke lokasi.
- **Kos-kosan**: pelanggan memilih kamar, durasi sewa (bulan), dan tanggal check-in. Karyawan menyiapkan kamar dan menyerahkan kunci.

Pembayaran lewat **Midtrans Snap (sandbox saja)**. Notifikasi lewat **email**.

## 2. Aktor dan hak akses

Semua aktor login dengan email dan password. Satu tabel `users`, kolom `role`.

| Aktor | Role | Bisa |
|---|---|---|
| Pelanggan | `pelanggan` | Daftar dan login sendiri. Melihat katalog tanpa login. Checkout (wajib login), membayar, melihat "Booking Saya", mengajukan pembatalan. |
| Admin | `admin` | Mengelola layanan, kamar, jam operasional, akun karyawan. Mengelola booking: menugaskan karyawan, verifikasi hasil kerja, memutuskan pembatalan dan refund. Melihat dashboard dan laporan. Akun admin dibuat lewat seed, tidak ada pendaftaran publik. |
| Karyawan | `karyawan` | Melihat tugas miliknya, mengubah status pengerjaan, mengunggah foto bukti. Akun dibuat admin. |

Aturan akses:

- `/admin/*` hanya admin, `/karyawan/*` hanya karyawan, `/akun/*` hanya pelanggan. Role yang salah diarahkan ke halamannya sendiri atau ditolak.
- Akun dengan `status_aktif = false` tidak bisa login dan sesi yang ada ditolak.
- Karyawan hanya bisa membuka tugas yang ditugaskan kepadanya. Pelanggan hanya bisa membuka booking miliknya.
- Registrasi publik hanya membuat role `pelanggan`.

## 3. Alur utama

### 3.1 Pelanggan
1. Membuka website, melihat daftar layanan kebersihan, kamar kos, dan ketersediaan (tanpa login).
2. Memilih jenis layanan:
   - Kebersihan: paket, alamat, tanggal, slot jam.
   - Kos: kamar, durasi sewa (bulan), tanggal check-in.
3. Menekan "Booking". Jika belum login, diarahkan ke login/daftar lalu kembali ke langkah ini. Nama, no. WA, dan email diambil dari profil.
4. Sistem mengecek ketersediaan lagi di server dan menghitung total. Bila sudah tidak tersedia, pelanggan kembali ke pemilihan.
5. Booking dibuat berstatus `MENUNGGU_PEMBAYARAN`, slot atau kamar terkunci, dan `batas_bayar` = sekarang + 1 jam.
6. Sistem meminta token Snap ke Midtrans. Pelanggan membayar di popup Snap (VA, QRIS, e-wallet).
7. Hasil pembayaran diketahui hanya dari webhook (lihat bagian 6).
8. Pelanggan memantau status di "Booking Saya" dan bisa mengajukan pembatalan (bagian 7).

### 3.2 Admin
1. Login. Dashboard menampilkan ringkasan booking hari ini.
2. Menu: kelola layanan, kamar, jam operasional, akun karyawan, booking, laporan transaksi dan pendapatan.
3. Booking `DIBAYAR`: memilih karyawan yang kosong di jadwal itu, status menjadi `DITUGASKAN`, karyawan dinotifikasi.
4. Booking `MENUNGGU_VERIFIKASI`: memeriksa foto bukti. Sesuai: `SELESAI`. Tidak sesuai: kembali ke karyawan dengan catatan revisi.
5. Pengajuan batal: sesuai syarat, setujui (`DIBATALKAN` lalu proses refund). Tidak sesuai, tolak dan beri tahu pelanggan.

### 3.3 Karyawan
1. Login. Melihat daftar tugas dan jadwal hari ini.
2. Membuka detail tugas: alamat atau kamar, jam, catatan.
3. Kebersihan: berangkat (`DALAM_PERJALANAN`), tiba dan mulai (`DIKERJAKAN`), selesai.
   Kos: mulai menyiapkan kamar (`DIKERJAKAN`), bersihkan, serahkan kunci.
4. Unggah foto bukti dan tandai selesai: `MENUNGGU_VERIFIKASI`.
5. Jika admin meminta revisi, status kembali `DIKERJAKAN`. Karyawan membaca catatan, memperbaiki, dan mengunggah bukti lagi.

## 4. Status booking

| Status | Arti |
|---|---|
| `MENUNGGU_PEMBAYARAN` | Booking dibuat, slot terkunci, menunggu bayar. |
| `KEDALUWARSA` | Tidak dibayar sebelum `batas_bayar`. Slot dilepas. Final. |
| `DIBAYAR` | Webhook settlement valid. |
| `DITUGASKAN` | Admin sudah memilih karyawan. |
| `DALAM_PERJALANAN` | Khusus kebersihan: karyawan berangkat. |
| `DIKERJAKAN` | Sedang dikerjakan (atau sedang direvisi). |
| `MENUNGGU_VERIFIKASI` | Foto bukti sudah diunggah, menunggu admin. |
| `SELESAI` | Admin menyetujui. Final. |
| `DIBATALKAN` | Pembatalan disetujui. Slot atau kamar dilepas. Menunggu refund. |
| `DIREFUND` | Refund sukses di gateway. Final. |

Transisi yang valid (selain ini ditolak oleh server) dan pemicunya:

| Dari | Ke | Dipicu oleh |
|---|---|---|
| (baru) | `MENUNGGU_PEMBAYARAN` | pelanggan checkout |
| `MENUNGGU_PEMBAYARAN` | `DIBAYAR` | webhook settlement/capture valid |
| `MENUNGGU_PEMBAYARAN` | `KEDALUWARSA` | webhook expire/cancel/deny, atau pengecekan `batas_bayar` terlewati |
| `DIBAYAR` | `DITUGASKAN` | admin memilih karyawan |
| `DITUGASKAN` | `DALAM_PERJALANAN` | karyawan (hanya jenis kebersihan) |
| `DITUGASKAN` | `DIKERJAKAN` | karyawan (hanya jenis kos) |
| `DALAM_PERJALANAN` | `DIKERJAKAN` | karyawan tiba |
| `DIKERJAKAN` | `MENUNGGU_VERIFIKASI` | karyawan unggah bukti (minimal 1 foto) |
| `MENUNGGU_VERIFIKASI` | `SELESAI` | admin setuju |
| `MENUNGGU_VERIFIKASI` | `DIKERJAKAN` | admin minta revisi (wajib catatan_revisi) |
| `DIBAYAR`, `DITUGASKAN` | `DIBATALKAN` | admin menyetujui pengajuan batal |
| `DIBATALKAN` | `DIREFUND` | refund Midtrans sukses |

Status `penugasan.status_tugas` mengikuti booking: `ditugaskan`, `dalam_perjalanan`, `dikerjakan`, `menunggu_verifikasi`, `revisi`, `selesai`. Booking kembali ke `DIKERJAKAN` setelah revisi, sedangkan `status_tugas` mencatat `revisi` sampai karyawan mulai lagi.

## 5. Ketersediaan

### 5.1 Slot jasa kebersihan
- Admin mengatur **jam operasional** (template harian): `jam_mulai`, `jam_selesai`, `kuota` (jumlah tim paralel), `aktif`. Berlaku untuk semua tanggal dan semua paket.
- Slot untuk satu tanggal = jam operasional aktif pada tanggal itu. Baris `jadwal_slot` (tanggal, jam_mulai, jam_selesai, kuota, terisi) dibuat saat booking pertama di slot tersebut.
- Slot tersedia jika `terisi < kuota`. Tanggal yang sudah lewat tidak bisa dipilih.
- `terisi` bertambah saat booking dibuat (kunci) dan berkurang saat booking `KEDALUWARSA` atau `DIBATALKAN`. Perubahan dilakukan dalam transaksi database agar dua pelanggan tidak mengambil kuota terakhir bersamaan.

### 5.2 Kamar kos
- Rentang sewa = [`tanggal_checkin`, `tanggal_checkin` + `durasi_bulan`).
- Kamar tersedia jika `status_kamar` bukan `perawatan` dan tidak ada booking lain berstatus aktif (selain `KEDALUWARSA`, `DIBATALKAN`, `DIREFUND`) dengan rentang yang bertabrakan.
- Kunci kamar dilakukan dalam transaksi database yang sama dengan pembuatan booking.
- `status_kamar` (`tersedia`, `terisi`, `perawatan`) bersifat informatif dan bisa diatur admin. Hanya `perawatan` yang memblokir booking.

### 5.3 Penugasan karyawan
Karyawan "kosong" pada jadwal itu = akun aktif yang tidak punya penugasan lain yang bentrok jamnya pada tanggal tersebut (jam_mulai sampai jam_selesai slot; untuk kos, pada tanggal check-in).

## 6. Pembayaran (Midtrans Snap, sandbox)

- Hanya environment sandbox. Server key dan client key hanya di `.env`.
- `order_id` unik per pembayaran dan dipakai juga sebagai kunci idempotensi.
- `gross_amount` dihitung ulang di server: kebersihan = `layanan.harga`, kos = `kamar.harga_per_bulan * durasi_bulan`. Angka dari klien tidak dipercaya.
- Token Snap dibuat dengan `expiry` 1 jam, sama dengan `batas_bayar`.
- Webhook: verifikasi `signature_key` = sha512(`order_id` + `status_code` + `gross_amount` + server key). Tidak valid: tolak (HTTP 403) dan catat log. Status booking tidak boleh berubah sebelum signature valid.
- Webhook idempoten: notifikasi yang sama (order_id + transaction_status) yang diterima lagi tidak mengubah apa pun. Transisi hanya dari status asal yang valid.
- Pemetaan: `settlement` (dan `capture` dengan fraud `accept`) menjadi `DIBAYAR` dan `status_bayar = settlement`. `expire`, `cancel`, `deny` menjadi `KEDALUWARSA` dan `status_bayar = expire`. `pending` hanya menyimpan metode bayar.
- Payload webhook disimpan di `pembayaran.payload_webhook`.
- Halaman redirect setelah bayar hanya menampilkan status terkini dari database. Halaman itu **tidak pernah** mengubah status menjadi dibayar.
- Booking yang lewat `batas_bayar` dan belum menerima webhook juga dianggap `KEDALUWARSA` saat ketersediaan dihitung atau saat halamannya dibuka.

## 7. Pembatalan dan refund

- Pelanggan mengajukan pembatalan dari "Booking Saya" dengan alasan, hanya saat status `DIBAYAR` atau `DITUGASKAN`.
- Syarat refund penuh: diajukan **≥ 24 jam** sebelum jadwal (jam_mulai slot, atau tanggal check-in untuk kos). Pengajuan yang tidak memenuhi syarat ditampilkan ke admin sebagai tidak memenuhi syarat dan biasanya ditolak.
- Admin menyetujui atau menolak. Menolak: status tidak berubah, pelanggan diberi tahu. Menyetujui: status `DIBATALKAN`, slot atau kamar dilepas, penugasan (jika ada) dibatalkan, lalu refund dikirim ke API refund Midtrans (sandbox) sebesar total yang dibayar.
- Refund sukses: `refund.status_refund = sukses`, `pembayaran.status_bayar = refund`, booking `DIREFUND`.
- Refund gagal (misalnya VA/QRIS tidak mendukung refund via API): `status_refund = gagal`, booking tetap `DIBATALKAN`, kegagalan dan alasannya ditampilkan ke admin.

## 8. Notifikasi (email, Nodemailer SMTP)

| Peristiwa | Penerima | Isi |
|---|---|---|
| Booking `DIBAYAR` | pelanggan | kode booking dan invoice |
| Booking `DITUGASKAN` | karyawan | tugas baru |
| Booking `SELESAI` | pelanggan | pekerjaan selesai |
| Pembatalan ditolak | pelanggan | pengajuan ditolak |
| Refund sukses | pelanggan | refund diproses |

WhatsApp tidak dikerjakan. Kegagalan kirim email dicatat di log dan tidak boleh membatalkan perubahan status.

## 9. Skema data

Penyesuaian dari LRS:
- Tabel `pelanggan` **dihapus**. Pelanggan menjadi role di `users`.
- Kolom `time` (jam_mulai/jam_selesai) disimpan sebagai string "HH:mm" (tanpa zona waktu), `date` sebagai DateTime `@db.Date`.
- PK `bigint` menjadi integer auto-increment. Kolom uang (`decimal`) menjadi integer rupiah. `enum` menjadi enum Prisma, `json` menjadi JSON, `timestamp` menjadi DateTime.
- Tabel baru `jam_operasional`. Kolom baru pada `booking` untuk pembatalan.
- Nama tabel/kolom mengikuti ERD (bahasa Indonesia).

**users**: id_user (PK), nama, email (unik), password (hash bcrypt), no_hp, role (`admin`/`karyawan`/`pelanggan`), status_aktif (default true), created_at.

**layanan**: id_layanan, nama_layanan, deskripsi, harga, durasi_menit, status_aktif.

**jam_operasional** (baru): id, jam_mulai, jam_selesai, kuota, aktif. Unik pada (jam_mulai, jam_selesai).

**jadwal_slot**: id_slot, tanggal, jam_mulai, jam_selesai, kuota, terisi. Unik pada (tanggal, jam_mulai).

**kamar**: id_kamar, nomor_kamar (unik), tipe_kamar, fasilitas, harga_per_bulan, status_kamar (`tersedia`/`terisi`/`perawatan`).

**booking**: id_booking, kode_booking (unik, 12 karakter), id_pelanggan (FK users), jenis_booking (`kebersihan`/`kos`), id_layanan (FK, null untuk kos), id_slot (FK, null untuk kos), alamat_layanan (kebersihan), id_kamar (FK, null untuk kebersihan), tanggal_checkin (kos), durasi_bulan (kos), total_harga, status, batas_bayar, catatan, created_at, dan tambahan: alasan_batal, batal_diajukan_at, batal_ditolak (boolean).

**pembayaran**: id_pembayaran, id_booking (FK, unik), order_id (unik), metode_bayar, jumlah, status_bayar (`pending`/`settlement`/`expire`/`refund`), payment_url (URL/token Snap), waktu_bayar, payload_webhook, created_at.

**penugasan**: id_penugasan, id_booking (FK), id_karyawan (FK users), id_admin (FK users), status_tugas, catatan_revisi, ditugaskan_at, mulai_at, selesai_at.

**bukti_kerja**: id_bukti, id_penugasan (FK), foto_url (path file lokal), keterangan, uploaded_at.

**refund**: id_refund, id_pembayaran (FK), id_admin (FK users), jumlah, alasan, status_refund (`diproses`/`sukses`/`gagal`), created_at.

Aturan integritas: FK booking sesuai jenis (kebersihan wajib id_layanan, id_slot, alamat. Kos wajib id_kamar, tanggal_checkin, durasi_bulan). `kode_booking` dibuat acak dan tidak berurutan.

## 10. Lingkungan dan penyimpanan

- Database: **PostgreSQL** dengan **Prisma** (migrasi dan seed).
- Session: cookie httpOnly berisi JWT bertanda tangan (`SESSION_SECRET`). Password di-hash bcrypt.
- Foto bukti: folder lokal `./uploads` (masuk `.gitignore`), disajikan lewat route handler yang memeriksa session. Hanya JPG/PNG/WebP dengan batas ukuran per file.
- Variabel `.env`: `DATABASE_URL`, `SESSION_SECRET`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `APP_URL`. Jangan di-commit.
- Webhook butuh URL publik saat dites (ngrok atau cloudflared) yang diisi di dashboard sandbox Midtrans.

## 11. Di luar cakupan

WhatsApp, produksi Midtrans, pembayaran ulang booking kedaluwarsa (pelanggan membuat booking baru), pembatalan sebagian atau refund parsial, ulasan/rating, multi-bahasa, aplikasi mobile.

## 12. Perbedaan dari diagram di `docs/`

1. Pelanggan **punya akun** (diagram: tanpa login). Tabel `pelanggan` dihapus, `booking.id_pelanggan` merujuk ke `users`. "Cek status pakai kode booking + no. WA" diganti halaman "Booking Saya".
2. Notifikasi hanya email, tidak ada WA.
3. Tabel `jam_operasional` ditambahkan untuk template jam harian.
4. Kolom pembatalan ditambahkan pada `booking`.
5. Uang disimpan sebagai integer rupiah.
6. Pengecekan "memenuhi syarat refund" dibuat eksplisit: ≥24 jam sebelum jadwal.
7. `status_kamar` tidak menentukan ketersediaan. Yang menentukan adalah booking yang bentrok.
