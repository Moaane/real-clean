// Model harga per kamar (SPEC 1, 6). Murni (tanpa DB) supaya aman dipakai di server maupun klien.
// Di klien hasilnya HANYA untuk tampilan: server selalu menghitung ulang dari data paket.

export type PaketHarga = {
  harga_dasar: number;
  harga_per_kamar: number;
  durasi_dasar_menit: number;
  durasi_per_kamar_menit: number;
  min_kamar: number;
  max_kamar: number;
};

/** total = harga_dasar + harga_per_kamar × kamar; durasi = durasi_dasar + durasi_per_kamar × kamar. */
export function hitungPaket(p: PaketHarga, kamar: number) {
  return {
    total: p.harga_dasar + p.harga_per_kamar * kamar,
    durasi: p.durasi_dasar_menit + p.durasi_per_kamar_menit * kamar,
  };
}

/** Pesan galat bila jumlah kamar tidak valid untuk paket, atau null bila boleh. */
export function cekJumlahKamar(p: Pick<PaketHarga, "min_kamar" | "max_kamar">, kamar: number): string | null {
  if (!Number.isInteger(kamar)) return "Jumlah kamar harus bilangan bulat";
  if (kamar < p.min_kamar || kamar > p.max_kamar) {
    return p.min_kamar === p.max_kamar
      ? `Jumlah kamar untuk paket ini harus ${p.min_kamar}`
      : `Jumlah kamar harus antara ${p.min_kamar} dan ${p.max_kamar}`;
  }
  return null;
}

/** Jumlah kamar dari input mentah (URL), dijepit ke min..max; kosong/tidak valid jadi min_kamar. */
export function kamarAwal(p: Pick<PaketHarga, "min_kamar" | "max_kamar">, raw: string | undefined): number {
  const n = Number(raw);
  if (!raw || !Number.isInteger(n)) return p.min_kamar;
  return Math.min(p.max_kamar, Math.max(p.min_kamar, n));
}

/** "HH:mm" → menit sejak 00:00. */
export function menitDari(jam: string): number {
  const [h, m] = jam.split(":").map(Number);
  return h * 60 + m;
}

/** Panjang slot dalam menit. */
export const panjangSlotMenit = (mulai: string, selesai: string) => menitDari(selesai) - menitDari(mulai);

/** Harga "mulai dari" katalog: total untuk min_kamar. */
export const hargaMulai = (p: PaketHarga) => hitungPaket(p, p.min_kamar).total;
export const durasiMulai = (p: PaketHarga) => hitungPaket(p, p.min_kamar).durasi;

/** Teks rentang kamar, mis. "1–6 kamar". */
export const rentangKamar = (p: Pick<PaketHarga, "min_kamar" | "max_kamar">) =>
  p.min_kamar === p.max_kamar ? `${p.min_kamar} kamar` : `${p.min_kamar}–${p.max_kamar} kamar`;

/** 150 -> "2 jam 30 menit". */
export function durasiLabel(menit: number) {
  const j = Math.floor(menit / 60);
  const m = menit % 60;
  return [j ? `${j} jam` : "", m ? `${m} menit` : ""].filter(Boolean).join(" ");
}
