import type { Layanan } from "@/generated/prisma/client";

const rp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const JENIS = { rumah: "Rumah", kos: "Kos-kosan" } as const;
const DETAIL = { reguler: "Reguler", detail: "Detail", deep: "Deep cleaning" } as const;

function durasi(menit: number) {
  const j = Math.floor(menit / 60);
  const m = menit % 60;
  return [j ? `${j} jam` : "", m ? `${m} menit` : ""].filter(Boolean).join(" ");
}

export function PaketList({ items }: { items: Layanan[] }) {
  return (
    <div className="flex flex-col gap-10">
      {(["rumah", "kos"] as const).map((jenis) => {
        const list = items.filter((l) => l.jenis_properti === jenis);
        return (
          <section key={jenis} className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Paket {JENIS[jenis]}</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((l) => (
                <li key={l.id_layanan} className="card flex flex-col gap-3 transition hover:shadow-md">
                  <div className="flex flex-wrap gap-2">
                    <span className="badge badge-soft">{l.jumlah_kamar} kamar</span>
                    <span className="badge badge-off">{DETAIL[l.tingkat_detail]}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{l.nama_layanan}</h3>
                    {l.deskripsi && <p className="mt-1 text-sm text-muted">{l.deskripsi}</p>}
                  </div>
                  <div className="mt-auto border-t border-border pt-3">
                    <p className="text-lg font-bold text-primary">{rp(l.harga)}</p>
                    <p className="text-xs text-muted">Estimasi {durasi(l.durasi_menit)}</p>
                  </div>
                </li>
              ))}
              {list.length === 0 && <li className="text-muted">Belum ada paket.</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
