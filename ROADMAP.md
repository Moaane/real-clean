# ROADMAP

Urutan pengerjaan berdasarkan [SPEC.md](SPEC.md). Kerjakan **satu milestone sekali**. Centang setelah semua butir selesai dan "Cara tes" lolos. Setiap milestone selalu diakhiri `pnpm lint && pnpm build` tanpa error.

## M0. Fondasi
- [x] Setujui dan pasang dependensi: Prisma 7.10.1 (+ client, adapter-pg, pg), bcryptjs, jose, zod
- [x] `.env` dan `.env.example` (tanpa nilai rahasia), `.env` masuk `.gitignore`
- [x] Schema Prisma sesuai SPEC bagian 9 (tanpa tabel pelanggan, dengan `jam_operasional`)
- [x] Migrasi awal berhasil
- [x] Seed: 1 admin, 2 karyawan, 1 pelanggan, 5 paket (rumah dan kos), 3 jam operasional

**Cara tes**: migrasi jalan di database kosong, seed bisa dijalankan dua kali tanpa duplikat, Prisma Studio menampilkan semua data seed, password tersimpan sebagai hash.

## M1. Autentikasi 3 role
- [x] Daftar pelanggan (nama, email, no. WA, password) dan login/logout
- [x] Session cookie httpOnly bertanda tangan
- [x] Guard `/admin`, `/karyawan`, `/akun` di `proxy.ts` + pengecekan ulang di sisi server
- [x] Akun nonaktif ditolak login dan sesinya ditolak
- [x] Halaman placeholder per role setelah login

**Cara tes**: tiap role hanya bisa membuka area miliknya (role lain diarahkan/ditolak), tanpa login diarahkan ke login, email duplikat ditolak, akun nonaktif tidak bisa masuk, logout menghapus akses.

## M2. Admin: data master
- [x] CRUD paket kebersihan (jenis properti rumah/kos, jumlah kamar, tingkat detail, harga, durasi, aktif/nonaktif)
- [x] CRUD jam operasional (jam, kuota, aktif)
- [x] Kelola akun karyawan (buat, ubah, aktif/nonaktif)

**Cara tes**: tiap CRUD terlihat di database, validasi menolak harga negatif/jam terbalik/jumlah kamar nol, data yang diubah terlihat di tampilan, karyawan nonaktif tidak bisa login.

## M3. Katalog publik dan ketersediaan
- [ ] Halaman beranda: daftar paket aktif (rumah dan kos)
- [ ] Cek slot kebersihan per tanggal (hanya jam aktif, `terisi < kuota`, tanggal lampau tidak bisa)

**Cara tes**: tanpa login semua halaman bisa dibuka. Ubah kuota jadi 0 lalu slot hilang. Slot yang sudah penuh (`terisi` = kuota) tidak muncul. Tanggal lampau ditolak.

## M4. Checkout tanpa pembayaran
- [ ] Form booking (pilih paket rumah atau kos), wajib login (kembali ke form setelah login)
- [ ] Total dihitung di server dari data paket
- [ ] Booking `MENUNGGU_PEMBAYARAN` + `batas_bayar` 1 jam + `kode_booking` unik
- [ ] Kuota slot terkunci dalam satu transaksi database
- [ ] Halaman "Booking Saya" (daftar dan detail milik sendiri)

**Cara tes**: dua booking bersamaan pada kuota terakhir, hanya satu yang berhasil. Mengubah harga di form tidak memengaruhi total. Pelanggan lain tidak bisa membuka detail booking orang lain.

## M5. Midtrans Snap (sandbox)
- [ ] Setujui kunci sandbox di `.env`, tanpa SDK (REST + fetch)
- [ ] Buat transaksi Snap (`order_id` unik, gross_amount dari server, expiry 1 jam)
- [ ] Baris `pembayaran` dibuat berstatus `pending`
- [ ] Tombol "Bayar" membuka popup Snap
- [ ] Halaman setelah bayar hanya menampilkan status dari database

**Cara tes**: popup tampil dengan nominal benar, `payment_url`/token tersimpan, klik "selesai" di popup tanpa webhook **tidak** mengubah status menjadi `DIBAYAR`.

## M6. Webhook pembayaran
- [ ] Route webhook dengan verifikasi `signature_key`
- [ ] Idempoten: notifikasi ganda tidak memproses dua kali
- [ ] `settlement`/`capture` menjadi `DIBAYAR`. `expire`/`cancel`/`deny` menjadi `KEDALUWARSA` dan slot dilepas
- [ ] Payload disimpan. Percobaan dengan signature salah dicatat di log
- [ ] Pengecekan `batas_bayar` terlewati saat ketersediaan dihitung / halaman dibuka

