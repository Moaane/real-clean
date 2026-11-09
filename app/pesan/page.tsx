import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { BookingForm } from "@/components/booking-form";
import { AutoSubmitForm } from "@/components/auto-submit-form";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { submitBooking } from "@/lib/actions/booking";
import { getSlotTersedia, nowWib, parseDate } from "@/lib/availability";
import { getCurrentUser } from "@/lib/auth";
import { rp, tanggalId } from "@/lib/booking-status";
import { prisma } from "@/lib/prisma";

const DETAIL = { reguler: "Reguler", detail: "Detail", deep: "Deep cleaning" } as const;

async function Content({ searchParams }: { searchParams: PageProps<"/pesan">["searchParams"] }) {
  await connection();
  const user = await getCurrentUser();
  const sp = await searchParams;
  const paketId = Number(typeof sp.paket === "string" ? sp.paket : "");
  const today = nowWib().date;
  const tanggal = typeof sp.tanggal === "string" && sp.tanggal ? sp.tanggal : today;
  const defaults: Record<string, string> = {};
  for (const k of ["jam_mulai", "alamat", "catatan"]) {
    if (typeof sp[k] === "string") defaults[k] = sp[k];
  }

  const paket = await prisma.layanan.findMany({
    where: { status_aktif: true },
    orderBy: [{ jenis_properti: "asc" }, { jumlah_kamar: "asc" }, { harga: "asc" }],
  });
  if (sp.paket !== undefined && !paket.some((p) => p.id_layanan === paketId)) notFound();
  const dipilih = paket.find((p) => p.id_layanan === paketId);

  const slotResult = dipilih ? await getSlotTersedia(tanggal) : null;
  const date = parseDate(tanggal);

  return (
    <>
      <AutoSubmitForm className="card flex flex-col gap-4">
        <h2 className="flex items-center gap-2 font-bold">
          <span className="grid size-7 place-items-center rounded-lg bg-primary text-sm text-on-primary">1</span>
          Pilih paket dan tanggal
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label">
            Paket
            <select name="paket" required defaultValue={dipilih?.id_layanan ?? ""} className="input">
              <option value="" disabled>
                Pilih paket…
              </option>
              {(["rumah", "kos"] as const).map((j) => (
                <optgroup key={j} label={j === "rumah" ? "Rumah" : "Kos-kosan"}>
                  {paket
                    .filter((p) => p.jenis_properti === j)
                    .map((p) => (
                      <option key={p.id_layanan} value={p.id_layanan}>
                        {p.nama_layanan} – {rp(p.harga)}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="label">
            Tanggal
            <input type="date" name="tanggal" min={today} defaultValue={tanggal} required className="input" />
          </label>
        </div>
        <noscript>
          <button type="submit" className="btn btn-outline self-start">
            Lihat jam tersedia
          </button>
        </noscript>
      </AutoSubmitForm>

      {dipilih && (
        <aside className="card flex flex-wrap items-center justify-between gap-3 bg-primary-soft" aria-label="Ringkasan paket">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Paket dipilih</p>
            <p className="font-bold">{dipilih.nama_layanan}</p>
            <p className="text-sm text-muted">
              {dipilih.jumlah_kamar} kamar · {DETAIL[dipilih.tingkat_detail]}
            </p>
          </div>
          <p className="text-2xl font-extrabold text-primary">{rp(dipilih.harga)}</p>
        </aside>
      )}

      {slotResult && !slotResult.ok && (
        <p role="alert" className="alert-error">
          {slotResult.error}
        </p>
      )}
      {dipilih && slotResult?.ok && (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 font-bold">
            <span className="grid size-7 place-items-center rounded-lg bg-primary text-sm text-on-primary">2</span>
            Detail booking · {date ? tanggalId(date) : tanggal}
          </h2>
          <BookingForm
            action={submitBooking}
            layananId={dipilih.id_layanan}
            tanggal={tanggal}
            slots={slotResult.slots}
            defaults={defaults}
            loggedIn={user?.role === "pelanggan"}
          />
        </section>
      )}
    </>
  );
}

export default function Page(props: PageProps<"/pesan">) {
  return (
    <>
    <SiteHeader />
    <main className="page max-w-3xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Pesan kebersihan</h1>
        <p className="mt-1 text-muted">Pilih paket, tanggal, dan jam. Anda baru diminta masuk saat melanjutkan ke pembayaran. Total dihitung dari harga paket.</p>
      </div>
      <Suspense fallback={<p className="text-muted">Memuat…</p>}>
        <Content searchParams={props.searchParams} />
      </Suspense>
    </main>
    <SiteFooter />
    </>
  );
}
