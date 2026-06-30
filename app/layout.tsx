import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ThemeBootstrap } from "@/app/_components/ThemeBootstrap";
import { SITE_NAME, SITE_URL } from "@/app/_lib/seo";
import enMessages from "@/messages/en.json";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

function requiredEnv(name: string, value: string | undefined): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(`${name} is not set`);
  }

  return trimmed;
}

const googleAnalyticsId = requiredEnv(
  "GOOGLE_ANALYTICS_ID",
  process.env.GOOGLE_ANALYTICS_ID,
);

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "nodibot — Industrial automation parts, sourced on demand",
    template: "%s | nodibot",
  },
  description:
    "Verified secondary-market controllers, drives, teach pendants and reducers for discontinued FANUC, ABB, KUKA, Yaskawa & Siemens automation. Drop a part number — we locate, test, and quote.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "nodibot — Industrial automation parts, sourced on demand",
    description:
      "Find verified secondary-market industrial automation parts by exact part number. nodibot sources, tests, and quotes discontinued controllers, drives, pendants, reducers, and modules.",
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "nodibot — Industrial automation parts, sourced on demand",
    description:
      "Search exact industrial automation part numbers and request sourcing, testing status, lead time, and availability from nodibot.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${hanken.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeBootstrap />
        <NextIntlClientProvider locale="en" messages={enMessages}>
          {children}
        </NextIntlClientProvider>
        <GoogleAnalytics gaId={googleAnalyticsId} />
      </body>
    </html>
  );
}
