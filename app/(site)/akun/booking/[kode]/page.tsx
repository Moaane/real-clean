import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { durasiLabel } from "@/lib/katalog";
import { rp, tampilStatus, tanggalId, waktuId } from "@/lib/booking-status";
import { Alert, Button, Card, Skeleton, Stepper, StatusBadge } from "@/components/ui";
import { Timeline } from "@/components/ui/timeline";
import { IconArrowRight, IconMapPin, IconUser } from "@/components/icons";
import type { StatusBooking } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Detail booking" };

const ALUR: { status: StatusBooking; label: string }[] = [
  { status: "MENUNGGU_PEMBAYARAN", label: "Booking dibuat" },
  { status: "DIBAYAR", label: "Pembayaran diterima" },
  { status: "DITUGASKAN", label: "Petugas ditugaskan" },
  { status: "DALAM_PERJALANAN", label: "Petugas dalam perjalanan" },
  { status: "DIKERJAKAN", label: "Sedang dikerjakan" },
  { status: "MENUNGGU_VERIFIKASI", label: "Menunggu verifikasi" },
  { status: "SELESAI", label: "Selesai" },
];

function Baris({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-medium sm:text-right">{children}</dd>
    </div>
  );
}

async function Detail({ params }: { params: Promise<{ kode: string }> }) {
  await connection();
  const [{ kode }, user] = await Promise.all([params, requireRole("pelanggan")]);
  const b = await prisma.booking.findFirst({
    // Selalu dibatasi pemilik: pelanggan lain mendapat 404, bukan data.
    where: { kode_booking: kode.toUpperCase(), id_pelanggan: user.id_user },
    include: {
      layanan: true,
      slot: true,
      penugasan: { include: { karyawan: { select: { nama: true } } }, orderBy: { ditugaskan_at: "desc" }, take: 1 },
    },
  });
  if (!b) notFound();

  const status = tampilStatus(b.status, b.batas_bayar);
  const idx = ALUR.findIndex((a) => a.status === status);
  const menunggu = status === "MENUNGGU_PEMBAYARAN";
  const petugas = b.penugasan[0]?.karyawan.nama;

  return (
    <>
      {menunggu && <Stepper current={4} className="mb-8" steps={[{ label: "Layanan" }, { label: "Jadwal" }, { label: "Detail" }, { label: "Bayar" }]} />}

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-muted">Kode booking</p>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight md:text-[40px]">{b.kode_booking}</h1>
        </div>
        <StatusBadge status={status} className="self-start md:self-auto" />
      </div>

      {status === "KEDALUWARSA" && (
        <Alert tone="warn" title="Booking kedaluwarsa" className="mt-6">
          Batas pembayaran sudah lewat. Silakan buat booking baru.
        </Alert>
      )}
      {(status === "DIBATALKAN" || status === "DIREFUND") && (
        <Alert tone="danger" title="Booking dibatalkan" className="mt-6">
          {b.alasan_batal ?? "Booking ini sudah dibatalkan."}
        </Alert>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <Card className="flex flex-col gap-5">
          <h2 className="text-lg font-semibold">Progres</h2>
          {idx >= 0 ? (
            <Timeline current={idx} steps={ALUR.map((a) => ({ label: a.label }))} />
          ) : (
            <Timeline current={0} steps={[{ label: "Booking dibuat" }]} />
          )}
          {petugas && (
            <div className="flex items-center gap-4 rounded-md bg-surface-2 p-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-pill bg-primary-soft text-2xl font-extrabold text-on-primary-soft">
                {petugas.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="flex items-center gap-1.5 text-sm text-muted">
                  <IconUser size={16} /> Petugas Anda
                </p>
                <p className="font-semibold">{petugas}</p>
              </div>
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="mb-4 text-lg font-semibold">Ringkasan</h2>
            <dl className="divide-y divide-border">
              <Baris label="Paket">{b.layanan.nama_layanan}</Baris>
              <Baris label="Durasi">{durasiLabel(b.layanan.durasi_menit)}</Baris>
              <Baris label="Jadwal">
                {tanggalId(b.slot.tanggal)}, {b.slot.jam_mulai}–{b.slot.jam_selesai} WIB
              </Baris>
              <Baris label="Alamat">
                <span className="inline-flex items-start gap-1.5 sm:justify-end">
                  <IconMapPin size={16} className="mt-1 shrink-0 text-primary" />
                  <span className="text-left sm:text-right">{b.alamat_layanan}</span>
                </span>
              </Baris>
              {b.catatan && <Baris label="Catatan">{b.catatan}</Baris>}
              <Baris label="Dibuat">{waktuId(b.created_at)}</Baris>
              <Baris label="Total">
                <span className="text-lg font-bold tabular-nums">{rp(b.total_harga)}</span>
              </Baris>
            </dl>
          </Card>

          {menunggu && (
            <Card variant="section" className="flex flex-col gap-3">
              <p className="text-sm text-muted">
                Bayar sebelum <strong className="text-foreground">{waktuId(b.batas_bayar)} WIB</strong>, jika tidak
                booking akan kedaluwarsa.
              </p>
              <Button size="lg" arrow disabled className="w-full">
                Bayar sekarang
              </Button>
              <Alert tone="info">Pembayaran online sedang disiapkan dan akan segera tersedia.</Alert>
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

export default function DetailPage({ params }: { params: Promise<{ kode: string }> }) {
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
