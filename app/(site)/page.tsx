import { Suspense } from "react";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/cara-kerja";
import { ServicesSection } from "@/components/home/layanan-section";
import { Solutions } from "@/components/home/solusi";
import { DetailLevels } from "@/components/home/tingkat";
import { Faq } from "@/components/home/faq";
import { Closing } from "@/components/home/closing";
import { SectionSkeleton } from "@/components/home/skeletons";
import { Reveal } from "@/components/ui/reveal";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Reveal>
        <HowItWorks />
      </Reveal>
      <Reveal>
        <Suspense fallback={<SectionSkeleton />}>
          <ServicesSection />
        </Suspense>
      </Reveal>
      <Reveal>
        <Solutions />
      </Reveal>
      <Reveal>
        <Suspense fallback={<SectionSkeleton />}>
          <DetailLevels />
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
