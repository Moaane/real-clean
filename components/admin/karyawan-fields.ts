import type { FieldDef } from "./master-form";

export const karyawanFields = (mode: "baru" | "ubah"): FieldDef[] => [
  { name: "nama", label: "Nama" },
  { name: "email", label: "Email", type: "email", autoComplete: "off" },
  { name: "no_hp", label: "No. HP", type: "tel" },
  {
    name: "password",
    label: mode === "baru" ? "Password" : "Password baru",
    type: "password",
    autoComplete: "new-password",
    required: mode === "baru",
    hint: mode === "ubah" ? "Kosongkan jika tidak diubah" : "Minimal 8 karakter",
  },
  { name: "status_aktif", label: "Aktif", type: "checkbox" },
];
