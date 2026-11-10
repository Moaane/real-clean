import type { Metadata } from "next";
import Link from "next/link";
import { dynamic, Dyn, th } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { expireOverdue } from "@/lib/kedaluwarsa";
import { parseDate } from "@/lib/availability";
import { rp, STATUS_LABEL, dateId } from "@/lib/booking-status";
import { Button, EmptyState, Input, Select, StatusBadge } from "@/components/ui";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/dash/page-header";
import { IconReceipt } from "@/components/icons";
import type { BookingStatus } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Booking" };

type Params = Promise<{ status?: string; date?: string }>;
const STATUSES = Object.keys(STATUS_LABEL) as BookingStatus[];

async function List({ searchParams }: { searchParams: Params }) {
  await dynamic();
  await expireOverdue();
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status);
  const date = parseDate(sp.date);

  const rows = await prisma.booking.findMany({
    where: { ...(status && { status }), ...(date && { slot: { date } }) },
    include: { service: true, slot: true, customer: { select: { name: true } } },
    orderBy: [{ slot: { date: "desc" } }, { slot: { start_time: "asc" } }, { id_booking: "desc" }],
    take: 200,
  });

  return (
    <>
      <form method="get" className="mb-5 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-end">
        <div className="sm:w-60">
          <Select name="status" label="Status" defaultValue={status ?? ""}>
            <option value="">Semua status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:w-52">
          <Input name="date" type="date" label="Tanggal jadwal" defaultValue={date ? sp.date : ""} />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Terapkan</Button>
          {(status || date) && (
            <Link href="/admin/booking" className={buttonClass("outline")}>
              Reset
            </Link>
          )}
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState icon={IconReceipt} title="Tidak ada booking yang cocok dengan filter ini." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface p-5">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr>
                <th className={th}>Kode</th>
                <th className={th}>Pelanggan</th>
                <th className={th}>Paket</th>
                <th className={th}>Jadwal</th>
                <th className={th}>Total</th>
                <th className={th}>Status</th>
                <th className={th + " text-right"}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((b) => (
                <tr key={b.id_booking} className="transition duration-150 hover:bg-surface-2/60">
                  <td className="py-3 pr-4 font-semibold tabular-nums">{b.booking_code}</td>
                  <td className="py-3 pr-4">{b.customer.name}</td>
                  <td className="py-3 pr-4">{b.service.service_name}</td>
                  <td className="whitespace-nowrap py-3 pr-4">
                    {dateId(b.slot.date)}, {b.slot.start_time}–{b.slot.end_time}
                  </td>
                  <td className="py-3 pr-4 tabular-nums">{rp(b.total_price)}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={b.status} />
                    {b.cancel_requested_at && !b.cancel_rejected && (b.status === "PAID" || b.status === "ASSIGNED") && (
                      <p className="mt-1 text-xs font-semibold text-warn">Minta batal</p>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <Link href={`/admin/booking/${b.booking_code}`} className={buttonClass(b.status === "PAID" ? "primary" : "outline", "sm")}>
                      {b.status === "PAID" ? "Tugaskan" : "Detail"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function Page({ searchParams }: { searchParams: Params }) {
  return (
    <>
      <PageHeader title="Kelola" accent="booking" description="Semua booking pelanggan. Booking yang sudah dibayar siap ditugaskan ke karyawan." />
      <Dyn>
        <List searchParams={searchParams} />
      </Dyn>
    </>
  );
}
