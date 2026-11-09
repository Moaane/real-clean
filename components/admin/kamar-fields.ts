import type { FieldDef } from "./master-form";

export const kamarFields: FieldDef[] = [
  { name: "nomor_kamar", label: "Nomor kamar", hint: "Harus unik, maks. 10 karakter" },
  { name: "tipe_kamar", label: "Tipe kamar" },
  { name: "fasilitas", label: "Fasilitas", type: "textarea" },
  { name: "harga_per_bulan", label: "Harga per bulan (Rp)", type: "number" },
  {
    name: "status_kamar",
    label: "Status",
    type: "select",
    hint: "Hanya 'perawatan' yang memblokir booking",
    options: [
      { value: "tersedia", label: "Tersedia" },
      { value: "terisi", label: "Terisi" },
      { value: "perawatan", label: "Perawatan" },
    ],
  },
];
