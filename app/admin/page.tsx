import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { cn } from "@/lib/cn";
import { deltaPct, getDashboard, parseRange, RANGES, RANGE_HINT, RANGE_LABEL, compactRp, type Dashboard } from "@/lib/dashboard";
import { rp, STATUS_LABEL } from "@/lib/booking-status";
import { Card, EmptyState, Skeleton, StatusBadge } from "@/components/ui";
import { AreaChart, BarChart, Delta, Donut, type DonutSegment } from "@/components/dash/charts";
import { Label, PageHeader } from "@/components/dash/page-header";
import { IconCalendar } from "@/components/icons";

export const metadata: Metadata = { title: "Ringkasan" };

type Params = Promise<{ range?: string }>;

const STATUS_STROKE: Record<string, string> = {
  COMPLETED: "stroke-primary",
  PAID: "stroke-info",
  ASSIGNED: "stroke-info",
  ON_THE_WAY: "stroke-info",
  IN_PROGRESS: "stroke-info",
  AWAITING_VERIFICATION: "stroke-warn",
  PENDING_PAYMENT: "stroke-warn",
  EXPIRED: "stroke-neutral",
  CANCELLED: "stroke-danger",
  REFUNDED: "stroke-danger",
};
const STATUS_DOT: Record<string, string> = {
  COMPLETED: "bg-primary",
  PAID: "bg-info",
  ASSIGNED: "bg-info",
  ON_THE_WAY: "bg-info",
  IN_PROGRESS: "bg-info",
  AWAITING_VERIFICATION: "bg-warn",
  PENDING_PAYMENT: "bg-warn",
  EXPIRED: "bg-neutral",
  CANCELLED: "bg-danger",
  REFUNDED: "bg-danger",
};

function RangeTabs({ active }: { active: string }) {
  return (
    <nav aria-label="Rentang waktu" className="flex w-full rounded-pill border border-border bg-surface p-1 md:inline-flex md:w-auto">
      {RANGES.map((r) => (
        <Link
          key={r}
          href={`/admin?range=${r}`}
          scroll={false}
          aria-current={active === r ? "true" : undefined}
          className={cn(
            "inline-flex h-9 flex-1 items-center justify-center rounded-pill px-2 text-[11px] md:flex-none md:px-4 md:text-xs font-bold uppercase tracking-wider transition duration-150",
            active === r ? "bg-primary text-on-primary" : "text-muted hover:bg-surface-2 hover:text-foreground",
          )}
        >
          {RANGE_LABEL[r]}
        </Link>
      ))}
    </nav>
  );
}

function Kpi({ label, value, delta, hint }: { label: string; value: string; delta: number | null; hint: string }) {
  return (
    <Card className="hover-lift p-5 transition duration-200 hover:-translate-y-0.5 md:p-6">
      <Label>{label}</Label>
      <p className="mt-2 text-[32px] font-bold leading-none tracking-tight tabular-nums md:text-[40px]">{value}</p>
      <div className="mt-3">
        <Delta value={delta} hint={hint} />
      </div>
    </Card>
  );
}

function ChartCard({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <Card className="overflow-x-clip md:p-6">
      <div className="mb-5">
        <Label>{title}</Label>
        <p className="mt-1 text-sm text-muted">{sub}</p>
      </div>
      {children}
    </Card>
  );
}

function ActionCard({ label, value, desc, tone }: { label: string; value: number; desc: string; tone: "warn" | "info" | "ok" }) {
  const pill = { warn: "bg-warn-soft text-warn", info: "bg-info-soft text-info", ok: "bg-ok-soft text-ok" }[tone];
  const dot = { warn: "bg-warn", info: "bg-info", ok: "bg-ok" }[tone];
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <Label>{label}</Label>
      <p className="mt-2 text-[32px] font-bold leading-none tabular-nums">{value}</p>
      <span className={cn("mt-3 inline-flex h-6 items-center gap-1.5 rounded-pill px-2.5 text-[11px] font-bold uppercase tracking-wider", pill)}>
        <span className={cn("size-1.5 rounded-pill", dot)} />
        {value > 0 ? "Perlu dicek" : "Aman"}
      </span>
      <p className="mt-2 text-xs leading-relaxed text-muted">{desc}</p>
    </div>
  );
}

