import type { FieldDef } from "./master-form";

export const jamFields: FieldDef[] = [
  { name: "jam_mulai", label: "Jam mulai", type: "time" },
  { name: "jam_selesai", label: "Jam selesai", type: "time" },
  { name: "kuota", label: "Kuota (jumlah tim paralel)", type: "number" },
  { name: "aktif", label: "Aktif", type: "checkbox" },
];
