import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { durationLabel } from "@/lib/katalog"
import { slotStarted } from "@/lib/availability"
import { dateId } from "@/lib/booking-status"
import { Alert, Card, Skeleton, StatusBadge } from "@/components/ui"
import { PageHeader } from "@/components/dash/page-header"
import { StatusActions } from "@/components/karyawan/aksi-status"
import { UploadProof } from "@/components/karyawan/unggah-bukti"
import { IconArrowRight } from "@/components/icons"

export const metadata: Metadata = { title: "Detail tugas" }

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
  await connection()
  const user = await requireRole("staff")
  const { code } = await params
  // Filtering by id_staff means another employee's task is simply "not found".
  const t = await prisma.assignment.findFirst({
    where: {
      id_staff: user.id_user,
      task_status: { not: "cancelled" },
      booking: { booking_code: code.toUpperCase() },
    },
    orderBy: { assigned_at: "desc" },
    include: {
      proof: { orderBy: { uploaded_at: "asc" }, select: { id_proof: true } },
      booking: {
        include: {
          service: { select: { service_name: true } },
          slot: true,
          customer: { select: { name: true, phone: true } },
        },
      },
    },
  })
  if (!t) notFound()
  const b = t.booking
  const hasStarted = slotStarted(b.slot.date, b.slot.start_time)

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="font-mono text-[24px] font-bold leading-tight tracking-tight">
          {b.booking_code}
        </h2>
        <StatusBadge status={b.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Detail tugas</h3>
          <dl className="divide-y divide-border">
            <Row label="Paket">{b.service.service_name}</Row>
            <Row label="Jumlah kamar">{b.room_count} kamar</Row>
            <Row label="Estimasi durasi">{durationLabel(b.duration_minutes)}</Row>
            <Row label="Jadwal">
              {dateId(b.slot.date)}, {b.slot.start_time}–
              {b.slot.end_time} WIB
            </Row>
            <Row label="Alamat">{b.service_address}</Row>
            <Row label="Catatan pelanggan">{b.notes ?? "-"}</Row>
            <Row label="Pelanggan">{b.customer.name}</Row>
            <Row label="Nomor HP">{b.customer.phone}</Row>
          </dl>
        </Card>

        <Card className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Pengerjaan</h3>
          {t.task_status === "revision" && t.revision_notes && (
            <Alert tone="warn" title="Catatan revisi dari admin">
              {t.revision_notes}
            </Alert>
          )}
          {b.status === "ASSIGNED" &&
            (hasStarted ? (
              <StatusActions
                idAssignment={t.id_assignment}
                toStatus="ON_THE_WAY"
                label="Berangkat ke lokasi"
              />
            ) : (
              <Alert tone="info">
                Belum waktunya berangkat. Tombol aktif mulai jam{" "}
                {b.slot.start_time} WIB sesuai jadwal.
              </Alert>
            ))}
          {b.status === "ON_THE_WAY" &&
            (hasStarted ? (
              <StatusActions
                idAssignment={t.id_assignment}
                toStatus="IN_PROGRESS"
                label="Tiba dan mulai mengerjakan"
              />
            ) : (
              <Alert tone="info">
                Pengerjaan baru bisa dimulai pada jam {b.slot.start_time} WIB
                sesuai jadwal.
              </Alert>
            ))}
          {b.status === "IN_PROGRESS" &&
            (hasStarted ? (
              <UploadProof idAssignment={t.id_assignment} />
            ) : (
              <Alert tone="info">
                Pekerjaan belum bisa diselesaikan sebelum jadwal dimulai (
                {b.slot.start_time} WIB).
              </Alert>
            ))}
          {b.status === "AWAITING_VERIFICATION" && (
            <p className="text-sm text-muted">
              Bukti sudah diunggah, menunggu verifikasi admin.
            </p>
          )}
          {b.status === "COMPLETED" && (
            <p className="text-sm text-muted">Tugas ini sudah selesai.</p>
          )}
          {(b.status === "CANCELLED" || b.status === "REFUNDED") && (
            <p className="text-sm text-muted">Booking ini dibatalkan.</p>
          )}

          {t.proof.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Foto bukti</p>
              <div className="grid grid-cols-3 gap-2">
                {t.proof.map((f) => (
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
                      sizes="160px"
                      className="object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Link
        href="/karyawan"
        className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary-ink hover:underline"
      >
        <IconArrowRight size={16} className="rotate-180" /> Kembali ke daftar
        tugas
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
      <PageHeader title="Detail" accent="tugas" />
      <Suspense fallback={<Skeleton className="h-48 rounded-lg" />}>
        <Content params={params} />
      </Suspense>
    </>
  )
}
