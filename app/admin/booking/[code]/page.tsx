import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { dynamic, Dyn } from "@/components/admin/ui"
import { prisma } from "@/lib/prisma"
import { expireOverdue } from "@/lib/kedaluwarsa"
import { findAvailableStaff } from "@/lib/penugasan"
import {
  requestRevision,
  approveResult,
  assign,
} from "@/lib/actions/booking-admin"
import { durationLabel } from "@/lib/katalog"
import { rp, STATUS_LABEL, dateId, timeId } from "@/lib/booking-status"
import { Alert, Card, StatusBadge } from "@/components/ui"
import Image from "next/image"
import { VerificationPanel } from "@/components/admin/verifikasi-panel"
import { CancellationPanel } from "@/components/admin/pembatalan-panel"
import { approveCancellation, rejectCancellation } from "@/lib/actions/pembatalan"
import { isRefundEligible, CANCELLABLE_STATUSES } from "@/lib/pembatalan"
import { AssignForm } from "@/components/admin/tugaskan-form"
import { PageHeader } from "@/components/dash/page-header"
import { IconArrowRight } from "@/components/icons"

export const metadata: Metadata = { title: "Detail booking" }

function Row({
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

async function Content({ params }: { params: Promise<{ code: string }> }) {
  await dynamic()
  await expireOverdue()
  const { code } = await params
  const b = await prisma.booking.findUnique({
    where: { booking_code: code.toUpperCase() },
    include: {
      service: true,
      slot: true,
      customer: { select: { name: true, email: true, phone: true } },
      payment: { include: { refund: { orderBy: { created_at: "desc" }, take: 1 } } },
      assignment: {
        include: {
          staff: { select: { name: true } },
          proof: { orderBy: { uploaded_at: "asc" } },
        },
        orderBy: { assigned_at: "desc" },
        take: 1,
      },
    },
  })
  if (!b) notFound()

  const empty =
    b.status === "PAID"
      ? await findAvailableStaff(prisma, {
          id_booking: b.id_booking,
          id_slot: b.id_slot,
          date: b.slot.date,
          start_time: b.slot.start_time,
          end_time: b.slot.end_time,
        })
      : []
  const task = b.assignment[0]
  const refund = b.payment?.refund[0]
  const pendingCancellations =
    b.cancel_requested_at !== null &&
    !b.cancel_rejected &&
    (CANCELLABLE_STATUSES as readonly string[]).includes(b.status)
  const refundEligibility = b.cancel_requested_at
    ? isRefundEligible(b.slot.date, b.slot.start_time, b.cancel_requested_at)
    : false

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-[28px] font-bold leading-tight tracking-tight">
          {b.booking_code}
        </h2>
        <StatusBadge status={b.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Ringkasan</h3>
          <dl className="divide-y divide-border">
            <Row label="Pelanggan">{b.customer.name}</Row>
            <Row label="Email">{b.customer.email}</Row>
            <Row label="No. HP">{b.customer.phone ?? "-"}</Row>
            <Row label="Paket">{b.service.service_name}</Row>
            <Row label="Jumlah kamar">{b.room_count} kamar</Row>
            <Row label="Estimasi durasi">{durationLabel(b.duration_minutes)}</Row>
            <Row label="Rincian harga">
              {rp(b.base_price)} + {b.room_count} × {rp(b.price_per_room)}
            </Row>
            <Row label="Jadwal">
              {dateId(b.slot.date)}, {b.slot.start_time}–
              {b.slot.end_time} WIB
            </Row>
            <Row label="Alamat">{b.service_address}</Row>
            {b.notes && <Row label="Catatan">{b.notes}</Row>}
            <Row label="Dibuat">{timeId(b.created_at)}</Row>
            <Row label="Total">
              <span className="text-lg font-bold tabular-nums">
                {rp(b.total_price)}
              </span>
            </Row>
            {b.payment && (
              <>
                <Row label="Pembayaran">{b.payment.payment_status}</Row>
                <Row label="Metode">{b.payment.payment_method ?? "-"}</Row>
                <Row label="Order ID">{b.payment.order_id}</Row>
              </>
            )}
          </dl>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold">Penugasan</h3>
          {task && (
            <p className="mb-4 text-sm">
              Ditugaskan ke <strong>{task.staff.name}</strong> pada{" "}
              {timeId(task.assigned_at)} WIB.
            </p>
          )}
          {b.status === "PAID" ? (
            empty.length === 0 ? (
              <Alert tone="warn" title="Tidak ada karyawan yang kosong">
                Semua karyawan aktif bentrok dengan jadwal {b.slot.start_time}–
                {b.slot.end_time} pada tanggal ini.
              </Alert>
            ) : (
              <AssignForm
                action={assign.bind(null, b.id_booking)}
                staff={empty}
              />
            )
          ) : (
            !task && (
              <p className="text-sm text-muted">
                Booking ini belum bisa ditugaskan (status bukan Dibayar).
              </p>
            )
          )}
          {task?.task_status === "revision" && task.revision_notes && (
            <Alert tone="warn" title="Revisi diminta">
              {task.revision_notes}
            </Alert>
          )}
        </Card>

        {b.cancel_requested_at && (
          <Card className="lg:col-span-2">
            <h3 className="mb-4 text-lg font-semibold">Pembatalan dan refund</h3>
            <dl className="divide-y divide-border">
              <Row label="Diajukan">{timeId(b.cancel_requested_at)} WIB</Row>
              <Row label="Alasan pelanggan">{b.cancel_reason}</Row>
              <Row label="Syarat refund (≥ 24 jam sebelum jadwal)">
                {refundEligibility ? "Memenuhi syarat" : "Tidak memenuhi syarat"}
              </Row>
              {b.cancel_rejected && <Row label="Keputusan">Ditolak</Row>}
              {refund && (
                <>
                  <Row label="Refund">
                    {rp(refund.amount)}, {refund.refund_status}
                  </Row>
                  {refund.failure_message && (
                    <Row label="Alasan gagal">{refund.failure_message}</Row>
                  )}
                </>
              )}
            </dl>
            {pendingCancellations && (
              <div className="mt-6 border-t border-border pt-6">
                {!refundEligibility && (
                  <Alert tone="warn" title="Tidak memenuhi syarat" className="mb-4">
                    Pengajuan dibuat kurang dari 24 jam sebelum jadwal.
                  </Alert>
                )}
                <CancellationPanel
                  approve={approveCancellation.bind(null, b.id_booking)}
                  reject={rejectCancellation.bind(null, b.id_booking)}
                />
              </div>
            )}
            {b.cancel_requested_at &&
              !b.cancel_rejected &&
              !pendingCancellations &&
              !refund && (
                <Alert tone="warn" title="Tidak bisa dibatalkan lagi" className="mt-4">
                  Petugas sudah berangkat atau pekerjaan sudah berjalan (
                  {STATUS_LABEL[b.status]}), jadi pengajuan batal tidak bisa
                  disetujui.
                </Alert>
              )}
            {refund?.refund_status === "failed" && (
              <Alert tone="danger" title="Refund gagal" className="mt-4">
                Booking tetap Dibatalkan. Proses pengembalian dana secara manual
                lewat dashboard Midtrans.
              </Alert>
            )}
          </Card>
        )}

        {task && task.proof.length > 0 && (
          <Card className="lg:col-span-2">
            <h3 className="mb-4 text-lg font-semibold">Foto bukti kerja</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {task.proof.map((f) => (
                <a
                  key={f.id_proof}
                  href={`/api/bukti/${f.id_proof}`}
                  target="_blank"
                  rel="noreferrer"
                  className="relative aspect-square overflow-hidden rounded-md bg-surface-2"
                >
                  <Image
                    src={`/api/bukti/${f.id_proof}`}
                    alt="Foto bukti kerja"
                    fill
                    unoptimized
                    sizes="240px"
                    className="object-cover"
                  />
                </a>
              ))}
            </div>
            {task.proof.some((f) => f.remarks) && (
              <p className="mt-3 text-sm text-muted">
                Keterangan karyawan:{" "}
                {task.proof.findLast((f) => f.remarks)?.remarks}
              </p>
            )}
            {b.status === "AWAITING_VERIFICATION" && (
              <div className="mt-6 border-t border-border pt-6">
                <h4 className="mb-3 font-semibold">Verifikasi hasil</h4>
                <VerificationPanel
                  approve={approveResult.bind(null, b.id_booking)}
                  revision={requestRevision.bind(null, b.id_booking)}
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
  params: Promise<{ code: string }>
}) {
  return (
    <>
      <PageHeader title="Detail" accent="booking" />
      <Dyn>
        <Content params={params} />
      </Dyn>
    </>
  )
}
