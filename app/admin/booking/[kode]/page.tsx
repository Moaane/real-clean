import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dynamic, Dyn } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { kedaluwarsakanLewatBatas } from "@/lib/kedaluwarsa";
import { karyawanKosong } from "@/lib/penugasan";
import { tugaskan } from "@/lib/actions/booking-admin";
import { durasiLabel } from "@/lib/katalog";
import { rp, tanggalId, waktuId } from "@/lib/booking-status";
import { Alert, Card, StatusBadge } from "@/components/ui";
import { TugaskanForm } from "@/components/admin/tugaskan-form";
import { PageHeader } from "@/components/dash/page-header";
import { IconArrowRight } from "@/components/icons";

export const metadata: Metadata = { title: "Detail booking" };

function Baris({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-medium sm:text-right">{children}</dd>
    </div>
  );
}

async function Isi({ params }: { params: Promise<{ kode: string }> }) {
  await dynamic();
  await kedaluwarsakanLewatBatas();
  const { kode } = await params;
  const b = await prisma.booking.findUnique({
    where: { kode_booking: kode.toUpperCase() },
    include: {
      layanan: true,
      slot: true,
      pelanggan: { select: { nama: true, email: true, no_hp: true } },
      pembayaran: true,
      penugasan: { include: { karyawan: { select: { nama: true, no_hp: true } } }, orderBy: { ditugaskan_at: "desc" }, take: 1 },
    },
  });
  if (!b) notFound();

  const kosong =
    b.status === "DIBAYAR"
      ? await karyawanKosong(prisma, {
          id_booking: b.id_booking,
          id_slot: b.id_slot,
          tanggal: b.slot.tanggal,
          jam_mulai: b.slot.jam_mulai,
          jam_selesai: b.slot.jam_selesai,
        })
      : [];
  const tugas = b.penugasan[0];

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-[28px] font-bold leading-tight tracking-tight">{b.kode_booking}</h2>
        <StatusBadge status={b.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Ringkasan</h3>
          <dl className="divide-y divide-border">
            <Baris label="Pelanggan">{b.pelanggan.nama}</Baris>
            <Baris label="Email">{b.pelanggan.email}</Baris>
            <Baris label="No. HP">{b.pelanggan.no_hp ?? "-"}</Baris>
            <Baris label="Paket">{b.layanan.nama_layanan}</Baris>
            <Baris label="Jumlah kamar">{b.jumlah_kamar} kamar</Baris>
            <Baris label="Estimasi durasi">{durasiLabel(b.durasi_menit)}</Baris>
            <Baris label="Rincian harga">
              {rp(b.harga_dasar)} + {b.jumlah_kamar} × {rp(b.harga_per_kamar)}
            </Baris>
            <Baris label="Jadwal">
              {tanggalId(b.slot.tanggal)}, {b.slot.jam_mulai}–{b.slot.jam_selesai} WIB
            </Baris>
            <Baris label="Alamat">{b.alamat_layanan}</Baris>
            {b.catatan && <Baris label="Catatan">{b.catatan}</Baris>}
            <Baris label="Dibuat">{waktuId(b.created_at)}</Baris>
            <Baris label="Total">
              <span className="text-lg font-bold tabular-nums">{rp(b.total_harga)}</span>
            </Baris>
            {b.pembayaran && (
              <>
                <Baris label="Pembayaran">{b.pembayaran.status_bayar}</Baris>
                <Baris label="Metode">{b.pembayaran.metode_bayar ?? "-"}</Baris>
                <Baris label="Order ID">{b.pembayaran.order_id}</Baris>
              </>
            )}
          </dl>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold">Penugasan</h3>
          {tugas && (
            <p className="mb-4 text-sm">
              Ditugaskan ke <strong>{tugas.karyawan.nama}</strong>
              {tugas.karyawan.no_hp ? ` (${tugas.karyawan.no_hp})` : ""} pada {waktuId(tugas.ditugaskan_at)} WIB.
            </p>
          )}
          {b.status === "DIBAYAR" ? (
            kosong.length === 0 ? (
              <Alert tone="warn" title="Tidak ada karyawan yang kosong">
                Semua karyawan aktif bentrok dengan jadwal {b.slot.jam_mulai}–{b.slot.jam_selesai} pada tanggal ini.
              </Alert>
            ) : (
              <TugaskanForm action={tugaskan.bind(null, b.id_booking)} karyawan={kosong} />
            )
          ) : (
            !tugas && <p className="text-sm text-muted">Booking ini belum bisa ditugaskan (status bukan Dibayar).</p>
          )}
        </Card>
      </div>

      <Link href="/admin/booking" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary-ink hover:underline">
        <IconArrowRight size={16} className="rotate-180" /> Kembali ke daftar booking
      </Link>
    </>
  );
}

export default function Page({ params }: { params: Promise<{ kode: string }> }) {
  return (
    <>
      <PageHeader title="Detail" accent="booking" />
      <Dyn>
        <Isi params={params} />
      </Dyn>
    </>
  );
}
