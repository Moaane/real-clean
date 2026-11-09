import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nowWib } from "@/lib/availability";
import { Card, EmptyState, Skeleton, StatusBadge } from "@/components/ui";
import { Label, PageHeader } from "@/components/dash/page-header";
import { IconCalendar } from "@/components/icons";

export const metadata: Metadata = { title: "Tugas saya" };

async function Tugas() {
  await connection();
  const user = await requireRole("karyawan");
  const today = new Date(`${nowWib().date}T00:00:00.000Z`);
  const rows = await prisma.penugasan.findMany({
    where: { id_karyawan: user.id_user, booking: { slot: { tanggal: { gte: today } } } },
    orderBy: [{ booking: { slot: { tanggal: "asc" } } }, { booking: { slot: { jam_mulai: "asc" } } }],
    select: {
      id_penugasan: true,
      booking: {
        select: {
          kode_booking: true,
          status: true,
          alamat_layanan: true,
          layanan: { select: { nama_layanan: true } },
          slot: { select: { tanggal: true, jam_mulai: true, jam_selesai: true } },
        },
      },
    },
  });

  if (rows.length === 0)
    return <EmptyState icon={IconCalendar} title="Belum ada tugas untuk hari ini maupun hari berikutnya." />;

  return (
    <div className="grid gap-3">
      {rows.map((r) => (
        <Card key={r.id_penugasan} className="hover-lift transition duration-200 hover:-translate-y-0.5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Label>
                {r.booking.slot.tanggal.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })} ·{" "}
                {r.booking.slot.jam_mulai}–{r.booking.slot.jam_selesai}
              </Label>
              <p className="mt-1 text-lg font-bold">{r.booking.layanan.nama_layanan}</p>
              <p className="mt-1 text-sm text-muted">{r.booking.alamat_layanan}</p>
              <p className="mt-2 font-mono text-xs text-muted">{r.booking.kode_booking}</p>
            </div>
            <StatusBadge status={r.booking.status} />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <>
      <PageHeader title="Tugas" accent="saya" description="Pekerjaan yang ditugaskan admin kepada Anda." />
      <Suspense fallback={<Skeleton className="h-32 rounded-lg" />}>
        <Tugas />
      </Suspense>
    </>
  );
}
