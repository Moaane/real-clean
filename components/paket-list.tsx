import type { Layanan } from "@/generated/prisma/client";

const rp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const JENIS = { rumah: "Rumah", kos: "Kos-kosan" } as const;
const DETAIL = { reguler: "Reguler", detail: "Detail", deep: "Deep cleaning" } as const;

export function PaketList({ items }: { items: Layanan[] }) {
  return (
    <div className="flex flex-col gap-6">
      {(["rumah", "kos"] as const).map((jenis) => {
        const list = items.filter((l) => l.jenis_properti === jenis);
        return (
          <section key={jenis} className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Paket {JENIS[jenis]}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {list.map((l) => (
                <li key={l.id_layanan} className="rounded border border-zinc-300 p-4">
                  <h3 className="font-medium">{l.nama_layanan}</h3>
                  {l.deskripsi && <p className="mt-1 text-sm text-zinc-600">{l.deskripsi}</p>}
                  <p className="mt-2 text-sm text-zinc-600">
                    {l.jumlah_kamar} kamar · {DETAIL[l.tingkat_detail]} · {l.durasi_menit} menit
                  </p>
                  <p className="mt-1 font-medium">{rp(l.harga)}</p>
                </li>
              ))}
              {list.length === 0 && <li className="text-zinc-500">Belum ada paket.</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
