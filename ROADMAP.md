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
- [x] Halaman beranda: daftar paket aktif (rumah dan kos)
- [x] Cek slot kebersihan per tanggal (hanya jam aktif, `terisi < kuota`, tanggal lampau tidak bisa)

**Cara tes**: tanpa login semua halaman bisa dibuka. Ubah kuota jadi 0 lalu slot hilang. Slot yang sudah penuh (`terisi` = kuota) tidak muncul. Tanggal lampau ditolak.

## M4. Checkout tanpa pembayaran
- [x] Form booking (pilih paket rumah atau kos), tamu boleh mengisi form di `/pesan`, login diminta saat "Lanjut ke pembayaran" (kembali ke form terisi setelah login)
- [x] Total dihitung di server dari data paket
- [x] Booking `MENUNGGU_PEMBAYARAN` + `batas_bayar` 1 jam + `kode_booking` unik
- [x] Kuota slot terkunci dalam satu transaksi database
- [x] Halaman "Booking Saya" (daftar dan detail milik sendiri)

**Cara tes**: dua booking bersamaan pada kuota terakhir, hanya satu yang berhasil. Mengubah harga di form tidak memengaruhi total. Pelanggan lain tidak bisa membuka detail booking orang lain.

## M5. Midtrans Snap (sandbox)
- [x] Setujui kunci sandbox di `.env`
- [x] Buat transaksi Snap (`order_id` unik, gross_amount dari server, expiry 1 jam)
- [x] Baris `pembayaran` dibuat berstatus `pending`
- [x] Tombol "Bayar" membuka popup Snap
- [x] Halaman setelah bayar hanya menampilkan status dari database

**Cara tes**: popup tampil dengan nominal benar, `payment_url`/token tersimpan, klik "selesai" di popup tanpa webhook **tidak** mengubah status menjadi `DIBAYAR`.

## M6. Webhook pembayaran
- [x] Route webhook dengan verifikasi `signature_key`
- [x] Idempoten: notifikasi ganda tidak memproses dua kali
- [x] `settlement`/`capture` menjadi `DIBAYAR`. `expire`/`cancel`/`deny` menjadi `KEDALUWARSA` dan slot dilepas
- [x] Payload disimpan. Percobaan dengan signature salah dicatat di log
- [x] Pengecekan `batas_bayar` terlewati saat ketersediaan dihitung / halaman dibuka

**Cara tes**: lewat tunnel (ngrok/cloudflared) dan simulator sandbox. Signature palsu ditolak 403 tanpa mengubah status. Pembayaran sukses menjadi `DIBAYAR`. Notifikasi yang sama dikirim dua kali hasilnya tetap satu perubahan. Booking tidak dibayar menjadi `KEDALUWARSA` dan kuota kembali.

## M7. Notifikasi email
- [x] Setujui `nodemailer` dan konfigurasi SMTP (Mailtrap) di `.env`
- [x] Email invoice + kode booking saat `DIBAYAR`
- [x] Email saat `SELESAI`, pembatalan ditolak, dan refund sukses (dipasang bertahap pada milestone terkait)
- [x] Gagal kirim hanya dicatat di log

**Cara tes**: pembayaran sandbox sukses menghasilkan satu email di Mailtrap berisi kode booking dan total yang benar. Dengan SMTP dimatikan, status booking tetap berubah.

## M8a. Refactor harga per kamar
- [x] SPEC diperbarui (bagian 1, 3.1, 6, 9, 12): satu paket per jenis properti + tingkat detail, jumlah kamar dipilih pelanggan
- [x] Skema: `layanan` (harga_dasar, harga_per_kamar, durasi_dasar_menit, durasi_per_kamar_menit, min_kamar, max_kamar, unik per jenis + tingkat), `booking` (jumlah_kamar + snapshot harga/durasi). Migrasi mempertahankan data lama
- [x] Seed: 6 paket (rumah/kos × reguler/detail/deep), aman dijalankan dua kali
- [x] Admin CRUD paket: field baru + validasi (harga tidak negatif, min_kamar >= 1, max_kamar >= min_kamar)
- [x] Katalog menampilkan "mulai Rp X" (harga untuk min_kamar)
- [x] Form booking: pilih paket lalu jumlah kamar, total dan estimasi durasi tampil, dihitung ulang di server
- [x] Server: validasi min..max kamar, tolak bila durasi melebihi panjang slot, simpan snapshot
- [x] Midtrans: `item_details` = biaya dasar (qty 1) + per kamar (qty jumlah_kamar), jumlahnya sama dengan `gross_amount`
- [x] Detail booking (pelanggan, admin) menampilkan jumlah kamar
- [x] Kapasitas efektif slot = min(kuota jam operasional, karyawan aktif), dipakai di ketersediaan dan checkout
- [x] Form booking: slot yang tidak muat (penuh atau kurang panjang) nonaktif beserta alasannya, tanggal terdekat bila satu tanggal tidak punya slot, teks "Lebih dari X kamar? Hubungi admin" di batas atas
- [x] Form paket admin menolak durasi pada `max_kamar` yang melebihi slot aktif terpanjang

