import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nowWib } from "@/lib/availability";
import { Card, EmptyState, Skeleton, StatusBadge } from "@/components/ui";
import { Label, PageHeader } from "@/components/dash/page-header";
import { IconCalendar } from "@/components/icons";

export const metadata: Metadata = { title: "Tugas saya" };

const ACTIVE = ["ASSIGNED", "ON_THE_WAY", "IN_PROGRESS", "AWAITING_VERIFICATION"] as const;

async function Task() {
  await connection();
  const user = await requireRole("staff");
  const today = nowWib().date;
  const todayStart = new Date(`${today}T00:00:00.000Z`);
  // Own tasks only: today, upcoming, and unfinished ones from earlier days.
  const rows = await prisma.assignment.findMany({
    where: {
      id_staff: user.id_user,
      task_status: { not: "cancelled" },
      OR: [{ booking: { slot: { date: { gte: todayStart } } } }, { booking: { status: { in: [...ACTIVE] } } }],
    },
    orderBy: [{ booking: { slot: { date: "asc" } } }, { booking: { slot: { start_time: "asc" } } }],
    select: {
      id_assignment: true,
      task_status: true,
      booking: {
        select: {
          booking_code: true,
          status: true,
          service_address: true,
          service: { select: { service_name: true } },
          slot: { select: { date: true, start_time: true, end_time: true } },
        },
      },
    },
  });

  if (rows.length === 0)
    return <EmptyState icon={IconCalendar} title="Belum ada tugas untuk hari ini maupun hari berikutnya." />;

  const t = todayStart.getTime();
  const groups = [
    { title: "Jadwal hari ini", items: rows.filter((r) => r.booking.slot.date.getTime() === t) },
    { title: "Belum selesai dari hari sebelumnya", items: rows.filter((r) => r.booking.slot.date.getTime() < t) },
    { title: "Mendatang", items: rows.filter((r) => r.booking.slot.date.getTime() > t) },
  ];

  return (
    <div className="grid gap-8">
      {groups.map(
        (g) =>
          (g.items.length > 0 || g.title === "Jadwal hari ini") && (
            <section key={g.title} className="grid gap-3">
              <h2 className="text-lg font-semibold">{g.title}</h2>
              {g.items.length === 0 && <p className="text-sm text-muted">Tidak ada tugas hari ini.</p>}
              {g.items.map((r) => (
                <Link key={r.id_assignment} href={`/karyawan/tugas/${r.booking.booking_code}`} className="block">
                  <Card className="hover-lift transition duration-200 hover:-translate-y-0.5 md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Label>
                          {r.booking.slot.date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })} ·{" "}
                          {r.booking.slot.start_time}–{r.booking.slot.end_time}
                        </Label>
                        <p className="mt-1 text-lg font-bold">{r.booking.service.service_name}</p>
                        <p className="mt-1 text-sm text-muted">{r.booking.service_address}</p>
                        <p className="mt-2 font-mono text-xs text-muted">{r.booking.booking_code}</p>
                      </div>
                      <StatusBadge status={r.booking.status} />
                    </div>
                  </Card>
                </Link>
              ))}
            </section>
          ),
      )}
    </div>
  );
}

export default function Page() {
  return (
    <>
      <PageHeader title="Tugas" accent="saya" description="Pekerjaan yang ditugaskan admin kepada Anda." />
      <Suspense fallback={<Skeleton className="h-32 rounded-lg" />}>
        <Task />
      </Suspense>
    </>
  );
}
