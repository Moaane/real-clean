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

const AKTIF = ["DITUGASKAN", "DALAM_PERJALANAN", "DIKERJAKAN", "MENUNGGU_VERIFIKASI"] as const;

async function Tugas() {
  await connection();
  const user = await requireRole("karyawan");
  const hariIni = nowWib().date;
  const today = new Date(`${hariIni}T00:00:00.000Z`);
  // Own tasks only: today, upcoming, and unfinished ones from earlier days.
  const rows = await prisma.penugasan.findMany({
    where: {
      id_karyawan: user.id_user,
      status_tugas: { not: "dibatalkan" },
      OR: [{ booking: { slot: { tanggal: { gte: today } } } }, { booking: { status: { in: [...AKTIF] } } }],
    },
    orderBy: [{ booking: { slot: { tanggal: "asc" } } }, { booking: { slot: { jam_mulai: "asc" } } }],
    select: {
      id_penugasan: true,
      status_tugas: true,
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

  const t = today.getTime();
  const groups = [
    { judul: "Jadwal hari ini", items: rows.filter((r) => r.booking.slot.tanggal.getTime() === t) },
    { judul: "Belum selesai dari hari sebelumnya", items: rows.filter((r) => r.booking.slot.tanggal.getTime() < t) },
    { judul: "Mendatang", items: rows.filter((r) => r.booking.slot.tanggal.getTime() > t) },
  ];

  return (
    <div className="grid gap-8">
      {groups.map(
        (g) =>
          (g.items.length > 0 || g.judul === "Jadwal hari ini") && (
            <section key={g.judul} className="grid gap-3">
              <h2 className="text-lg font-semibold">{g.judul}</h2>
              {g.items.length === 0 && <p className="text-sm text-muted">Tidak ada tugas hari ini.</p>}
              {g.items.map((r) => (
                <Link key={r.id_penugasan} href={`/karyawan/tugas/${r.booking.kode_booking}`} className="block">
                  <Card className="hover-lift transition duration-200 hover:-translate-y-0.5 md:p-6">
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
        <Tugas />
      </Suspense>
    </>
  );
}
