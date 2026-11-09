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

export type SnapInput = {
  orderId: string
  grossAmount: number // rupiah, always computed on the server
  itemName: string
  customer: { nama: string; email: string; hp?: string | null }
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
      item_details: [
        {
          id: "layanan",
          name: input.itemName.slice(0, 50),
          price: input.grossAmount,
          quantity: 1,
        },
      ],
      customer_details: {
        first_name: input.customer.nama,
        email: input.customer.email,
        phone: input.customer.hp ?? undefined,
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
