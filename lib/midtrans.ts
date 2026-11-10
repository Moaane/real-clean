import midtransClient from "midtrans-client"

// Midtrans Snap via the official midtrans-client SDK. SANDBOX ONLY:
// isProduction is hardcoded to false and keys without the "SB-" prefix are refused.
export const SNAP_JS_URL = "https://app.sandbox.midtrans.com/snap/snap.js"

function serverKey() {
  const key = process.env.MIDTRANS_SERVER_KEY
  if (!key) throw new Error("MIDTRANS_SERVER_KEY is not set")
  if (!key.startsWith("SB-"))
    throw new Error(
      "MIDTRANS_SERVER_KEY bukan kunci sandbox (harus diawali SB-)",
    )
  console.log(
    "[midtrans] key:",
    key.slice(0, 18),
    "len:",
    key.length,
    "akhir:",
    JSON.stringify(key.slice(-3)),
  )
  return key
}

export function clientKey() {
  const key = process.env.MIDTRANS_CLIENT_KEY
  if (!key) throw new Error("MIDTRANS_CLIENT_KEY is not set")
  if (!key.startsWith("SB-"))
    throw new Error(
      "MIDTRANS_CLIENT_KEY bukan kunci sandbox (harus diawali SB-)",
    )
  return key
}

export type SnapItem = { id: string; name: string; price: number; quantity: number }

export type SnapInput = {
  orderId: string
  grossAmount: number // rupiah, always computed on the server
  /** Sum of price × quantity MUST equal grossAmount exactly. */
  items: SnapItem[]
  customer: { name: string; email: string; phone?: string | null }
  expiryMinutes: number
  finishUrl: string
}

/** "2026-11-09 10:00:00 +0700": the format Midtrans expects for expiry.start_time. */
function startTime(d: Date) {
  const wib = new Date(d.getTime() + 7 * 3600_000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ")
  return `${wib} +0700`
}

export async function createSnapToken(input: SnapInput): Promise<string> {
  const sum = input.items.reduce((n, i) => n + i.price * i.quantity, 0)
  if (sum !== input.grossAmount) {
    throw new Error(`item_details (${sum}) tidak sama dengan gross_amount (${input.grossAmount})`)
  }
  console.log(serverKey())
  const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: serverKey(),
  })
  try {
    const trx = await snap.createTransaction({
      transaction_details: {
        order_id: input.orderId,
        gross_amount: input.grossAmount,
      },
      item_details: input.items.map((i) => ({ ...i, name: i.name.slice(0, 50) })),
      customer_details: {
        first_name: input.customer.name,
        email: input.customer.email,
        phone: input.customer.phone ?? undefined,
      },
      expiry: {
        start_time: startTime(new Date()),
        unit: "minutes",
        duration: input.expiryMinutes,
      },
      callbacks: { finish: input.finishUrl },
    })
    return trx.token
  } catch (e) {
    const err = e as { httpStatusCode?: number | string; ApiResponse?: unknown }
    console.error(
      "[midtrans] gagal membuat transaksi",
      err.httpStatusCode,
      err.ApiResponse,
    )
    throw new Error("Gagal membuat transaksi pembayaran")
  }
}

export type GatewayRefundResult = { ok: true } | { ok: false; message: string }

/**
 * Refund via the Midtrans Core API (sandbox). `refundKey` makes a retried call
 * for the same refund row idempotent on Midtrans' side. Never throws: a gateway
 * rejection (e.g. a payment method that cannot be refunded via API) is returned
 * so the caller can record it (SPEC 7).
 */
export async function refundTransaction(input: { orderId: string; refundKey: string; amount: number; reason: string }): Promise<GatewayRefundResult> {
  try {
    const core = new midtransClient.CoreApi({ isProduction: false, serverKey: serverKey() })
    const res = await core.transaction.refund(input.orderId, {
      refund_key: input.refundKey,
      amount: input.amount,
      reason: input.reason.slice(0, 180),
    })
    if (res.status_code === "200") return { ok: true }
    return { ok: false, message: res.status_message ?? `Midtrans menolak refund (kode ${res.status_code})` }
  } catch (e) {
    const err = e as { httpStatusCode?: number | string; ApiResponse?: { status_message?: string }; message?: string }
    console.error("[midtrans] refund gagal", input.orderId, err.httpStatusCode, err.ApiResponse)
    return { ok: false, message: err.ApiResponse?.status_message ?? err.message ?? "Gagal menghubungi Midtrans" }
  }
}
