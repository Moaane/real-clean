import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { durasiLabel } from "@/lib/katalog"
import { slotSudahMulai } from "@/lib/availability"
import { tanggalId } from "@/lib/booking-status"
import { Alert, Card, Skeleton, StatusBadge } from "@/components/ui"
import { PageHeader } from "@/components/dash/page-header"
import { AksiStatus } from "@/components/karyawan/aksi-status"
import { UnggahBukti } from "@/components/karyawan/unggah-bukti"
import { IconArrowRight } from "@/components/icons"

export const metadata: Metadata = { title: "Detail tugas" }

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
  await connection()
  const user = await requireRole("karyawan")
  const { kode } = await params
  // Filtering by id_karyawan means another employee's task is simply "not found".
  const t = await prisma.penugasan.findFirst({
    where: {
      id_karyawan: user.id_user,
      status_tugas: { not: "dibatalkan" },
      booking: { kode_booking: kode.toUpperCase() },
    },
    orderBy: { ditugaskan_at: "desc" },
    include: {
      bukti: { orderBy: { uploaded_at: "asc" }, select: { id_bukti: true } },
      booking: {
        include: {
          layanan: { select: { nama_layanan: true } },
          slot: true,
          pelanggan: { select: { nama: true, no_hp: true } },
        },
      },
    },
  })
  if (!t) notFound()
  const b = t.booking
  const sudahMulai = slotSudahMulai(b.slot.tanggal, b.slot.jam_mulai)

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="font-mono text-[24px] font-bold leading-tight tracking-tight">
          {b.kode_booking}
        </h2>
        <StatusBadge status={b.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Detail tugas</h3>
          <dl className="divide-y divide-border">
            <Baris label="Paket">{b.layanan.nama_layanan}</Baris>
            <Baris label="Jumlah kamar">{b.jumlah_kamar} kamar</Baris>
            <Baris label="Estimasi durasi">{durasiLabel(b.durasi_menit)}</Baris>
            <Baris label="Jadwal">
              {tanggalId(b.slot.tanggal)}, {b.slot.jam_mulai}–
              {b.slot.jam_selesai} WIB
            </Baris>
            <Baris label="Alamat">{b.alamat_layanan}</Baris>
            <Baris label="Catatan pelanggan">{b.catatan ?? "-"}</Baris>
            <Baris label="Pelanggan">{b.pelanggan.nama}</Baris>
            <Baris label="Nomor HP">{b.pelanggan.no_hp}</Baris>
          </dl>
        </Card>

        <Card className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Pengerjaan</h3>
          {t.status_tugas === "revisi" && t.catatan_revisi && (
            <Alert tone="warn" title="Catatan revisi dari admin">
              {t.catatan_revisi}
            </Alert>
          )}
          {b.status === "DITUGASKAN" &&
            (sudahMulai ? (
              <AksiStatus
                idPenugasan={t.id_penugasan}
                ke="DALAM_PERJALANAN"
                label="Berangkat ke lokasi"
              />
            ) : (
              <Alert tone="info">
                Belum waktunya berangkat. Tombol aktif mulai jam{" "}
                {b.slot.jam_mulai} WIB sesuai jadwal.
              </Alert>
            ))}
          {b.status === "DALAM_PERJALANAN" &&
            (sudahMulai ? (
              <AksiStatus
                idPenugasan={t.id_penugasan}
                ke="DIKERJAKAN"
                label="Tiba dan mulai mengerjakan"
              />
            ) : (
              <Alert tone="info">
                Pengerjaan baru bisa dimulai pada jam {b.slot.jam_mulai} WIB
                sesuai jadwal.
              </Alert>
            ))}
          {b.status === "DIKERJAKAN" &&
            (sudahMulai ? (
              <UnggahBukti idPenugasan={t.id_penugasan} />
            ) : (
              <Alert tone="info">
                Pekerjaan belum bisa diselesaikan sebelum jadwal dimulai (
                {b.slot.jam_mulai} WIB).
              </Alert>
            ))}
          {b.status === "MENUNGGU_VERIFIKASI" && (
            <p className="text-sm text-muted">
              Bukti sudah diunggah, menunggu verifikasi admin.
            </p>
          )}
          {b.status === "SELESAI" && (
            <p className="text-sm text-muted">Tugas ini sudah selesai.</p>
          )}
          {(b.status === "DIBATALKAN" || b.status === "DIREFUND") && (
            <p className="text-sm text-muted">Booking ini dibatalkan.</p>
          )}

          {t.bukti.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Foto bukti</p>
              <div className="grid grid-cols-3 gap-2">
                {t.bukti.map((f) => (
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
  params: Promise<{ kode: string }>
}) {
  return (
    <>
      <PageHeader title="Detail" accent="tugas" />
      <Suspense fallback={<Skeleton className="h-48 rounded-lg" />}>
        <Isi params={params} />
      </Suspense>
    </>
  )
}
