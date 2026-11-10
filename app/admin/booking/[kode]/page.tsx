import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { dynamic, Dyn } from "@/components/admin/ui"
import { prisma } from "@/lib/prisma"
import { kedaluwarsakanLewatBatas } from "@/lib/kedaluwarsa"
import { karyawanKosong } from "@/lib/penugasan"
import {
  mintaRevisi,
  setujuiHasil,
  tugaskan,
} from "@/lib/actions/booking-admin"
import { durasiLabel } from "@/lib/katalog"
import { rp, STATUS_LABEL, tanggalId, waktuId } from "@/lib/booking-status"
import { Alert, Card, StatusBadge } from "@/components/ui"
import Image from "next/image"
import { VerifikasiPanel } from "@/components/admin/verifikasi-panel"
import { PembatalanPanel } from "@/components/admin/pembatalan-panel"
import { setujuiPembatalan, tolakPembatalan } from "@/lib/actions/pembatalan"
import { memenuhiSyaratRefund, STATUS_BISA_BATAL } from "@/lib/pembatalan"
import { TugaskanForm } from "@/components/admin/tugaskan-form"
import { PageHeader } from "@/components/dash/page-header"
import { IconArrowRight } from "@/components/icons"

export const metadata: Metadata = { title: "Detail booking" }

function Baris({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-medium sm:text-right">{children}</dd>
    </div>
  )
}

