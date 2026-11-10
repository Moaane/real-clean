import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expireOverdue } from "@/lib/kedaluwarsa";
import { durationLabel } from "@/lib/katalog";
import { rp, displayStatus, dateId, timeId } from "@/lib/booking-status";
import { Alert, Card, Skeleton, Stepper, StatusBadge } from "@/components/ui";
import { PayButton } from "@/components/pesan/bayar-button";
import { RequestCancelForm } from "@/components/akun/ajukan-batal-form";
import { requestCancellation } from "@/lib/actions/pembatalan";
import { CANCELLABLE_STATUSES } from "@/lib/pembatalan";
import { clientKey, SNAP_JS_URL } from "@/lib/midtrans";
import { Timeline } from "@/components/ui/timeline";
import { IconArrowRight, IconMapPin, IconUser } from "@/components/icons";
import type { BookingStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Detail booking" };

const STATUS_TIMELINE: { status: BookingStatus; label: string }[] = [
  { status: "PENDING_PAYMENT", label: "Booking dibuat" },
  { status: "PAID", label: "Pembayaran diterima" },
  { status: "ASSIGNED", label: "Petugas ditugaskan" },
  { status: "ON_THE_WAY", label: "Petugas dalam perjalanan" },
  { status: "IN_PROGRESS", label: "Sedang dikerjakan" },
  { status: "AWAITING_VERIFICATION", label: "Menunggu verifikasi" },
  { status: "COMPLETED", label: "Selesai" },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-medium sm:text-right">{children}</dd>
    </div>
  );
}

