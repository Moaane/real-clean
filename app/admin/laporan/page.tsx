import type { Metadata } from "next";
import Link from "next/link";
import { dynamic, Dyn, th } from "@/components/admin/ui";
import { getReport, parseDateRange } from "@/lib/laporan";
import { rp, timeId } from "@/lib/booking-status";
import { Alert, Button, Card, EmptyState, Input } from "@/components/ui";
import { buttonClass } from "@/components/ui/button";
import { Label, PageHeader } from "@/components/dash/page-header";
import { IconChart } from "@/components/icons";

export const metadata: Metadata = { title: "Laporan" };

type Params = Promise<{ from?: string; to?: string }>;

async function Content({ searchParams }: { searchParams: Params }) {
  await dynamic();
  const sp = await searchParams;
  const r = parseDateRange(sp.from, sp.to);
  const l = await getReport(r.from, r.to);

  return (
    <>
      <form method="get" className="mb-5 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-end">
        <div className="sm:w-52">
          <Input name="from" type="date" label="Dari tanggal" defaultValue={r.from} />
        </div>
        <div className="sm:w-52">
          <Input name="to" type="date" label="Sampai tanggal" defaultValue={r.to} />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Terapkan</Button>
          <Link href="/admin/laporan" className={buttonClass("outline")}>
            Bulan ini
          </Link>
        </div>
      </form>

      {r.error && (
        <Alert tone="danger" className="mb-5">
          {r.error} Menampilkan bulan ini.
        </Alert>
      )}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="md:p-6">
          <Label>Pemasukan kotor</Label>
          <p className="mt-2 text-2xl font-bold tabular-nums">{rp(l.gross)}</p>
          <p className="mt-1 text-xs text-muted">{l.transactionCount} transaksi lunas</p>
        </Card>
        <Card className="md:p-6">
          <Label>Refund</Label>
          <p className="mt-2 text-2xl font-bold tabular-nums">{rp(l.refund)}</p>
          <p className="mt-1 text-xs text-muted">{l.refundAmount} refund sukses</p>
        </Card>
        <Card className="md:p-6">
          <Label>Pendapatan bersih</Label>
          <p className="mt-2 text-2xl font-bold tabular-nums">{rp(l.net)}</p>
          <p className="mt-1 text-xs text-muted">kotor dikurangi refund</p>
        </Card>
      </div>

      {l.rows.length === 0 ? (
        <EmptyState icon={IconChart} title="Tidak ada transaksi pada rentang tanggal ini." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface p-5">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr>
                <th className={th}>Waktu bayar</th>
                <th className={th}>Kode</th>
                <th className={th}>Pelanggan</th>
                <th className={th}>Paket</th>
                <th className={th}>Metode</th>
                <th className={th + " text-right"}>Jumlah</th>
                <th className={th + " text-right"}>Refund</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {l.rows.map((b) => (
                <tr key={b.orderId} className="transition duration-150 hover:bg-surface-2/60">
                  <td className="whitespace-nowrap py-3 pr-4">{timeId(b.paymentTime)}</td>
                  <td className="py-3 pr-4">
                    <Link href={`/admin/booking/${b.code}`} className="font-semibold tabular-nums hover:underline">
                      {b.code}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">{b.customer}</td>
                  <td className="py-3 pr-4">{b.pkg}</td>
                  <td className="py-3 pr-4">{b.method ?? "-"}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{rp(b.amount)}</td>
                  <td className="py-3 text-right tabular-nums">{b.refunded > 0 ? `- ${rp(b.refunded)}` : "-"}</td>
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
      <PageHeader title="Laporan" accent="transaksi" description="Transaksi dan pendapatan per rentang tanggal (WIB). Refund yang sukses dikurangkan dari pemasukan." />
      <Dyn>
        <Content searchParams={searchParams} />
      </Dyn>
    </>
  );
}
