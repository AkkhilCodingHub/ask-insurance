import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { Stats } from "@/components/landing/Stats";
import { TrustBar } from "@/components/landing/TrustBar";
import { Categories } from "@/components/landing/Categories";
import { InsurerGrid } from "@/components/landing/InsurerGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CTA } from "@/components/landing/CTA";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <TrustBar />
        <Categories />
        <InsurerGrid />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