async function Isi({ params }: { params: Promise<{ kode: string }> }) {
  await dynamic()
  await kedaluwarsakanLewatBatas()
  const { kode } = await params
  const b = await prisma.booking.findUnique({
    where: { kode_booking: kode.toUpperCase() },
    include: {
      layanan: true,
      slot: true,
      pelanggan: { select: { nama: true, email: true, no_hp: true } },
      pembayaran: { include: { refund: { orderBy: { created_at: "desc" }, take: 1 } } },
      penugasan: {
        include: {
          karyawan: { select: { nama: true } },
          bukti: { orderBy: { uploaded_at: "asc" } },
        },
        orderBy: { ditugaskan_at: "desc" },
        take: 1,
      },
    },
  })
  if (!b) notFound()

  const kosong =
    b.status === "DIBAYAR"
      ? await karyawanKosong(prisma, {
          id_booking: b.id_booking,
          id_slot: b.id_slot,
          tanggal: b.slot.tanggal,
          jam_mulai: b.slot.jam_mulai,
          jam_selesai: b.slot.jam_selesai,
        })
      : []
  const tugas = b.penugasan[0]
  const refund = b.pembayaran?.refund[0]
  const batalMenunggu =
    b.batal_diajukan_at !== null &&
    !b.batal_ditolak &&
    (STATUS_BISA_BATAL as readonly string[]).includes(b.status)
  const syaratRefund = b.batal_diajukan_at
    ? memenuhiSyaratRefund(b.slot.tanggal, b.slot.jam_mulai, b.batal_diajukan_at)
    : false

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-[28px] font-bold leading-tight tracking-tight">
          {b.kode_booking}
        </h2>
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
              {tanggalId(b.slot.tanggal)}, {b.slot.jam_mulai}–
              {b.slot.jam_selesai} WIB
            </Baris>
            <Baris label="Alamat">{b.alamat_layanan}</Baris>
            {b.catatan && <Baris label="Catatan">{b.catatan}</Baris>}
            <Baris label="Dibuat">{waktuId(b.created_at)}</Baris>
            <Baris label="Total">
              <span className="text-lg font-bold tabular-nums">
                {rp(b.total_harga)}
              </span>
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
              Ditugaskan ke <strong>{tugas.karyawan.nama}</strong> pada{" "}
              {waktuId(tugas.ditugaskan_at)} WIB.
            </p>
          )}
          {b.status === "DIBAYAR" ? (
            kosong.length === 0 ? (
              <Alert tone="warn" title="Tidak ada karyawan yang kosong">
                Semua karyawan aktif bentrok dengan jadwal {b.slot.jam_mulai}–
                {b.slot.jam_selesai} pada tanggal ini.
              </Alert>
            ) : (
              <TugaskanForm
                action={tugaskan.bind(null, b.id_booking)}
                karyawan={kosong}
              />
            )
          ) : (
            !tugas && (
              <p className="text-sm text-muted">
                Booking ini belum bisa ditugaskan (status bukan Dibayar).
              </p>
            )
          )}
          {tugas?.status_tugas === "revisi" && tugas.catatan_revisi && (
            <Alert tone="warn" title="Revisi diminta">
              {tugas.catatan_revisi}
            </Alert>
          )}
        </Card>

        {b.batal_diajukan_at && (
          <Card className="lg:col-span-2">
            <h3 className="mb-4 text-lg font-semibold">Pembatalan dan refund</h3>
            <dl className="divide-y divide-border">
              <Baris label="Diajukan">{waktuId(b.batal_diajukan_at)} WIB</Baris>
              <Baris label="Alasan pelanggan">{b.alasan_batal}</Baris>
              <Baris label="Syarat refund (≥ 24 jam sebelum jadwal)">
                {syaratRefund ? "Memenuhi syarat" : "Tidak memenuhi syarat"}
              </Baris>
              {b.batal_ditolak && <Baris label="Keputusan">Ditolak</Baris>}
              {refund && (
                <>
                  <Baris label="Refund">
                    {rp(refund.jumlah)}, {refund.status_refund}
                  </Baris>
                  {refund.pesan_gagal && (
                    <Baris label="Alasan gagal">{refund.pesan_gagal}</Baris>
                  )}
                </>
              )}
            </dl>
            {batalMenunggu && (
              <div className="mt-6 border-t border-border pt-6">
                {!syaratRefund && (
                  <Alert tone="warn" title="Tidak memenuhi syarat" className="mb-4">
                    Pengajuan dibuat kurang dari 24 jam sebelum jadwal.
                  </Alert>
                )}
                <PembatalanPanel
                  setujui={setujuiPembatalan.bind(null, b.id_booking)}
                  tolak={tolakPembatalan.bind(null, b.id_booking)}
                />
              </div>
            )}
            {b.batal_diajukan_at &&
              !b.batal_ditolak &&
              !batalMenunggu &&
              !refund && (
                <Alert tone="warn" title="Tidak bisa dibatalkan lagi" className="mt-4">
                  Petugas sudah berangkat atau pekerjaan sudah berjalan (
                  {STATUS_LABEL[b.status]}), jadi pengajuan batal tidak bisa
                  disetujui.
                </Alert>
              )}
            {refund?.status_refund === "gagal" && (
              <Alert tone="danger" title="Refund gagal" className="mt-4">
                Booking tetap Dibatalkan. Proses pengembalian dana secara manual
                lewat dashboard Midtrans.
              </Alert>
            )}
          </Card>
        )}

        {tugas && tugas.bukti.length > 0 && (
          <Card className="lg:col-span-2">
            <h3 className="mb-4 text-lg font-semibold">Foto bukti kerja</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {tugas.bukti.map((f) => (
                <a
                  key={f.id_bukti}
                  href={`/api/bukti/${f.id_bukti}`}
                  target="_blank"
                  rel="noreferrer"
                  className="relative aspect-square overflow-hidden rounded-md bg-surface-2"
                >
                  <Image
                    src={`/api/bukti/${f.id_bukti}`}
                    alt="Foto bukti kerja"
                    fill
                    unoptimized
                    sizes="240px"
                    className="object-cover"
                  />
                </a>
              ))}
            </div>
            {tugas.bukti.some((f) => f.keterangan) && (
              <p className="mt-3 text-sm text-muted">
                Keterangan karyawan:{" "}
                {tugas.bukti.findLast((f) => f.keterangan)?.keterangan}
              </p>
            )}
            {b.status === "MENUNGGU_VERIFIKASI" && (
              <div className="mt-6 border-t border-border pt-6">
                <h4 className="mb-3 font-semibold">Verifikasi hasil</h4>
                <VerifikasiPanel
                  setujui={setujuiHasil.bind(null, b.id_booking)}
                  revisi={mintaRevisi.bind(null, b.id_booking)}
                />
              </div>
            )}
          </Card>
        )}
      </div>

      <Link
        href="/admin/booking"
        className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary-ink hover:underline"
      >
        <IconArrowRight size={16} className="rotate-180" /> Kembali ke daftar
        booking
      </Link>
    </>
  )
}

export default function Page({
  params,
}: {
  params: Promise<{ kode: string }>
}) {
  return (
    <>
      <PageHeader title="Detail" accent="booking" />
      <Dyn>
        <Isi params={params} />
      </Dyn>
    </>
  )
}
