import { rp, dateId, timeId } from "./booking-status";
import { esc, sendEmail } from "./email";
import { prisma } from "./prisma";

/**
 * Invoice + booking code for a booking that just became PAID (SPEC 8).
 * Everything shown comes from the database. Never throws.
 */
export async function sendInvoiceEmail(orderId: string): Promise<void> {
  try {
    const p = await prisma.payment.findUnique({
      where: { order_id: orderId },
      include: { booking: { include: { service: true, slot: true, customer: true } } },
    });
    if (!p || p.booking.status !== "PAID") return;
    const b = p.booking;

    const schedule = `${dateId(b.slot.date)}, ${b.slot.start_time}–${b.slot.end_time} WIB`;
    const paid = p.paid_at ? timeId(p.paid_at) + " WIB" : "-";
    const rows: [string, string][] = [
      ["Kode booking", b.booking_code],
      ["Paket", b.service.service_name],
      ["Jumlah kamar", `${b.room_count} kamar`],
      ["Jadwal", schedule],
      ["Alamat", b.service_address],
      ["Metode bayar", p.payment_method ?? "-"],
      ["Waktu bayar", paid],
      ["Total dibayar", rp(p.amount)],
    ];

    await sendEmail({
      to: b.customer.email,
      subject: `Pembayaran diterima, kode booking ${b.booking_code}`,
      text: [`Halo ${b.customer.name},`, "", "Pembayaran Anda sudah kami terima. Berikut invoice Anda:", "", ...rows.map(([k, v]) => `${k}: ${v}`), "", "Petugas akan segera ditugaskan. Pantau statusnya di Booking Saya.", "Terima kasih."].join("\n"),
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111">
  <h2 style="margin:0 0 8px">Pembayaran diterima</h2>
  <p>Halo ${esc(b.customer.name)}, pembayaran Anda sudah kami terima. Berikut invoice Anda.</p>
  <table style="width:100%;border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#666;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;text-align:right;font-weight:600">${esc(v)}</td></tr>`)
    .join("")}</table>
  <p style="color:#666">Petugas akan segera ditugaskan. Pantau statusnya di Booking Saya.</p>
</div>`,
    });
  } catch (e) {
    console.error("[email] gagal menyiapkan invoice", orderId, e instanceof Error ? e.message : e);
  }
}

/** New-task email to the employee who was just assigned (SPEC 8). Never throws. */
export async function sendNewTaskEmail(idAssignment: number): Promise<void> {
  try {
    const t = await prisma.assignment.findUnique({
      where: { id_assignment: idAssignment },
      include: { staff: true, booking: { include: { service: true, slot: true } } },
    });
    if (!t) return;
    const b = t.booking;
    const rows: [string, string][] = [
      ["Kode booking", b.booking_code],
      ["Paket", `${b.service.service_name} (${b.room_count} kamar)`],
      ["Jadwal", `${dateId(b.slot.date)}, ${b.slot.start_time}–${b.slot.end_time} WIB`],
      ["Alamat", b.service_address],
      ...(b.notes ? ([["Catatan", b.notes]] as [string, string][]) : []),
    ];
    await sendEmail({
      to: t.staff.email,
      subject: `Tugas baru: ${b.booking_code}`,
      text: [`Halo ${t.staff.name},`, "", "Anda mendapat tugas baru:", "", ...rows.map(([k, v]) => `${k}: ${v}`), "", "Buka dashboard karyawan untuk detailnya."].join("\n"),
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111">
  <h2 style="margin:0 0 8px">Tugas baru</h2>
  <p>Halo ${esc(t.staff.name)}, Anda mendapat tugas baru.</p>
  <table style="width:100%;border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#666;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;text-align:right;font-weight:600">${esc(v)}</td></tr>`)
    .join("")}</table>
  <p style="color:#666">Buka dashboard karyawan untuk detailnya.</p>
</div>`,
    });
  } catch (e) {
    console.error("[email] gagal menyiapkan tugas baru", idAssignment, e instanceof Error ? e.message : e);
  }
}

