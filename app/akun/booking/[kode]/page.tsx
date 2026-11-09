import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Icon } from "@/components/icons";
import { requireRole } from "@/lib/auth";
import { rp, STATUS_LABEL, statusBadgeClass, tanggalId, waktuId } from "@/lib/booking-status";
import { prisma } from "@/lib/prisma";

const DETAIL = { reguler: "Reguler", detail: "Detail", deep: "Deep cleaning" } as const;

async function Content({ params }: { params: PageProps<"/akun/booking/[kode]">["params"] }) {
  const user = await requireRole("pelanggan");
  const { kode } = await params;
  // Scoped to the logged-in customer: someone else's code looks like "not found".
  const b = await prisma.booking.findFirst({
    where: { kode_booking: kode, id_pelanggan: user.id_user },
    include: { layanan: true, slot: true },
  });
  if (!b) notFound();

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Paket",
      value: `${b.layanan.nama_layanan} (${b.layanan.jumlah_kamar} kamar, ${DETAIL[b.layanan.tingkat_detail]})`,
    },
    { label: "Tanggal", value: tanggalId(b.slot.tanggal) },
    { label: "Jam", value: `${b.slot.jam_mulai} – ${b.slot.jam_selesai}` },
    { label: "Alamat", value: b.alamat_layanan },
    ...(b.catatan ? [{ label: "Catatan", value: b.catatan }] : []),
  ];

  return (
    <>
      <div className="card flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Kode booking</p>
            <p className="font-mono text-xl font-bold tracking-wider">{b.kode_booking}</p>
          </div>
          <span className={`badge ${statusBadgeClass(b.status)}`}>{STATUS_LABEL[b.status]}</span>
        </div>
        <dl className="grid gap-3 sm:grid-cols-[8rem_1fr]">
          {rows.map((r) => (
            <div key={r.label} className="contents">
              <dt className="text-sm font-semibold text-muted">{r.label}</dt>
              <dd className="text-sm">{r.value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="font-semibold">Total</span>
          <span className="text-2xl font-extrabold text-primary">{rp(b.total_harga)}</span>
        </div>
      </div>

      {b.status === "MENUNGGU_PEMBAYARAN" && (
        <p className="flex items-start gap-3 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-on-accent">
          <Icon name="clock" size={20} className="mt-0.5 shrink-0" />
          <span>
            Slot ditahan sampai <strong>{waktuId(b.batas_bayar)} WIB</strong>. Pembayaran online belum tersedia di
            versi ini.
          </span>
        </p>
      )}

      <Link href="/akun" className="link self-start">
        ← Kembali ke Booking Saya
      </Link>
    </>
  );
}

export default function Page(props: PageProps<"/akun/booking/[kode]">) {
  return (
    <main className="page max-w-3xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Detail booking</h1>
      <Suspense fallback={<p className="text-muted">Memuat…</p>}>
        <Content params={props.params} />
      </Suspense>
    </main>
  );
}