**Cara tes**: lewat tunnel (ngrok/cloudflared) dan simulator sandbox. Signature palsu ditolak 403 tanpa mengubah status. Pembayaran sukses menjadi `DIBAYAR`. Notifikasi yang sama dikirim dua kali hasilnya tetap satu perubahan. Booking tidak dibayar menjadi `KEDALUWARSA` dan kuota kembali.

## M7. Notifikasi email
- [ ] Setujui `nodemailer` dan konfigurasi SMTP (Mailtrap) di `.env`
- [ ] Email invoice + kode booking saat `DIBAYAR`
- [ ] Email saat `SELESAI`, pembatalan ditolak, dan refund sukses (dipasang bertahap pada milestone terkait)
- [ ] Gagal kirim hanya dicatat di log

**Cara tes**: pembayaran sandbox sukses menghasilkan satu email di Mailtrap berisi kode booking dan total yang benar. Dengan SMTP dimatikan, status booking tetap berubah.

## M8. Admin: kelola booking dan penugasan
- [ ] Daftar booking dengan filter status dan tanggal, plus detail
- [ ] Daftar karyawan kosong untuk jadwal booking (SPEC 5.2)
- [ ] Tugaskan karyawan: `DIBAYAR` menjadi `DITUGASKAN`, baris `penugasan` dibuat
- [ ] Email tugas baru ke karyawan

**Cara tes**: karyawan yang bentrok jam tidak muncul di daftar, menugaskan booking yang bukan `DIBAYAR` ditolak, status dan penugasan tersimpan benar.

## M9. Dashboard karyawan
- [ ] Daftar tugas dan jadwal hari ini (hanya milik sendiri)
- [ ] Detail tugas (alamat, paket, jam, catatan)
- [ ] Transisi status: `DITUGASKAN`, `DALAM_PERJALANAN`, `DIKERJAKAN`
- [ ] Unggah foto bukti ke `./uploads` (JPG/PNG/WebP, batas ukuran) dan tandai `MENUNGGU_VERIFIKASI`
- [ ] Foto hanya bisa dibuka lewat route yang memeriksa session

**Cara tes**: transisi yang melompat atau salah jenis ditolak, tidak bisa ke `MENUNGGU_VERIFIKASI` tanpa foto, file bukan gambar ditolak, karyawan lain tidak bisa membuka tugas/foto ini.

## M10. Admin: verifikasi hasil kerja
- [ ] Lihat foto bukti pada booking `MENUNGGU_VERIFIKASI`
- [ ] Setujui: `SELESAI` + email ke pelanggan
- [ ] Minta revisi (catatan wajib): kembali `DIKERJAKAN`, karyawan melihat catatan lalu unggah bukti lagi

**Cara tes**: satu siklus revisi penuh sampai `SELESAI` berjalan. Revisi tanpa catatan ditolak. Email selesai masuk ke Mailtrap.

## M11. Pembatalan dan refund
- [ ] Pelanggan ajukan batal dari "Booking Saya" (alasan, hanya saat `DIBAYAR`/`DITUGASKAN`)
- [ ] Admin melihat apakah memenuhi syarat ≥24 jam sebelum jadwal, lalu setuju atau tolak
- [ ] Setuju: `DIBATALKAN`, slot dilepas, penugasan dibatalkan, refund lewat API Midtrans sandbox
- [ ] Sukses menjadi `DIREFUND`. Gagal dicatat `status_refund = gagal` dan ditampilkan ke admin
- [ ] Email saat ditolak dan saat refund sukses

**Cara tes**: tombol batal tidak muncul di status lain, penolakan tidak mengubah status, kuota kembali setelah disetujui, refund pada metode yang tidak didukung berakhir `gagal` tanpa merusak status booking.

## M12. Dashboard dan laporan admin
- [ ] Ringkasan booking hari ini per status
- [ ] Laporan transaksi dan pendapatan per rentang tanggal (hanya `settlement`, refund dikurangkan)

**Cara tes**: angka dashboard dan laporan cocok dengan penghitungan manual dari data database, rentang tanggal kosong menampilkan nol.

## Uji akhir (setelah M10, ulangi setelah M12)
Alur lengkap: daftar pelanggan, booking, bayar di Snap sandbox, webhook `DIBAYAR`, admin menugaskan, karyawan unggah foto, admin setujui, `SELESAI` + email terkirim.
