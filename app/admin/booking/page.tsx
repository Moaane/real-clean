import type { Metadata } from "next";
import Link from "next/link";
import { dynamic, Dyn, th } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { kedaluwarsakanLewatBatas } from "@/lib/kedaluwarsa";
import { parseDate } from "@/lib/availability";
import { rp, STATUS_LABEL, tanggalId } from "@/lib/booking-status";
import { Button, EmptyState, Input, Select, StatusBadge } from "@/components/ui";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/dash/page-header";
import { IconReceipt } from "@/components/icons";
import type { StatusBooking } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Booking" };

type Params = Promise<{ status?: string; tanggal?: string }>;
const STATUSES = Object.keys(STATUS_LABEL) as StatusBooking[];

async function Daftar({ searchParams }: { searchParams: Params }) {
  await dynamic();
  await kedaluwarsakanLewatBatas();
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status);
  const tanggal = parseDate(sp.tanggal);

  const rows = await prisma.booking.findMany({
    where: { ...(status && { status }), ...(tanggal && { slot: { tanggal } }) },
    include: { layanan: true, slot: true, pelanggan: { select: { nama: true } } },
    orderBy: [{ slot: { tanggal: "desc" } }, { slot: { jam_mulai: "asc" } }, { id_booking: "desc" }],
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
          <Input name="tanggal" type="date" label="Tanggal jadwal" defaultValue={tanggal ? sp.tanggal : ""} />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Terapkan</Button>
          {(status || tanggal) && (
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
                  <td className="py-3 pr-4 font-semibold tabular-nums">{b.kode_booking}</td>
                  <td className="py-3 pr-4">{b.pelanggan.nama}</td>
                  <td className="py-3 pr-4">{b.layanan.nama_layanan}</td>
                  <td className="whitespace-nowrap py-3 pr-4">
                    {tanggalId(b.slot.tanggal)}, {b.slot.jam_mulai}–{b.slot.jam_selesai}
                  </td>
                  <td className="py-3 pr-4 tabular-nums">{rp(b.total_harga)}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={b.status} />
                    {b.batal_diajukan_at && !b.batal_ditolak && (b.status === "DIBAYAR" || b.status === "DITUGASKAN") && (
                      <p className="mt-1 text-xs font-semibold text-warn">Minta batal</p>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <Link href={`/admin/booking/${b.kode_booking}`} className={buttonClass(b.status === "DIBAYAR" ? "primary" : "outline", "sm")}>
                      {b.status === "DIBAYAR" ? "Tugaskan" : "Detail"}
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
        <Daftar searchParams={searchParams} />
      </Dyn>
    </>
  );
}
