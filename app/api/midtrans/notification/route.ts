import { after } from "next/server";
import { sendInvoiceEmail } from "@/lib/notifikasi";
import { signatureValid, processNotification, type Notification } from "@/lib/webhook-midtrans";

// Midtrans payment notification (HTTP notification URL). No session: authenticity
// comes only from signature_key. Nothing changes before the signature is valid.
export async function POST(request: Request) {
  // Since 28 Oct 2026 Midtrans signs notifications with the separate Signature Secret Key, not the Server Key.
  const signatureKey = process.env.MIDTRANS_SIGNATURE_KEY;
  if (!signatureKey) {
    console.error("[webhook] MIDTRANS_SIGNATURE_KEY belum diset");
    return Response.json({ message: "server error" }, { status: 500 });
  }

  let body: Notification;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("bukan objek");
    body = parsed as Notification;
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
    const result = await processNotification(body);
    if (!result.ok) {
      console.error("[webhook] notifikasi valid tapi ditolak", result.reason, body.order_id);
      return Response.json({ message: result.reason }, { status: result.reason === "order-tidak-ditemukan" ? 404 : 400 });
    }
    // Only the notification that actually flipped the booking to PAID sends the
    // invoice (duplicates report "duplicate"), and a mail failure cannot affect the reply.
    if (result.outcome === "paid") after(() => sendInvoiceEmail(String(body.order_id)));
    return Response.json({ message: "ok", outcome: result.outcome });
  } catch (e) {
    // 500 makes Midtrans retry; the handler is idempotent so a retry is safe.
    console.error("[webhook] gagal memproses", e);
    return Response.json({ message: "server error" }, { status: 500 });
  }
}
