import Link from "next/link";
import { Suspense } from "react";
import { Icon } from "@/components/icons";
import { logout } from "@/lib/actions/auth";
import { requireRole } from "@/lib/auth";
import { rp, STATUS_LABEL, statusBadgeClass, tanggalId } from "@/lib/booking-status";
import { prisma } from "@/lib/prisma";

async function Content() {
  const user = await requireRole("pelanggan");
  const list = await prisma.booking.findMany({
    where: { id_pelanggan: user.id_user },
    orderBy: { created_at: "desc" },
    include: { layanan: true, slot: true },
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Booking Saya</h1>
          <p className="mt-1 text-muted">Halo, {user.nama}.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/pesan" className="btn btn-primary">
            <Icon name="plus" size={18} />
            Pesan baru
          </Link>
          <form action={logout}>
            <button type="submit" className="btn btn-outline">
              <Icon name="logout" size={18} />
              Keluar
            </button>
          </form>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Icon name="sparkle" size={28} />
          </span>
          <p className="font-bold">Belum ada booking</p>
          <p className="max-w-sm text-sm text-muted">Pilih paket dan jadwal pertamamu, kami yang bersihkan.</p>
          <Link href="/pesan" className="btn btn-primary">
            Pesan sekarang
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((b) => (
            <li key={b.id_booking}>
              <Link
                href={`/akun/booking/${b.kode_booking}`}
                className="card flex flex-wrap items-center justify-between gap-3 transition-colors hover:border-primary"
              >
                <div>
                  <p className="font-bold">{b.layanan.nama_layanan}</p>
                  <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="calendar" size={14} />
                      {tanggalId(b.slot.tanggal)}, {b.slot.jam_mulai}
                    </span>
                    <span className="font-mono">{b.kode_booking}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{rp(b.total_harga)}</span>
                  <span className={`badge ${statusBadgeClass(b.status)}`}>{STATUS_LABEL[b.status]}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function Page() {
  return (
    <main className="page max-w-3xl">
      <Suspense fallback={<p className="text-muted">Memuat…</p>}>
        <Content />
      </Suspense>
    </main>
  );
}
