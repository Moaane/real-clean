"use server";

import { getCurrentUser } from "@/lib/auth";
import { preparePayment, type SnapResult } from "@/lib/pembayaran";

export async function startPayment(code: string): Promise<SnapResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") return { ok: false, error: "Silakan login sebagai pelanggan" };
  try {
    return await preparePayment(String(code), user.id_user);
  } catch (e) {
    console.error("[pembayaran] gagal memulai", e);
    return { ok: false, error: "Pembayaran belum bisa dimulai, coba lagi" };
  }
}
