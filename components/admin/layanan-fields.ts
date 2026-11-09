import type { FieldDef } from "./master-form";

export const layananFields: FieldDef[] = [
  { name: "nama_layanan", label: "Nama layanan" },
  { name: "deskripsi", label: "Deskripsi", type: "textarea" },
  { name: "harga", label: "Harga (Rp)", type: "number" },
  { name: "durasi_menit", label: "Durasi (menit)", type: "number" },
  { name: "status_aktif", label: "Aktif", type: "checkbox" },
];
