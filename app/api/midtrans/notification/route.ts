import { after } from "next/server";
import { kirimEmailInvoice } from "@/lib/notifikasi";
import { signatureValid, prosesNotifikasi, type Notifikasi } from "@/lib/webhook-midtrans";

// Midtrans payment notification (HTTP notification URL). No session: authenticity
// comes only from signature_key. Nothing changes before the signature is valid.
export async function POST(request: Request) {
  // Since 28 Oct 2026 Midtrans signs notifications with the separate Signature Secret Key, not the Server Key.
  const signatureKey = process.env.MIDTRANS_SIGNATURE_KEY;
  if (!signatureKey) {
    console.error("[webhook] MIDTRANS_SIGNATURE_KEY belum diset");
    return Response.json({ message: "server error" }, { status: 500 });
  }

  let body: Notifikasi;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("bukan objek");
    body = parsed as Notifikasi;
  } catch {
    return Response.json({ message: "bad request" }, { status: 400 });
  }

  if (!signatureValid(body, signatureKey)) {
    console.warn("[webhook] signature tidak valid", {
      order_id: typeof body.order_id === "string" ? body.order_id.slice(0, 50) : null,
      transaction_status: typeof body.transaction_status === "string" ? body.transaction_status : null,
      ip: request.headers.get("x-forwarded-for") ?? null,
    });
    return Response.json({ message: "invalid signature" }, { status: 403 });
  }

  try {
    const hasil = await prosesNotifikasi(body);
    if (!hasil.ok) {
      console.error("[webhook] notifikasi valid tapi ditolak", hasil.alasan, body.order_id);
      return Response.json({ message: hasil.alasan }, { status: hasil.alasan === "order-tidak-ditemukan" ? 404 : 400 });
    }
    // Only the notification that actually flipped the booking to DIBAYAR sends the
    // invoice (duplicates report "duplikat"), and a mail failure cannot affect the reply.
    if (hasil.aksi === "dibayar") after(() => kirimEmailInvoice(String(body.order_id)));
    return Response.json({ message: "ok", aksi: hasil.aksi });
  } catch (e) {
    // 500 makes Midtrans retry; the handler is idempotent so a retry is safe.
    console.error("[webhook] gagal memproses", e);
    return Response.json({ message: "server error" }, { status: 500 });
  }
}
