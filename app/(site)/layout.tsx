import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { BottomNav } from "@/components/bottom-nav";

async function BottomNavGate() {
  const user = await getCurrentUser();
  return <BottomNav role={user?.role ?? null} />;
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col pb-16 md:pb-0">
      <Navbar />
      <main id="konten" className="flex-1">
        {children}
      </main>
      <Footer />
      <Suspense>
        <BottomNavGate />
      </Suspense>
    </div>
  );
}
