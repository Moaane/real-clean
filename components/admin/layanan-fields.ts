import type { FieldDef } from "./master-form";

export const layananFields: FieldDef[] = [
  { name: "nama_layanan", label: "Nama paket", hint: "Contoh: Rumah 3 Kamar - Reguler" },
  { name: "deskripsi", label: "Deskripsi", type: "textarea" },
  {
    name: "jenis_properti",
    label: "Jenis properti",
    type: "select",
    options: [
      { value: "rumah", label: "Rumah" },
      { value: "kos", label: "Kos-kosan" },
    ],
  },
  { name: "jumlah_kamar", label: "Jumlah kamar", type: "number" },
  {
    name: "tingkat_detail",
    label: "Tingkat detail",
    type: "select",
    options: [
      { value: "reguler", label: "Reguler" },
      { value: "detail", label: "Detail" },
      { value: "deep", label: "Deep cleaning" },
    ],
  },
  { name: "harga", label: "Harga (Rp)", type: "number" },
  { name: "durasi_menit", label: "Durasi (menit)", type: "number" },
  { name: "status_aktif", label: "Aktif", type: "checkbox" },
];
