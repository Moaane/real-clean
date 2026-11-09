# GoClean Design System v4 ("Clean Wave", tema terang)


Status: **spesifikasi desain, diterapkan di landing page**. Menggantikan v3 (Medical Teal): sekarang satu tema terang netral dengan satu aksen hijau. Tema gelap dihapus.
Stack: Next.js 16 App Router, Tailwind v4 (token di `@theme inline` pada `app/globals.css`), tanpa dependency baru.

Sumber:
- **Bentuk, layout, hierarki:** analisis 6 mockup di `docs/mockups/` (warna mockup diabaikan).
- **Warna:** abu terang netral + satu aksen hijau `#34B05A` seperti referensi Clean Wave. Teks di atas hijau memakai `#111111` agar lolos kontras.
- **Font:** Plus Jakarta Sans (heading dan body).

---

## 1. Bahasa visual (dari mockup)

| Ciri | Aturan |
|---|---|
| Bentuk | Pil penuh untuk tombol, chip, dan badge. Kartu dan gambar memakai radius besar. |
| Hierarki | Judul besar dan tegas, dengan **satu frasa kunci berwarna `primary`**. Di bawahnya teks netral kecil. |
| Spasi | Lega. Jarak antar section besar, padding kartu besar, gap konsisten. |
| Kedalaman | Datar. Kartu putih di atas latar mint pucat, border 1px, tanpa shadow berat. |
| CTA | Satu CTA utama per bagian, berbentuk pil dengan ikon panah. CTA sekunder berupa pil outline. |
| Ikon | Garis tipis (outline), selalu dari `components/icons.tsx`. Tanpa emoji. |
| Foto | Foto asli pekerjaan dan petugas, sudut membulat, tidak dipotong asal. |

Alur booking tidak ada di mockup (mockup hanya landing page). Stepper, badge status, dan form diturunkan dari bahasa visual yang sama.

## 2. Warna

Nilai kontras diperkirakan dari rumus WCAG. Ukur ulang dengan alat kontras saat implementasi.

### 2.1 Token inti

| Token | Hex | Pakai untuk | Kontras |
|---|---|---|---|
| `--background` | `#F0F2F4` | latar halaman | n/a |
| `--surface` | `#FFFFFF` | kartu, section, input, navbar | n/a |
| `--surface-2` | `#E6E9EC` | hover baris, header tabel, latar kosong foto | n/a |
| `--border` | `#DDE1E5` | border dekoratif kartu | n/a |
| `--border-strong` | `#8A9199` | border input dan kontrol | ≥ 3:1 di atas surface |
| `--foreground` | `#111111` | teks utama | ≥ 15:1 |
| `--muted` | `#5B6470` | teks sekunder | ≥ 5.5:1 di `--background` |
| `--primary` | `#34B05A` | tombol utama, **kata sorot di judul besar**, ikon dekoratif | teks `#111` di atasnya ±7.6:1 |
| `--primary-hover` | `#2D9A4F` | hover/press tombol primary | teks `#111` ±5.4:1 |
| `--primary-bright` | `#34B05A` | dekoratif saja (ikon besar, ilustrasi) | n/a |
| `--on-primary` | `#111111` | teks di atas `--primary` | n/a |
| `--primary-soft` | `#DDF3E4` | chip lembut, panel Solusi, item nav aktif | n/a |
| `--on-primary-soft` | `#1E6B38` | teks di atas primary-soft | ≥ 5:1 |
| `--primary-ink` | `#1F7A3D` | **teks kecil dan tautan hijau** | ±5:1 di `--background` |
| `--ring` | `#1F7A3D` | cincin fokus | ≥ 3:1 |

Aturan hijau:
- `#34B05A` di atas `#F0F2F4` hanya ±2.4:1. Jadi `--primary` **tidak boleh** dipakai untuk teks kecil. Satu-satunya pengecualian adalah kata sorot pada judul besar (≥ 32px) sesuai referensi. Untuk teks kecil, tautan, dan angka aktif pakai `--primary-ink`.
- Putih di atas `#34B05A` hanya ±2.9:1, karena itu teks tombol utama `#111111`.

### 2.2 Warna semantik

| Token | Teks/ikon | Latar lembut | Pakai untuk |
|---|---|---|---|
| `ok` | `#15803D` | `#DCFCE7` | sukses, dibayar, slot tersedia |
| `warn` | `#B45309` | `#FEF3C7` | menunggu, perlu perhatian |
| `danger` | `#B91C1C` | `#FEE2E2` | error, batal |
| `info` | `#1D5F8A` | `#DCEAF7` | proses berjalan (biru, agar tidak mirip aksen hijau) |
| `neutral` | `#475569` | `#E2E8F0` | tidak aktif, kedaluwarsa |

