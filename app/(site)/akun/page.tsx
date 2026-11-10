import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expireOverdue } from "@/lib/kedaluwarsa";
import { rp, displayStatus, dateId } from "@/lib/booking-status";
import { ButtonLink, Card, EmptyState, SectionHeading, Skeleton, StatusBadge } from "@/components/ui";
import { IconCalendar, IconChevronRight, IconReceipt } from "@/components/icons";

export const metadata: Metadata = { title: "Booking saya" };

async function List() {
  await connection();
  const user = await requireRole("customer");
  await expireOverdue();
  const list = await prisma.booking.findMany({
    where: { id_customer: user.id_user },
    include: { service: true, slot: true },
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
          <Link href={`/akun/booking/${b.booking_code}`} className="group block rounded-lg">
            <Card
              variant="interactive"
              className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6"
            >
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold tracking-wide text-muted">{b.booking_code}</p>
                <h2 className="text-lg font-semibold group-hover:text-primary-ink">{b.service.service_name}</h2>
                <p className="flex items-center gap-1.5 text-sm text-muted">
                  <IconCalendar size={16} />
                  {dateId(b.slot.date)}, {b.slot.start_time}–{b.slot.end_time}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 md:justify-end">
                <StatusBadge status={displayStatus(b.status, b.payment_deadline)} />
                <p className="font-bold tabular-nums">{rp(b.total_price)}</p>
                <IconChevronRight size={20} className="hidden text-muted md:block" />
              </div>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function AccountPage() {
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
        <List />
      </Suspense>
    </div>
  );
}
