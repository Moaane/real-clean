import { Suspense } from "react";
import { Hero } from "@/components/home/hero";
import { CaraKerja } from "@/components/home/cara-kerja";
import { LayananSection } from "@/components/home/layanan-section";
import { Solusi } from "@/components/home/solusi";
import { Tingkat } from "@/components/home/tingkat";
import { Faq } from "@/components/home/faq";
import { Closing } from "@/components/home/closing";
import { SectionSkeleton } from "@/components/home/skeletons";
import { Reveal } from "@/components/ui/reveal";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Reveal>
        <CaraKerja />
      </Reveal>
      <Reveal>
        <Suspense fallback={<SectionSkeleton />}>
          <LayananSection />
        </Suspense>
      </Reveal>
      <Reveal>
        <Solusi />
      </Reveal>
      <Reveal>
        <Suspense fallback={<SectionSkeleton />}>
          <Tingkat />
        </Suspense>
      </Reveal>
      <Reveal>
        <Faq />
      </Reveal>
      <Reveal>
        <Suspense fallback={<SectionSkeleton />}>
          <Closing />
        </Suspense>
      </Reveal>
    </>
  );
}