Teks di atas latar lembut ≥ 4.5:1. Warna tidak boleh menjadi satu-satunya pembeda. Selalu sertakan ikon atau teks.

### 2.3 Badge status booking

Pemetaan ke `StatusBooking` (`lib/booking-status.ts`). Setiap badge berisi **ikon + label** (label dari `STATUS_LABEL`).

| Status | Tone | Latar | Teks | Ikon |
|---|---|---|---|---|
| `MENUNGGU_PEMBAYARAN` | warn | `#FEF3C7` | `#B45309` | jam |
| `DIBAYAR` | ok | `#DCFCE7` | `#15803D` | centang |
| `DITUGASKAN` | info | `#DCEAF7` | `#1D5F8A` | orang |
| `DALAM_PERJALANAN` | info | `#DCEAF7` | `#1D5F8A` | panah rute |
| `DIKERJAKAN` | info | `#DCEAF7` | `#1D5F8A` | percikan |
| `MENUNGGU_VERIFIKASI` | warn | `#FEF3C7` | `#B45309` | perisai |
| `SELESAI` | ok (solid) | `#15803D` | `#FFFFFF` | centang ganda (putih ±5:1 di hijau tua) |
| `KEDALUWARSA` | neutral | `#E2E8F0` | `#475569` | jam coret |
| `DIBATALKAN` | danger | `#FEE2E2` | `#B91C1C` | silang |
| `DIREFUND` | neutral | `#E2E8F0` | `#475569` | panah balik |


Aturan: komponen memakai token semantik saja, tanpa hex mentah. Tidak ada tema gelap.

## 3. Tipografi

**Plus Jakarta Sans** untuk heading dan body, bobot 400, 500, 600, 700, 800. Pakai `next/font/google` (bukan `@import`). Daftarkan `--font-sans` di `@theme inline`.

| Level | Mobile / Desktop | Bobot | Line-height | Letter-spacing |
|---|---|---|---|---|
| Display (hero) | 36 / 56 | **500** | 1.02 | -0.03em |
| Judul section publik | 32 / 48 | **500** | 1.02 | -0.03em |
| H1 (akun, admin, form) | 28 / 40 | 700 | 1.15 | -0.02em |
| H2 | 22 / 30 | 700 | 1.25 | -0.01em |
| H3 | 18 / 20 | 600 | 1.3 | 0 |
| Body | 16 | 400 | 1.6 | 0 |
| Small | 14 | 400/500 | 1.5 | 0 |
| Caption | 12 (minimum) | 500 | 1.4 | 0.01em |

Display dan judul section publik memakai utilitas `title-display` (kapital, bobot 500, rapat) di `app/globals.css`.

- Display dan judul section boleh huruf kapital semua seperti mockup (hanya di halaman publik). Judul di halaman akun, admin, dan form memakai huruf biasa.
- Satu frasa kunci per judul diberi warna `--primary`.
- Harga memakai `tabular-nums`, format `Rp 150.000`. Heading memakai `text-wrap: balance`.

## 4. Spasi, radius, elevasi

- **Skala spasi (4px):** 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Jarak antar section: 64 (mobile) / 96 (desktop). Padding kartu: 20 (mobile) / 28 (desktop). Gap antar kartu: 16–24.
- **Radius:**

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `--radius-sm` | 8px | tag kecil, tooltip |
| `--radius-md` | 12px | input, alert |
| `--radius-lg` | 20px | kartu, gambar |
| `--radius-xl` | 28px | kartu section besar, modal, sheet |
| `--radius-pill` | 9999px | tombol, chip, badge, avatar |

- **Elevasi:** kartu hanya `border 1px var(--border)`. Shadow `0 8px 24px rgb(19 78 74 / 0.10)` hanya untuk dropdown, modal, dan bar sticky bawah.
- **Container:** `max-w-6xl` (publik), `max-w-5xl` (pelanggan), `max-w-7xl` (admin). Padding horizontal 16 (mobile) / 24 (desktop).
- **Breakpoint:** 375 (dasar), 768, 1024, 1440. Tanpa scroll horizontal di semua lebar.

## 5. Ikon

Set SVG outline, stroke 1.75px, ukuran 20px (UI) dan 24px (navigasi), dari `components/icons.tsx`. Ikon dekoratif memakai `aria-hidden`. Tombol hanya-ikon wajib punya `aria-label`.

## 6. Spesifikasi komponen

### 6.1 Button

