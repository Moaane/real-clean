import type { Metadata } from "next";
import Link from "next/link";
import { dynamic, ActiveDot, AddLink, Dyn, th } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { deleteJam } from "@/lib/actions/master";
import { EmptyState } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/dash/page-header";
import { IconClock } from "@/components/icons";

export const metadata: Metadata = { title: "Jam operasional" };

async function Daftar() {
  await dynamic();
  const rows = await prisma.jamOperasional.findMany({ orderBy: { jam_mulai: "asc" } });
  if (rows.length === 0)
    return <EmptyState icon={IconClock} title="Belum ada jam operasional." action={<AddLink href="/admin/jam/baru">Tambah jam</AddLink>} />;
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface p-5">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr>
            <th className={th}>Jam</th>
            <th className={th}>Kuota</th>
            <th className={th}>Status</th>
            <th className={th + " text-right"}>Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((j) => (
            <tr key={j.id} className="transition duration-150 hover:bg-surface-2/60">
              <td className="py-3 pr-4 font-semibold tabular-nums">
                {j.jam_mulai}–{j.jam_selesai}
              </td>
              <td className="py-3 pr-4 tabular-nums">{j.kuota} booking</td>
              <td className="py-3 pr-4">
                <ActiveDot aktif={j.aktif} />
              </td>
              <td className="py-3">
                <div className="flex justify-end gap-2">
                  <Link href={`/admin/jam/${j.id}`} className={buttonClass("outline", "sm")}>
                    Ubah
                  </Link>
                  <ConfirmDialog
                    trigger="Hapus"
                    title="Hapus jam?"
                    description={`Jam ${j.jam_mulai}–${j.jam_selesai} tidak akan tersedia lagi. Booking yang sudah ada tidak terpengaruh.`}
                    confirmLabel="Hapus"
                    action={deleteJam}
                    fields={{ id: String(j.id) }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <PageHeader title="Jam" accent="operasional" description="Slot waktu yang bisa dipilih pelanggan beserta kuotanya.">
        <AddLink href="/admin/jam/baru">Tambah jam</AddLink>
      </PageHeader>
      <Dyn>
        <Daftar />
      </Dyn>
    </>
  );
}
