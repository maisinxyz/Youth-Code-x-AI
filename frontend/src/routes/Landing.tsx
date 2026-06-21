import { BrainPreviewSection } from "../components/landing/BrainPreviewSection";
import { ConnectSection } from "../components/landing/ConnectSection";
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
      <ConnectSection />
      <SplineSection />
      <CTASection />
    </main>
  );
}
