import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { kedaluwarsakanLewatBatas } from "@/lib/kedaluwarsa";
import { rp, tampilStatus, tanggalId } from "@/lib/booking-status";
import { ButtonLink, Card, EmptyState, SectionHeading, Skeleton, StatusBadge } from "@/components/ui";
import { IconCalendar, IconChevronRight, IconReceipt } from "@/components/icons";

export const metadata: Metadata = { title: "Booking saya" };

async function Daftar() {
  await connection();
  const user = await requireRole("pelanggan");
  await kedaluwarsakanLewatBatas();
  const list = await prisma.booking.findMany({
    where: { id_pelanggan: user.id_user },
    include: { layanan: true, slot: true },
    orderBy: { created_at: "desc" },
  });

  if (list.length === 0) {
    return (
      <EmptyState
        className="mt-10"
        icon={IconReceipt}
        title="Anda belum punya booking. Pilih paket dan jadwal untuk memulai."
        action={
          <ButtonLink href="/pesan" arrow>
            Pesan sekarang
          </ButtonLink>
        }
      />
    );
  }

  return (
    <ul className="mt-8 flex flex-col gap-3 md:mt-10 md:gap-4">
      {list.map((b) => (
        <li key={b.id_booking}>
          <Link href={`/akun/booking/${b.kode_booking}`} className="group block rounded-lg">
            <Card
              variant="interactive"
              className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6"
            >
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold tracking-wide text-muted">{b.kode_booking}</p>
                <h2 className="text-lg font-semibold group-hover:text-primary-ink">{b.layanan.nama_layanan}</h2>
                <p className="flex items-center gap-1.5 text-sm text-muted">
                  <IconCalendar size={16} />
                  {tanggalId(b.slot.tanggal)}, {b.slot.jam_mulai}–{b.slot.jam_selesai}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 md:justify-end">
                <StatusBadge status={tampilStatus(b.status, b.batas_bayar)} />
                <p className="font-bold tabular-nums">{rp(b.total_harga)}</p>
                <IconChevronRight size={20} className="hidden text-muted md:block" />
              </div>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function AkunPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
      <SectionHeading as="h1" accent="Booking" after="saya">
        <ButtonLink href="/pesan" arrow className="self-start md:self-end">
          Pesan baru
        </ButtonLink>
      </SectionHeading>
      <Suspense
        fallback={
          <div className="mt-8 flex flex-col gap-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        }
      >
        <Daftar />
      </Suspense>
    </div>
  );
}
