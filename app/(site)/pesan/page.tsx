import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { OrderFlow, PackagesSkeleton } from "@/components/pesan/order-flow";
import { Alert, Skeleton } from "@/components/ui";

export const metadata: Metadata = { title: "Pesan layanan" };

/** Login hint for guests, streamed separately so it never delays the booking steps. */
async function LoginNotice() {
  const user = await getCurrentUser();
  if (user) return null;
  return <Alert tone="info">Anda akan diminta masuk atau mendaftar terlebih dahulu. Isian di atas tidak hilang.</Alert>;
}

function FlowSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="h-8 w-full" />
      <div className="mt-8">
        <PackagesSkeleton />
      </div>
    </div>
  );
}

// The page is a static shell: all steps, prices and availability are handled on the client (see OrderFlow).
export default function OrderPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-14">
      <Suspense fallback={<FlowSkeleton />}>
        <OrderFlow
          notice={
            <Suspense fallback={null}>
              <LoginNotice />
            </Suspense>
          }
        />
      </Suspense>
    </div>
  );
}
