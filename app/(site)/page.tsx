import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/cara-kerja";
import { ServicesSection } from "@/components/home/layanan-section";
import { Solutions } from "@/components/home/solusi";
import { DetailLevels } from "@/components/home/tingkat";
import { Faq } from "@/components/home/faq";
import { Closing } from "@/components/home/closing";
import { Reveal } from "@/components/ui/reveal";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Reveal>
        <HowItWorks />
      </Reveal>
      <Reveal>
        <ServicesSection />
      </Reveal>
      <Reveal>
        <Solutions />
      </Reveal>
      <Reveal>
        <DetailLevels />
      </Reveal>
      <Reveal>
        <Faq />
      </Reveal>
      <Reveal>
        <Closing />
      </Reveal>
    </>
  );
}