| Varian | Latar | Teks | Border | Dipakai |
|---|---|---|---|---|
| `primary` | `--primary` | `--on-primary` (`#111111`, gelap) | none | CTA utama (Pesan, Bayar, Simpan, Masuk) |
| `outline` | transparan | `--foreground` | 1px `--border-strong` | aksi sekunder (mockup: "Contact us") |
| `ghost` | transparan | `--primary-ink` | none | aksi tersier, tautan aksi |
| `soft` | `--primary-soft` | `--on-primary-soft` | none | aksi ringan di dalam kartu |
| `danger` | transparan | `--danger` | 1px `--danger` | Batalkan, Hapus (selalu dengan konfirmasi) |

- **Bentuk:** pil (`--radius-pill`). Opsional ikon panah di kanan untuk CTA navigasi (mockup).
- **Ukuran:** `md` tinggi 44px, padding-x 20px, font 15/600 (default, mobile dan desktop). `lg` tinggi 52px, padding-x 28px, font 16/600 (hero, bar bayar). `sm` tinggi 36px, font 14/600, **hanya** untuk desktop admin dan tabel, dengan area sentuh tetap diperluas ke 44px.
- **State:** hover → `primary-hover` (150ms). `:active` scale 0.98. `:disabled` opacity 0.5 dan `aria-disabled`. `loading` → spinner + teks "Memproses…" dan tombol nonaktif agar tidak ada double submit. `:focus-visible` → ring 2px `--ring` dengan offset 2px, jangan dihapus.
- Satu `primary` `lg` per layar sebagai aksi utama.

### 6.2 Input

- Tinggi 48px, padding-x 16px, font 16 (mencegah zoom iOS), radius `--radius-md`, latar `--surface`, border 1px `--border-strong`.
- **Label** selalu terlihat di atas field (14/600, `--foreground`). Placeholder bukan label. Field wajib ditandai teks "(wajib)".
- **State:** hover → border `--foreground` 40%. Fokus → border `--primary` + ring 2px `--ring`. Error → border `--danger`, pesan 14px `--danger` dengan ikon di bawah field, terhubung lewat `aria-describedby`, field diberi `aria-invalid`. Disabled → latar `--surface-2`, opacity 0.6.
- Teks bantu 14px `--muted` di bawah field.
- Validasi saat `blur`, bukan tiap ketikan. Atribut `autocomplete` dan `inputmode` sesuai (telepon: `tel`).
- Varian: `select` (chevron kanan, tinggi sama), `textarea` (min 96px), password (tombol tampil/sembunyikan dengan `aria-label`).

### 6.3 Card

| Varian | Spesifikasi |
|---|---|
| `card` | latar `--surface`, border 1px `--border`, radius `--radius-lg`, padding 20/28, tanpa shadow |
| `card-interactive` | seperti `card`, hover → border `--primary` 40% dan `translateY(-2px)` (200ms). Seluruh kartu fokusable, `focus-visible` ring |
| `card-section` | latar `--surface`, radius `--radius-xl`, dipakai membungkus satu section besar seperti di mockup |

**Kartu paket layanan** (dari mockup 2 dan 6):
1. Foto/ilustrasi rasio 4:3, radius `--radius-lg` (dimensi dipesan di muka, tanpa layout shift).
2. Nama paket (H3).
3. Ringkasan "termasuk apa" 2–3 baris `--muted`.
4. Metadata (durasi, jenis) dengan ikon garis kecil 16px.
5. Harga "mulai dari" (`tabular-nums`, 18/700).
6. CTA `primary` "Pilih paket".

### 6.4 Badge

- Pil, tinggi 28px, padding-x 12px, font 13/600, ikon 14px di kiri, gap 6px.
- Warna sesuai tabel di §2.3 (latar lembut + teks gelap, kecuali `SELESAI` yang solid).
- **Chip filter** (mockup 2: Offices, Houses…): pil tinggi 44px, border 1px `--border-strong`. Aktif → latar `--primary`, teks `--on-primary`, ikon centang. Dikelompokkan dengan `role="radiogroup"` atau `tablist`.
- **Lencana angka kecil** (mockup 4: "8 years") memakai gaya `soft` dan posisi menempel di sudut avatar.

### 6.5 Stepper booking

Alur pelanggan: **1 Layanan → 2 Jadwal → 3 Detail → 4 Bayar**.

