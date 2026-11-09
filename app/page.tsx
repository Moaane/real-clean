import { Suspense } from "react";
import { CaraKerja } from "@/components/landing/cara-kerja";
import { ClosingCta } from "@/components/landing/closing-cta";
import { Faq } from "@/components/landing/faq";
import { LandingFooter } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { PaketSkeleton } from "@/components/landing/paket-card";
import { PaketSection } from "@/components/landing/paket-section";
import { Solusi } from "@/components/landing/solusi";
import { Tingkat } from "@/components/landing/tingkat";
import { TrustBar } from "@/components/landing/trust-bar";
import { SiteHeader } from "@/components/site-header";
import { SectionHeading } from "@/components/ui";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="konten" className="flex flex-1 flex-col">
        <Hero />
        <TrustBar />
        <section id="paket" aria-labelledby="paket-judul" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-24">
          <SectionHeading
            id="paket-judul"
            align="split"
            upper
            title="Paket"
            highlight="kebersihan"
            after="kami"
            lead="Harga tetap per paket. Pilih sesuai jenis properti dan jumlah kamar."
          />
          <div className="mt-8">
            <Suspense fallback={<PaketSkeleton />}>
              <PaketSection />
            </Suspense>
          </div>
        </section>
        <Solusi />
        <CaraKerja />
        <Tingkat />
        <Faq />
        <ClosingCta />
      </main>
      <LandingFooter />
    </>
  );
}
