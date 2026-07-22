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
import { absoluteUrl, localeLanguages, SITE_NAME, SITE_URL } from "@/app/_lib/seo";

function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const canonical = withLocale(locale, "/");
  return {
    title: "Find industrial automation parts instantly",
    description:
      "Search authentic surplus industrial automation parts by exact part number. Bench-tested inventory, global DHL Express shipping, and emergency sourcing support.",
    alternates: {
      canonical,
      languages: localeLanguages("/"),
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
  const locale = await getLocale();
  const parts = await getActiveParts();
  const readyParts = filterParts(parts, {
    cats: [],
    hosts: [],
    stock: ["in"],
    query: "",
  }).slice(0, READY_LIMIT);

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/icon.svg"),
    description:
      "Verified secondary-market industrial automation parts — controllers, drives, teach pendants, and reducers sourced on demand.",
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl(withLocale(locale, "/")),
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl(`${withLocale(locale, "/catalog")}?q={search_term_string}`),
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="app lp2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteJsonLd) }}
      />
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
