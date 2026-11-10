import type { Metadata } from "next";
import Link from "next/link";
import { dynamic, Dyn, th } from "@/components/admin/ui";
import { getLaporan, parseRentang } from "@/lib/laporan";
import { rp, waktuId } from "@/lib/booking-status";
import { Alert, Button, Card, EmptyState, Input } from "@/components/ui";
import { buttonClass } from "@/components/ui/button";
import { Label, PageHeader } from "@/components/dash/page-header";
import { IconChart } from "@/components/icons";

export const metadata: Metadata = { title: "Laporan" };

type Params = Promise<{ dari?: string; sampai?: string }>;

async function Isi({ searchParams }: { searchParams: Params }) {
  await dynamic();
  const sp = await searchParams;
  const r = parseRentang(sp.dari, sp.sampai);
  const l = await getLaporan(r.dari, r.sampai);

  return (
    <>
      <form method="get" className="mb-5 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-end">
        <div className="sm:w-52">
          <Input name="dari" type="date" label="Dari tanggal" defaultValue={r.dari} />
        </div>
        <div className="sm:w-52">
          <Input name="sampai" type="date" label="Sampai tanggal" defaultValue={r.sampai} />
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
          <p className="mt-2 text-2xl font-bold tabular-nums">{rp(l.kotor)}</p>
          <p className="mt-1 text-xs text-muted">{l.jumlahTransaksi} transaksi lunas</p>
        </Card>
        <Card className="md:p-6">
          <Label>Refund</Label>
          <p className="mt-2 text-2xl font-bold tabular-nums">{rp(l.refund)}</p>
          <p className="mt-1 text-xs text-muted">{l.jumlahRefund} refund sukses</p>
        </Card>
        <Card className="md:p-6">
          <Label>Pendapatan bersih</Label>
          <p className="mt-2 text-2xl font-bold tabular-nums">{rp(l.bersih)}</p>
          <p className="mt-1 text-xs text-muted">kotor dikurangi refund</p>
        </Card>
      </div>

      {l.baris.length === 0 ? (
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
              {l.baris.map((b) => (
                <tr key={b.orderId} className="transition duration-150 hover:bg-surface-2/60">
                  <td className="whitespace-nowrap py-3 pr-4">{waktuId(b.waktuBayar)}</td>
                  <td className="py-3 pr-4">
                    <Link href={`/admin/booking/${b.kode}`} className="font-semibold tabular-nums hover:underline">
                      {b.kode}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">{b.pelanggan}</td>
                  <td className="py-3 pr-4">{b.paket}</td>
                  <td className="py-3 pr-4">{b.metode ?? "-"}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{rp(b.jumlah)}</td>
                  <td className="py-3 text-right tabular-nums">{b.direfund > 0 ? `- ${rp(b.direfund)}` : "-"}</td>
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
        <Isi searchParams={searchParams} />
      </Dyn>
    </>
  );
}
