import { BrainPreviewSection } from "../components/landing/BrainPreviewSection";
import { ConnectSection } from "../components/landing/ConnectSection";
import { FooterSection } from "../components/landing/FooterSection";
import { HeroSection } from "../components/landing/HeroSection";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";

export default function Landing() {
  return (
    <main className="relative bg-bg-base">
      <div id="section-hero">
        <HeroSection />
      </div>
      <div id="section-how">
        <HowItWorksSection />
      </div>
      <div id="section-brain">
        <BrainPreviewSection />
      </div>
      <div id="section-connect">
        <ConnectSection />
      </div>
      <FooterSection />
    </main>
  );
}
