import { redirect } from "next/navigation";
import { Suspense } from "react";

// Old customer-area URL. Booking now starts at the public /pesan page.
async function Redirector({ searchParams }: { searchParams: PageProps<"/akun/booking/baru">["searchParams"] }): Promise<never> {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") q.set(k, v);
  redirect(q.size ? `/pesan?${q}` : "/pesan");
}

export default function Page(props: PageProps<"/akun/booking/baru">) {
  return (
    <Suspense fallback={<p className="page text-muted">Memuat…</p>}>
      <Redirector searchParams={props.searchParams} />
    </Suspense>
  );
}
