import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Header } from "@/app/_components/header";
import { Footer } from "@/app/_components/footer";
import { WaFloat } from "@/app/_components/wa-float";
import { HowItWorks } from "@/app/_components/landing/sections";
import { HeroSearch } from "@/app/_components/landing-v2/HeroSearch";
import { TrustBar } from "@/app/_components/landing-v2/TrustBar";
import { ReadyToShip } from "@/app/_components/landing-v2/ReadyToShip";
import { HomepageAnalytics } from "@/app/_components/landing-v2/HomepageAnalytics";
import { filterParts } from "@/app/_lib/catalog";
import { withLocale } from "@/app/_lib/locale-path";
import { getActiveParts } from "@/app/_lib/parts";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const canonical = withLocale(locale, "/");
  return {
    title: "Find industrial automation parts instantly",
    description:
      "Search authentic surplus industrial automation parts by exact part number. Bench-tested inventory, global DHL Express shipping, and emergency sourcing support.",
    alternates: {
      canonical,
      languages: {
        en: withLocale("en", "/"),
        ko: withLocale("ko", "/"),
      },
    },
    openGraph: {
      title: "Find industrial automation parts instantly | nodibot",
      description:
        "Search tested controllers, servo drives, PLCs, HMIs, and robot parts by exact part number.",
      url: canonical,
      type: "website",
    },
  };
}

const READY_LIMIT = 8;

export default async function LandingPage() {
  const parts = await getActiveParts();
  const readyParts = filterParts(parts, {
    cats: [],
    hosts: [],
    stock: ["in"],
    query: "",
  }).slice(0, READY_LIMIT);

  return (
    <div className="app lp2">
      <HomepageAnalytics />
      <Header variant="landing-v2" />
      <HeroSearch />
      <TrustBar />
      <ReadyToShip parts={readyParts} />
      <HowItWorks />
      <Footer />
      <WaFloat />
    </div>
  );
}
