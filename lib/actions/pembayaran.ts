"use server";

import { getCurrentUser } from "@/lib/auth";
import { siapkanPembayaran, type SnapResult } from "@/lib/pembayaran";

export async function mulaiPembayaran(kode: string): Promise<SnapResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "pelanggan") return { ok: false, error: "Silakan login sebagai pelanggan" };
  try {
    return await siapkanPembayaran(String(kode), user.id_user);
  } catch (e) {
    console.error("[pembayaran] gagal memulai", e);
    return { ok: false, error: "Pembayaran belum bisa dimulai, coba lagi" };
  }
}
