import { BrainPreviewSection } from "../components/landing/BrainPreviewSection";
import { ConnectorMosaic } from "../components/landing/ConnectorMosaic";
import { CTASection } from "../components/landing/CTASection";
import { HeroSection } from "../components/landing/HeroSection";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { SplineSection } from "../components/landing/SplineSection";

export default function Landing() {
  return (
    <main className="relative bg-bg-base">
      <HeroSection />
      <HowItWorksSection />
      <BrainPreviewSection />
      <ConnectorMosaic />
      <SplineSection />
      <CTASection />
    </main>
  );
}
