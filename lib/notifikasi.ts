import { rp, tanggalId, waktuId } from "./booking-status";
import { esc, kirimEmail } from "./email";
import { prisma } from "./prisma";

/**
 * Invoice + booking code for a booking that just became DIBAYAR (SPEC 8).
 * Everything shown comes from the database. Never throws.
 */
export async function kirimEmailInvoice(orderId: string): Promise<void> {
  try {
    const p = await prisma.pembayaran.findUnique({
      where: { order_id: orderId },
      include: { booking: { include: { layanan: true, slot: true, pelanggan: true } } },
    });
    if (!p || p.booking.status !== "DIBAYAR") return;
    const b = p.booking;

    const jadwal = `${tanggalId(b.slot.tanggal)}, ${b.slot.jam_mulai}–${b.slot.jam_selesai} WIB`;
    const dibayar = p.waktu_bayar ? waktuId(p.waktu_bayar) + " WIB" : "-";
    const rows: [string, string][] = [
      ["Kode booking", b.kode_booking],
      ["Paket", b.layanan.nama_layanan],
      ["Jumlah kamar", `${b.jumlah_kamar} kamar`],
      ["Jadwal", jadwal],
      ["Alamat", b.alamat_layanan],
      ["Metode bayar", p.metode_bayar ?? "-"],
      ["Waktu bayar", dibayar],
      ["Total dibayar", rp(p.jumlah)],
    ];

    await kirimEmail({
      to: b.pelanggan.email,
      subject: `Pembayaran diterima, kode booking ${b.kode_booking}`,
      text: [`Halo ${b.pelanggan.nama},`, "", "Pembayaran Anda sudah kami terima. Berikut invoice Anda:", "", ...rows.map(([k, v]) => `${k}: ${v}`), "", "Petugas akan segera ditugaskan. Pantau statusnya di Booking Saya.", "Terima kasih."].join("\n"),
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111">
  <h2 style="margin:0 0 8px">Pembayaran diterima</h2>
  <p>Halo ${esc(b.pelanggan.nama)}, pembayaran Anda sudah kami terima. Berikut invoice Anda.</p>
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
export async function kirimEmailTugasBaru(idPenugasan: number): Promise<void> {
  try {
    const t = await prisma.penugasan.findUnique({
      where: { id_penugasan: idPenugasan },
      include: { karyawan: true, booking: { include: { layanan: true, slot: true } } },
    });
    if (!t) return;
    const b = t.booking;
    const rows: [string, string][] = [
      ["Kode booking", b.kode_booking],
      ["Paket", `${b.layanan.nama_layanan} (${b.jumlah_kamar} kamar)`],
      ["Jadwal", `${tanggalId(b.slot.tanggal)}, ${b.slot.jam_mulai}–${b.slot.jam_selesai} WIB`],
      ["Alamat", b.alamat_layanan],
      ...(b.catatan ? ([["Catatan", b.catatan]] as [string, string][]) : []),
    ];
    await kirimEmail({
      to: t.karyawan.email,
      subject: `Tugas baru: ${b.kode_booking}`,
      text: [`Halo ${t.karyawan.nama},`, "", "Anda mendapat tugas baru:", "", ...rows.map(([k, v]) => `${k}: ${v}`), "", "Buka dashboard karyawan untuk detailnya."].join("\n"),
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111">
  <h2 style="margin:0 0 8px">Tugas baru</h2>
  <p>Halo ${esc(t.karyawan.nama)}, Anda mendapat tugas baru.</p>
  <table style="width:100%;border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#666;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;text-align:right;font-weight:600">${esc(v)}</td></tr>`)
    .join("")}</table>
  <p style="color:#666">Buka dashboard karyawan untuk detailnya.</p>
</div>`,
    });
  } catch (e) {
    console.error("[email] gagal menyiapkan tugas baru", idPenugasan, e instanceof Error ? e.message : e);
  }
}

/** Job-complete email to the customer after admin approval (SPEC 8). Never throws. */
export async function kirimEmailSelesai(idBooking: number): Promise<void> {
  try {
    const b = await prisma.booking.findUnique({
      where: { id_booking: idBooking },
      include: { layanan: true, slot: true, pelanggan: true },
    });
    if (!b || b.status !== "SELESAI") return;
    const rows: [string, string][] = [
      ["Kode booking", b.kode_booking],
      ["Paket", `${b.layanan.nama_layanan} (${b.jumlah_kamar} kamar)`],
      ["Jadwal", `${tanggalId(b.slot.tanggal)}, ${b.slot.jam_mulai}–${b.slot.jam_selesai} WIB`],
      ["Alamat", b.alamat_layanan],
    ];
    await kirimEmail({
      to: b.pelanggan.email,
      subject: `Layanan selesai, kode booking ${b.kode_booking}`,
      text: [`Halo ${b.pelanggan.nama},`, "", "Layanan kebersihan Anda sudah selesai dan terverifikasi.", "", ...rows.map(([k, v]) => `${k}: ${v}`), "", "Terima kasih telah memakai layanan kami."].join("\n"),
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111">
  <h2 style="margin:0 0 8px">Layanan selesai</h2>
  <p>Halo ${esc(b.pelanggan.nama)}, layanan kebersihan Anda sudah selesai dan terverifikasi.</p>
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