**Cara tes**: migrasi jalan dan seed dua kali tanpa duplikat. Mengubah jumlah kamar atau harga di request klien tidak memengaruhi total. Jumlah kamar di luar min..max ditolak, durasi melebihi slot ditolak. Admin menaikkan harga paket, booking lama tetap memakai snapshot. Popup Snap menampilkan nominal yang sama dengan total di database.

## M8. Admin: kelola booking dan penugasan
- [x] Daftar booking dengan filter status dan tanggal, plus detail
- [x] Daftar karyawan kosong untuk jadwal booking (SPEC 5.2)
- [x] Tugaskan karyawan: `DIBAYAR` menjadi `DITUGASKAN`, baris `penugasan` dibuat
- [x] Email tugas baru ke karyawan

**Cara tes**: karyawan yang bentrok jam tidak muncul di daftar, menugaskan booking yang bukan `DIBAYAR` ditolak, status dan penugasan tersimpan benar.

## M9. Dashboard karyawan
- [x] Daftar tugas dan jadwal hari ini (hanya milik sendiri)
- [x] Detail tugas (alamat, paket, jam, catatan)
- [x] Transisi status: `DITUGASKAN`, `DALAM_PERJALANAN`, `DIKERJAKAN`
- [x] Setujui `@vercel/blob` dan buat Blob store di dashboard Vercel
      (`BLOB_READ_WRITE_TOKEN` di `.env`)
- [x] Unggah foto bukti ke Vercel Blob (client upload, akses private).
      Token upload hanya untuk karyawan pemilik tugas
      (cek di `onBeforeGenerateToken`). JPG/PNG/WebP, maks 5 MB
- [x] Simpan URL/pathname blob di `bukti_kerja.foto_url`, lalu tandai
      `MENUNGGU_VERIFIKASI`
- [x] Foto hanya bisa dibuka lewat route yang memeriksa session

**Cara tes**: transisi yang melompat atau salah jenis ditolak, tidak bisa
ke `MENUNGGU_VERIFIKASI` tanpa foto, file bukan gambar atau lebih dari
5 MB ditolak, karyawan lain tidak bisa minta token upload untuk tugas ini
dan tidak bisa membuka tugas/foto ini, tidak ada file yang tertulis ke
folder project.

## M10. Admin: verifikasi hasil kerja
- [x] Lihat foto bukti pada booking `MENUNGGU_VERIFIKASI`
- [x] Setujui: `SELESAI` + email ke pelanggan
- [x] Minta revisi (catatan wajib): kembali `DIKERJAKAN`, karyawan melihat catatan lalu unggah bukti lagi

**Cara tes**: satu siklus revisi penuh sampai `SELESAI` berjalan. Revisi tanpa catatan ditolak. Email selesai masuk ke Mailtrap.

## M11. Pembatalan dan refund
- [x] Pelanggan ajukan batal dari "Booking Saya" (alasan, hanya saat `DIBAYAR`/`DITUGASKAN`)
- [x] Admin melihat apakah memenuhi syarat ≥24 jam sebelum jadwal, lalu setuju atau tolak
- [x] Setuju: `DIBATALKAN`, slot dilepas, penugasan dibatalkan, refund lewat API Midtrans sandbox
- [x] Sukses menjadi `DIREFUND`. Gagal dicatat `status_refund = gagal` dan ditampilkan ke admin
- [x] Email saat ditolak dan saat refund sukses

**Cara tes**: tombol batal tidak muncul di status lain, penolakan tidak mengubah status, kuota kembali setelah disetujui, refund pada metode yang tidak didukung berakhir `gagal` tanpa merusak status booking.

## M12. Dashboard dan laporan admin
- [x] Ringkasan booking hari ini per status
- [x] Laporan transaksi dan pendapatan per rentang tanggal (hanya `settlement`, refund dikurangkan)

**Cara tes**: angka dashboard dan laporan cocok dengan penghitungan manual dari data database, rentang tanggal kosong menampilkan nol.

## Uji akhir (setelah M10, ulangi setelah M12)
Alur lengkap: daftar pelanggan, booking, bayar di Snap sandbox, webhook `DIBAYAR`, admin menugaskan, karyawan unggah foto, admin setujui, `SELESAI` + email terkirim.