/** Job-complete email to the customer after admin approval (SPEC 8). Never throws. */
export async function sendCompletedEmail(idBooking: number): Promise<void> {
  try {
    const b = await prisma.booking.findUnique({
      where: { id_booking: idBooking },
      include: { service: true, slot: true, customer: true },
    });
    if (!b || b.status !== "COMPLETED") return;
    const rows: [string, string][] = [
      ["Kode booking", b.booking_code],
      ["Paket", `${b.service.service_name} (${b.room_count} kamar)`],
      ["Jadwal", `${dateId(b.slot.date)}, ${b.slot.start_time}–${b.slot.end_time} WIB`],
      ["Alamat", b.service_address],
    ];
    await sendEmail({
      to: b.customer.email,
      subject: `Layanan selesai, kode booking ${b.booking_code}`,
      text: [`Halo ${b.customer.name},`, "", "Layanan kebersihan Anda sudah selesai dan terverifikasi.", "", ...rows.map(([k, v]) => `${k}: ${v}`), "", "Terima kasih telah memakai layanan kami."].join("\n"),
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111">
  <h2 style="margin:0 0 8px">Layanan selesai</h2>
  <p>Halo ${esc(b.customer.name)}, layanan kebersihan Anda sudah selesai dan terverifikasi.</p>
  <table style="width:100%;border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#666;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;text-align:right;font-weight:600">${esc(v)}</td></tr>`)
    .join("")}</table>
  <p style="color:#666">Terima kasih telah memakai layanan kami.</p>
</div>`,
    });
  } catch (e) {
    console.error("[email] gagal menyiapkan email selesai", idBooking, e instanceof Error ? e.message : e);
  }
}

function tableHtml(rows: [string, string][]) {
  return `<table style="width:100%;border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#666;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;text-align:right;font-weight:600">${esc(v)}</td></tr>`)
    .join("")}</table>`;
}

/** Tells the customer their cancellation request was rejected (SPEC 8). Never throws. */
export async function sendCancelRejectedEmail(idBooking: number): Promise<void> {
  try {
    const b = await prisma.booking.findUnique({ where: { id_booking: idBooking }, include: { service: true, slot: true, customer: true } });
    if (!b || !b.cancel_rejected) return;
    const rows: [string, string][] = [
      ["Kode booking", b.booking_code],
      ["Paket", `${b.service.service_name} (${b.room_count} kamar)`],
      ["Jadwal", `${dateId(b.slot.date)}, ${b.slot.start_time}–${b.slot.end_time} WIB`],
    ];
    await sendEmail({
      to: b.customer.email,
      subject: `Pengajuan pembatalan ditolak, kode booking ${b.booking_code}`,
      text: [`Halo ${b.customer.name},`, "", "Pengajuan pembatalan Anda tidak dapat kami setujui. Booking tetap berjalan sesuai jadwal.", "", ...rows.map(([k, v]) => `${k}: ${v}`), "", "Hubungi admin bila ada pertanyaan."].join("\n"),
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111">
  <h2 style="margin:0 0 8px">Pembatalan ditolak</h2>
  <p>Halo ${esc(b.customer.name)}, pengajuan pembatalan Anda tidak dapat kami setujui. Booking tetap berjalan sesuai jadwal.</p>
  ${tableHtml(rows)}
  <p style="color:#666">Hubungi admin bila ada pertanyaan.</p>
</div>`,
    });
  } catch (e) {
    console.error("[email] gagal menyiapkan email batal ditolak", idBooking, e instanceof Error ? e.message : e);
  }
}

/** Refund-succeeded email to the customer (SPEC 8). Never throws. */
export async function sendRefundEmail(idRefund: number): Promise<void> {
  try {
    const r = await prisma.refund.findUnique({
      where: { id_refund: idRefund },
      include: { payment: { include: { booking: { include: { service: true, customer: true } } } } },
    });
    if (!r || r.refund_status !== "success") return;
    const b = r.payment.booking;
    const rows: [string, string][] = [
      ["Kode booking", b.booking_code],
      ["Paket", `${b.service.service_name} (${b.room_count} kamar)`],
      ["Jumlah refund", rp(r.amount)],
    ];
    await sendEmail({
      to: b.customer.email,
      subject: `Refund diproses, kode booking ${b.booking_code}`,
      text: [`Halo ${b.customer.name},`, "", "Pembatalan Anda disetujui dan refund sudah diproses.", "", ...rows.map(([k, v]) => `${k}: ${v}`), "", "Dana dikembalikan ke metode pembayaran Anda, waktu masuk bergantung pada bank/penyedia pembayaran."].join("\n"),
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111">
  <h2 style="margin:0 0 8px">Refund diproses</h2>
  <p>Halo ${esc(b.customer.name)}, pembatalan Anda disetujui dan refund sudah diproses.</p>
  ${tableHtml(rows)}
  <p style="color:#666">Dana dikembalikan ke metode pembayaran Anda, waktu masuk bergantung pada bank/penyedia pembayaran.</p>
</div>`,
    });
  } catch (e) {
    console.error("[email] gagal menyiapkan email refund", idRefund, e instanceof Error ? e.message : e);
  }
}
