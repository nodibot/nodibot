import { Header } from "@/app/_components/header";
import { Footer } from "@/app/_components/footer";
// import { WaFloat } from "@/app/_components/wa-float"; // WhatsApp disabled for now
import { LandingHero } from "@/app/_components/landing/LandingHero";
import {
  HostStrip,
  HowItWorks,
  Pillars,
  WhyNodibot,
  PriceTransparency,
  EmergencyBand,
  FinalCta,
} from "@/app/_components/landing/sections";

export default function LandingPage() {
  return (
    <div className="app lp">
      <Header variant="landing" />
      <LandingHero />
      <HostStrip />
      <HowItWorks />
      <Pillars />
      <WhyNodibot />
      <PriceTransparency />
      <EmergencyBand />
      <FinalCta />
      <Footer />
      {/* <WaFloat /> WhatsApp disabled for now */}
    </div>
  );
}
