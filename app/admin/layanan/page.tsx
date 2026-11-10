import type { Metadata } from "next";
import { dynamic, ActiveDot, AddLink, Dyn, th } from "@/components/admin/ui";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteService } from "@/lib/actions/master";
import { durationLabel, PROPERTY_TYPES, DETAIL_LEVELS } from "@/lib/katalog";
import { rp } from "@/lib/booking-status";
import { roomRange } from "@/lib/harga";
import { Alert, EmptyState } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/dash/page-header";
import { IconTag } from "@/components/icons";

export const metadata: Metadata = { title: "Layanan" };

async function List({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await dynamic();
  const { error } = await searchParams;
  const rows = await prisma.service.findMany({ orderBy: [{ property_type: "asc" }, { detail_level: "asc" }] });
  return (
    <>
      {error === "in_use" && (
        <Alert tone="warn" className="mb-4">
          Paket sudah dipakai booking sehingga tidak bisa dihapus. Nonaktifkan saja lewat tombol Ubah.
        </Alert>
      )}
      {rows.length === 0 ? (
        <EmptyState icon={IconTag} title="Belum ada paket layanan." action={<AddLink href="/admin/layanan/baru">Tambah paket</AddLink>} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface p-5">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr>
                <th className={th}>Paket</th>
                <th className={th}>Jenis</th>
                <th className={th}>Tingkat</th>
                <th className={th}>Kamar</th>
                <th className={th}>Durasi</th>
                <th className={th}>Harga</th>
                <th className={th}>Status</th>
                <th className={th + " text-right"}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((l) => (
                <tr key={l.id_service} className="transition duration-150 hover:bg-surface-2/60">
                  <td className="py-3 pr-4 font-semibold">{l.service_name}</td>
                  <td className="py-3 pr-4">{PROPERTY_TYPES[l.property_type].label}</td>
                  <td className="py-3 pr-4">{DETAIL_LEVELS[l.detail_level]}</td>
                  <td className="py-3 pr-4 tabular-nums">{roomRange(l)}</td>
                  <td className="py-3 pr-4 tabular-nums">
                    {durationLabel(l.base_duration_minutes) || "0 menit"} + {durationLabel(l.duration_per_room_minutes) || "0 menit"}/kamar
                  </td>
                  <td className="py-3 pr-4 font-semibold tabular-nums">
                    {rp(l.base_price)} + {rp(l.price_per_room)}/kamar
                  </td>
                  <td className="py-3 pr-4"><ActiveDot active={l.is_active} /></td>
                  <td className="py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/layanan/${l.id_service}`} className={buttonClass("outline", "sm")}>Ubah</Link>
                      <ConfirmDialog trigger="Hapus" title="Hapus paket?" description={`“${l.service_name}” akan dihapus permanen. Paket yang sudah dipakai booking tidak bisa dihapus.`} confirmLabel="Hapus" action={deleteService} fields={{ id: String(l.id_service) }} />
                    </div>
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

export default function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <>
      <PageHeader title="Paket" accent="layanan" description="Kelola paket yang tampil di katalog dan halaman pemesanan.">
        <AddLink href="/admin/layanan/baru">Tambah paket</AddLink>
      </PageHeader>
      <Dyn>
        <List searchParams={searchParams} />
      </Dyn>
    </>
  );
}