| Aspek | Spesifikasi |
|---|---|
| Orientasi | Horizontal. Di mobile cukup 4 titik + label langkah aktif ("Langkah 2 dari 4: Jadwal") |
| Lingkaran langkah | 32px, font 14/700 |
| Selesai | latar `--primary`, ikon centang putih, bisa diklik untuk kembali |
| Aktif | border 2px `--primary`, angka `--primary`, latar `--primary-soft`, `aria-current="step"` |
| Belum | border 1px `--border-strong`, angka `--muted` |
| Garis penghubung | 2px. Terisi `--primary` untuk langkah yang selesai, `--border` untuk sisanya |
| Label | 14/600 di bawah (desktop) atau sebaris (mobile) |
| Markup | `<ol>` dengan `aria-label="Langkah pemesanan"` |

**Pemilih tanggal dan jam** (di langkah 2):
- Tanggal: strip horizontal 14 hari (chip pil 64×72). Hari tutup atau penuh dinonaktifkan dengan teks "Penuh".
- Jam: grid chip 3–4 kolom dari data jam operasional. Slot terisi memakai `aria-disabled` plus teks, bukan hanya warna pudar. Pilihan aktif: latar `--primary` dan ikon centang.
- **Bar ringkasan sticky** di bawah layar mobile: paket, tanggal-jam, total, tombol `primary` `lg`. Total hanya tampilan, karena server menghitung ulang harga (aturan di CLAUDE.md).

**Timeline status** di halaman detail booking: vertikal, titik terisi `--primary` untuk langkah selesai, cincin untuk langkah aktif, abu untuk langkah berikutnya.

### 6.6 Navbar

| Aspek | Spesifikasi |
|---|---|
| Bentuk | Bar di dalam kartu membulat `--radius-xl` (mockup 1), atau sticky penuh lebar dengan border bawah 1px `--border` |
| Tinggi | 64px (desktop), 56px (mobile) |
| Latar | `--surface` (boleh 90% opak + blur ringan saat sticky) |
| Kiri | Logo (ikon 32px + "GoClean" 18/700) |
| Tengah (≥ 768px) | Tautan: Layanan, Cara Kerja, Booking Saya. 15/500, jarak 32px |
| Kanan | Belum login → `outline` "Masuk" + `primary` "Daftar". Sudah login → avatar/inisial + menu Akun |
| Aktif | Tautan aktif: latar `--primary-soft`, teks `--on-primary-soft`, `aria-current="page"`. Radius pil, tinggi 40px |
| Mobile | Hamburger membuka sheet dari atas. Pelanggan juga mendapat **bottom nav** 4 item (Beranda, Layanan, Booking, Akun). Target sentuh ≥ 44px |
| Karyawan | Bottom nav 3 item: Tugas hari ini, Riwayat, Akun |
| Admin | Sidebar kiri 260px (desktop), drawer (mobile): Ringkasan, Booking, Layanan, Kamar/Jam, Karyawan, Pembayaran |

Skip link "Lewati ke konten" ada di awal DOM.

### 6.7 Komponen lain (ringkas)

- **Tabel admin:** header `--surface-2`, teks 12px kapital `--muted`. Baris 56px, hover `--surface-2`. Di bawah 768px menjadi daftar kartu. Aksi per baris lewat menu dengan label aksesibel. Hapus selalu lewat dialog konfirmasi.
- **Alert:** latar `*-soft`, border 1px warna sama, ikon di kiri. `role="alert"` untuk error.
- **Toast:** bawah (mobile) / kanan-atas (desktop), hilang dalam 4–5 detik, tidak mengambil fokus, tidak untuk error kritis.
- **Empty state:** ikon, satu kalimat, satu CTA.
- **Skeleton:** untuk daftar paket dan riwayat. Jangan pakai spinner layar penuh.
- **Modal/sheet:** perangkap fokus, `Esc` menutup, fokus kembali ke pemicu. Di mobile berupa bottom sheet, radius atas `--radius-xl`.
- **Avatar petugas:** bulat 64px, lencana pengalaman (badge `soft`) di sudut. Dipakai di halaman detail booking untuk petugas yang ditugaskan.

## 7. Layout halaman

1. **Beranda:** hero dua kolom (judul besar + frasa kunci `primary` di kiri, paragraf + CTA di kanan), foto lebar di bawahnya. Lalu baris kepercayaan, paket populer, cara kerja 3 langkah, FAQ akordeon, footer dengan kontak.
2. **Daftar layanan:** judul + deskripsi dua kolom, chip filter (Rumah / Kos), grid kartu paket (1 kolom di mobile, 2 di tablet, 3 di desktop).
3. **Booking:** Stepper di atas, konten langkah di tengah (max 640px), bar ringkasan sticky.
4. **Pembayaran:** ringkasan, tombol bayar ke gateway sandbox. Halaman setelah redirect berbunyi "Menunggu konfirmasi pembayaran". Status berubah menjadi *Dibayar* hanya setelah webhook, bukan setelah redirect.
5. **Riwayat dan detail booking:** daftar kartu dengan badge status. Detail dengan timeline.
6. **Login/Daftar:** satu kolom, form terpusat (`auth-shell`).
7. **Karyawan dan Admin:** sesuai §6.6.