async function Detail({ params }: { params: Promise<{ code: string }> }) {
  await connection();
  const [{ code }, user] = await Promise.all([params, requireRole("customer")]);
  await expireOverdue();
  const b = await prisma.booking.findFirst({
    // Always scoped to the owner: other customers get a 404, not the data.
    where: { booking_code: code.toUpperCase(), id_customer: user.id_user },
    include: {
      service: true,
      slot: true,
      payment: { select: { payment_status: true, refund: { select: { refund_status: true }, orderBy: { created_at: "desc" }, take: 1 } } },
      assignment: { include: { staff: { select: { name: true } } }, orderBy: { assigned_at: "desc" }, take: 1 },
    },
  });
  if (!b) notFound();

  const status = displayStatus(b.status, b.payment_deadline);
  const idx = STATUS_TIMELINE.findIndex((a) => a.status === status);
  const awaiting = status === "PENDING_PAYMENT";
  const staffMember = b.assignment[0]?.staff.name;
  const canCancel = (CANCELLABLE_STATUSES as readonly string[]).includes(status);
  const refundStatus = b.payment?.refund[0]?.refund_status;

  return (
    <>
      {awaiting && <Stepper current={4} className="mb-8" steps={[{ label: "Layanan" }, { label: "Jadwal" }, { label: "Detail" }, { label: "Bayar" }]} />}

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-muted">Kode booking</p>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight md:text-[40px]">{b.booking_code}</h1>
        </div>
        <StatusBadge status={status} className="self-start md:self-auto" />
      </div>

      {status === "EXPIRED" && (
        <Alert tone="warn" title="Booking kedaluwarsa" className="mt-6">
          Batas pembayaran sudah lewat. Silakan buat booking baru.
        </Alert>
      )}
      {(status === "CANCELLED" || status === "REFUNDED") && (
        <Alert tone="danger" title="Booking dibatalkan" className="mt-6">
          {b.cancel_reason ?? "Booking ini sudah dibatalkan."}
          {status === "REFUNDED" || refundStatus === "success"
            ? " Dana sudah dikembalikan."
            : " Refund sedang diproses admin."}
        </Alert>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <Card className="flex flex-col gap-5">
          <h2 className="text-lg font-semibold">Progres</h2>
          {idx >= 0 ? (
            <Timeline current={idx} steps={STATUS_TIMELINE.map((a) => ({ label: a.label }))} />
          ) : (
            <Timeline current={0} steps={[{ label: "Booking dibuat" }]} />
          )}
          {staffMember && (
            <div className="flex items-center gap-4 rounded-md bg-surface-2 p-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-pill bg-primary-soft text-2xl font-extrabold text-on-primary-soft">
                {staffMember.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="flex items-center gap-1.5 text-sm text-muted">
                  <IconUser size={16} /> Petugas Anda
                </p>
                <p className="font-semibold">{staffMember}</p>
              </div>
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="mb-4 text-lg font-semibold">Ringkasan</h2>
            <dl className="divide-y divide-border">
              <Row label="Paket">{b.service.service_name}</Row>
              <Row label="Jumlah kamar">{b.room_count} kamar</Row>
              <Row label="Estimasi durasi">{durationLabel(b.duration_minutes)}</Row>
              <Row label="Jadwal">
                {dateId(b.slot.date)}, {b.slot.start_time}–{b.slot.end_time} WIB
              </Row>
              <Row label="Alamat">
                <span className="inline-flex items-start gap-1.5 sm:justify-end">
                  <IconMapPin size={16} className="mt-1 shrink-0 text-primary" />
                  <span className="text-left sm:text-right">{b.service_address}</span>
                </span>
              </Row>
              {b.notes && <Row label="Catatan">{b.notes}</Row>}
              <Row label="Dibuat">{timeId(b.created_at)}</Row>
              <Row label="Total">
                <span className="text-lg font-bold tabular-nums">{rp(b.total_price)}</span>
              </Row>
            </dl>
          </Card>

          {awaiting && (
            <Card variant="section" className="flex flex-col gap-3">
              <p className="text-sm text-muted">
                Bayar sebelum <strong className="text-foreground">{timeId(b.payment_deadline)} WIB</strong>, jika tidak
                booking akan kedaluwarsa.
              </p>
              <PayButton code={b.booking_code} clientKey={clientKey()} snapUrl={SNAP_JS_URL} />
              {b.payment?.payment_status === "pending" && (
                <Alert tone="info">
                  Status booking diperbarui setelah pembayaran Anda dikonfirmasi. Halaman ini hanya menampilkan status
                  terkini.
                </Alert>
              )}
            </Card>
          )}

          {!canCancel && b.cancel_requested_at && !b.cancel_rejected && !["CANCELLED", "REFUNDED"].includes(status) && (
            <Alert tone="warn" title="Pembatalan tidak dapat diproses">
              Petugas sudah berangkat atau pekerjaan sudah berjalan, jadi booking tidak bisa dibatalkan.
            </Alert>
          )}

          {canCancel && (
            <Card className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Pembatalan</h2>
              {b.cancel_requested_at && !b.cancel_rejected ? (
                <Alert tone="info" title="Pengajuan pembatalan menunggu keputusan admin">
                  Alasan Anda: {b.cancel_reason}
                </Alert>
              ) : b.cancel_rejected ? (
                <Alert tone="warn" title="Pengajuan pembatalan ditolak">
                  Booking tetap berjalan sesuai jadwal.
                </Alert>
              ) : (
                <>
                  <p className="text-sm text-muted">
                    Refund penuh jika diajukan minimal 24 jam sebelum jadwal. Pengajuan yang lebih mepet biasanya
                    ditolak.
                  </p>
                  <RequestCancelForm action={requestCancellation.bind(null, b.booking_code)} />
                </>
              )}
            </Card>
          )}

          <Link
            href="/akun"
            className="inline-flex items-center gap-1 self-start text-sm font-semibold text-primary-ink hover:underline"
          >
            <IconArrowRight size={16} className="rotate-180" /> Kembali ke daftar booking
          </Link>
        </div>
      </div>
    </>
  );
}

export default function DetailPage({ params }: { params: Promise<{ code: string }> }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
      <Suspense
        fallback={
          <div aria-hidden="true">
            <Skeleton className="h-12 w-72" />
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <Skeleton className="h-96 rounded-lg" />
              <Skeleton className="h-96 rounded-lg" />
            </div>
          </div>
        }
      >
        <Detail params={params} />
      </Suspense>
    </div>
  );
}