function Metric({ label, value, dot }: { label: string; value: string; dot: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
        <span className={cn("size-2 rounded-pill", dot)} />
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Content({ d }: { d: Dashboard }) {
  const every = Math.ceil(d.booking.series.length / 8);
  const segments: DonutSegment[] = d.status.map((s) => ({
    label: STATUS_LABEL[s.status],
    value: s.count,
    className: STATUS_STROKE[s.status],
  }));
  const occupied = d.occupancy.quota > 0 ? Math.min(100, Math.round((d.occupancy.filled / d.occupancy.quota) * 100)) : 0;
  const maxServices = Math.max(...d.topServices.map((l) => l.count), 1);

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Booking hari ini per status */}
      <Card className="md:p-6">
        <Label>Booking hari ini</Label>
        <p className="mt-1 text-sm text-muted">Booking dengan jadwal hari ini, per status.</p>
        {d.today.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Tidak ada booking terjadwal hari ini.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {d.today.map((s) => (
              <li key={s.status} className="rounded-lg border border-border bg-surface p-4">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <span className={cn("size-2 rounded-pill", STATUS_DOT[s.status])} />
                  {STATUS_LABEL[s.status]}
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums">{s.count}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi label="Booking masuk" value={String(d.booking.total)} delta={deltaPct(d.booking.total, d.booking.prev)} hint="dari periode sebelumnya" />
        <Kpi label="Nilai terkonfirmasi" value={rp(d.value.total)} delta={deltaPct(d.value.total, d.value.prev)} hint="dari periode sebelumnya" />
        <Card className="sm:col-span-2 md:p-6 xl:col-span-1">
          <Label>Okupansi hari ini</Label>
          <div className="mt-2 flex items-center gap-4">
            <Donut size={84} segments={[{ label: "Terisi", value: d.occupancy.filled, className: "stroke-primary" }, { label: "Sisa", value: Math.max(d.occupancy.quota - d.occupancy.filled, 0), className: "stroke-transparent" }]}>
              <span className="text-lg font-bold tabular-nums">{occupied}%</span>
            </Donut>
            <div>
              <p className="text-[32px] font-bold leading-none tabular-nums">
                {d.occupancy.filled}
                <span className="text-lg font-semibold text-muted"> / {d.occupancy.quota}</span>
              </p>
              <p className="mt-2 text-xs text-muted">slot terisi dari kuota jam aktif</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Grafik */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Booking masuk" sub={RANGE_HINT[d.range]}>
          <BarChart data={d.booking.series} labelEvery={every} unit=" booking" />
        </ChartCard>
        <ChartCard title="Nilai terkonfirmasi" sub={RANGE_HINT[d.range]}>
          <AreaChart data={d.value.series} format={compactRp} labelEvery={every} />
        </ChartCard>
      </div>

      {/* Perlu tindakan (gaya "roadmap") */}
      <Card className="md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <Label>Perlu tindakan</Label>
            <p className="mt-1 text-sm text-muted">Antrean yang menunggu admin saat ini.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ActionCard label="Belum ditugaskan" value={d.needsAction.unassigned} desc="Sudah dibayar, menunggu karyawan ditugaskan." tone="warn" />
          <ActionCard label="Menunggu verifikasi" value={d.needsAction.awaitingVerification} desc="Bukti kerja diunggah, tinggal diverifikasi." tone="info" />
          <ActionCard label="Menunggu pembayaran" value={d.needsAction.awaitingPayment} desc="Belum melewati batas bayar." tone="ok" />
        </div>

        <div className="my-6 flex items-center gap-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Ringkasan operasional</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Paket aktif" value={String(d.compact.activePkg)} dot="bg-primary" />
          <Metric label="Karyawan aktif" value={String(d.compact.activeStaff)} dot="bg-info" />
          <Metric label="Pelanggan" value={String(d.compact.customer)} dot="bg-warn" />
          <Metric label="Pendapatan bersih" value={rp(d.revenue)} dot="bg-ok" />
        </div>
      </Card>

      {/* Status + top layanan */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="md:p-6">
          <Label>Sebaran status</Label>
          {d.status.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Belum ada booking pada periode ini.</p>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
              <Donut size={132} segments={segments}>
                <span>
                  <span className="block text-2xl font-bold tabular-nums">{d.booking.total}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">booking</span>
                </span>
              </Donut>
              <ul className="w-full flex-1 divide-y divide-border">
                {d.status.map((s) => (
                  <li key={s.status} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <span className={cn("size-2.5 rounded-pill", STATUS_DOT[s.status])} />
                      {STATUS_LABEL[s.status]}
                    </span>
                    <span className="font-bold tabular-nums">{s.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
        <Card className="md:p-6">
          <Label>Paket terlaris</Label>
          {d.topServices.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Belum ada booking pada periode ini.</p>
          ) : (
            <ol className="mt-4 grid gap-4">
              {d.topServices.map((l, i) => (
                <li key={l.name}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-semibold">
                      <span className="mr-2 text-muted tabular-nums">{i + 1}</span>
                      {l.name}
                    </span>
                    <span className="font-bold tabular-nums">{l.count}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-pill bg-surface-2">
                    <div className="anim-grow-x h-full rounded-pill bg-linear-to-r from-primary to-primary-soft" style={{ width: `${(l.count / maxServices) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      {/* Jadwal hari ini */}
      <Card className="md:p-6">
        <Label>Jadwal hari ini</Label>
        {d.todaySchedule.length === 0 ? (
          <EmptyState icon={IconCalendar} title="Tidak ada pekerjaan terjadwal hari ini." className="mt-4 border-0 bg-surface-2/50 py-8" />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th className="pb-3 pr-4 font-semibold">Jam</th>
                  <th className="pb-3 pr-4 font-semibold">Kode</th>
                  <th className="pb-3 pr-4 font-semibold">Paket</th>
                  <th className="pb-3 pr-4 font-semibold">Pelanggan</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {d.todaySchedule.map((j) => (
                  <tr key={j.id} className="transition duration-150 hover:bg-surface-2/60">
                    <td className="py-3 pr-4 font-semibold tabular-nums">{j.timeSlot}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{j.code}</td>
                    <td className="py-3 pr-4">{j.pkg}</td>
                    <td className="py-3 pr-4">{j.customer}</td>
                    <td className="py-3">
                      <StatusBadge status={j.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

async function Dashboard_({ searchParams }: { searchParams: Params }) {
  await connection();
  const range = parseRange((await searchParams).range);
  const d = await getDashboard(range);
  return (
    <>
      <PageHeader title="Ringkasan" accent="operasional" description="Pantau booking, nilai, dan antrean kerja dalam satu layar.">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-pill bg-primary opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-pill bg-primary" />
          </span>
          Diperbarui {d.updatedAt} WIB
        </span>
        <RangeTabs active={range} />
      </PageHeader>
      <Content d={d} />
    </>
  );
}

function DashSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 gap-4">
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-36 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

export default function AdminPage({ searchParams }: { searchParams: Params }) {
  return (
    <Suspense fallback={<DashSkeleton />}>
      <Dashboard_ searchParams={searchParams} />
    </Suspense>
  );
}