## 8. Gerak

- Hover/warna 150ms. Perubahan panel 200–250ms. Sheet/modal masuk 250ms (`ease-out`), keluar 180ms (`ease-in`).
- Hanya animasikan `opacity` dan `transform`.
- Gerak harus bermakna (sheet naik dari bawah, centang muncul saat langkah selesai). Tanpa animasi dekoratif berulang.
- `prefers-reduced-motion`: matikan transform, sisakan fade.

## 9. Aksesibilitas (wajib lolos)

- Kontras teks ≥ 4.5:1, komponen UI ≥ 3:1.
- Semua fungsi bisa dipakai dengan keyboard, fokus selalu terlihat, urutan tab sesuai urutan visual.
- Target sentuh ≥ 44×44px dengan jarak ≥ 8px.
- Zoom 200% tidak merusak layout dan jangan matikan zoom di viewport.
- Status dan error diumumkan lewat `aria-live` (polite untuk status, assertive untuk error).
- Gambar paket punya `alt` bermakna. Gambar dekoratif memakai `alt=""`.

## 9b. Aset foto (`public/images/*.webp`)

Semua foto lewat `components/ui/photo.tsx` (`next/image`, `fill`, `object-cover`, radius dari `className`). Bila berkas belum ada, tampil bingkai kosong dengan rasio yang sama (tanpa layout shift).

| Berkas | Dipakai di | Rasio |
|---|---|---|
| `hero.webp` | hero beranda | 21:9 (desktop), 4:3 (mobile) |
| `solusi.webp` | panel Solusi | 4:5 |
| `tingkat-reguler.webp`, `tingkat-detail.webp`, `tingkat-deep.webp` | kartu Tiga tingkat | 4:5 |
| `paket-rumah.webp`, `paket-kos.webp` | kartu paket (beranda, /layanan) | 1:1 / 4:3 |
| `petugas-1.webp` … `petugas-4.webp` | avatar bulat petugas | 1:1 |

Foto petugas dipetakan menurut urutan, belum terikat ke akun karyawan tertentu.

## 10. Pemetaan ke kode saat ini

Ini hanya daftar, belum dikerjakan.

| Berkas | Perubahan yang diperlukan |
|---|---|
| `app/globals.css` | Ganti token warna, tambah `--surface-2`, `--border-strong`, `--primary-soft`, token semantik (`ok/warn/danger/info/neutral`), `--radius-*`. Ganti kelas tombol, input, kartu, badge sesuai §6 |
| `app/layout.tsx` | Pasang Plus Jakarta Sans lewat `next/font/google` |
| `lib/booking-status.ts` | Petakan `statusBadgeClass` ke 5 tone dan tambahkan ikon per status |
| `components/site-header.tsx` | Sesuaikan ke spesifikasi Navbar §6.6 |
| `components/booking-form.tsx` | Tambah Stepper §6.5 dan bar ringkasan sticky |
| `components/ui/*`, `components/landing/*` | Selaraskan dengan token baru |

## 11. Urutan implementasi yang disarankan

Sesuai CLAUDE.md, kerjakan per milestone:

1. Token + font + komponen dasar (Button, Input, Card, Badge).
2. Navbar dan navigasi bawah/sidebar.
3. Beranda dan daftar layanan.
4. Stepper dan alur booking, lalu detail booking dengan timeline.
5. Auth, admin, karyawan.

Tiap langkah verifikasi dengan `pnpm lint && pnpm build`, dan cek manual di lebar 375/768/1024/1440.

## 12. Checklist sebelum rilis

- [ ] Tidak ada emoji sebagai ikon, tidak ada hex mentah di komponen
- [ ] `cursor-pointer` di semua elemen yang bisa diklik
- [ ] Hover/press ada transisi 150–250ms
- [ ] Fokus keyboard terlihat di semua kontrol
- [ ] Kontras diverifikasi (teks kecil memakai `--primary-ink`, bukan `--primary`)
- [ ] Tanpa scroll horizontal di 375px
- [ ] `prefers-reduced-motion` dihormati
- [ ] Satu CTA `primary` `lg` per layar
- [ ] Total harga di UI hanya tampilan, server tetap menghitung ulang
