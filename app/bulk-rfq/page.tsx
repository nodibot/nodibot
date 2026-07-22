import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { Header } from "@/app/_components/header";
import { Footer } from "@/app/_components/footer";
import { WaFloat } from "@/app/_components/wa-float";
import { Ic } from "@/app/_components/icons";
import { BulkRfqForm } from "@/app/_components/rfq/BulkRfqForm";
import { withLocale } from "@/app/_lib/locale-path";
import { localeLanguages } from "@/app/_lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = "/bulk-rfq";
  const canonical = withLocale(locale, path);
  const title = "Bulk RFQ — source multiple automation parts";
  const description =
    "Paste a list of industrial automation part numbers and request one sourcing quote for controllers, drives, pendants, reducers, and PLC modules.";

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: localeLanguages(path),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BulkRfqPage() {
  const locale = await getLocale();
  const catalogHref = withLocale(locale, "/catalog");

  return (
    <div className="app">
      <Header variant="app" />
      <main className="wrap" style={{ padding: "42px 32px 90px" }}>
        <div className="breadcrumb" style={{ paddingTop: 0, marginBottom: 24 }}>
          <Link href={catalogHref}>Catalog</Link>
          <span className="sep">
            <Ic.chevron style={{ width: 14, height: 14 }} />
          </span>
          <span>Bulk RFQ</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
            gap: 40,
            alignItems: "start",
          }}
        >
          <section>
            <div className="lp-eyebrow">Bulk sourcing</div>
            <h1 style={{ fontSize: 44, lineHeight: 1.02, letterSpacing: "-.04em", margin: "8px 0 16px" }}>
              Send one RFQ for multiple part numbers.
            </h1>
            <p className="lp-lead" style={{ maxWidth: 620 }}>
              Maintenance teams often source spares in batches. Paste the part numbers you need and nodibot will check
              availability, sourcing options, and lead times in one workflow.
            </p>
            <div className="trust" style={{ marginTop: 28, maxWidth: 620 }}>
              <div className="trust-item">
                <Ic.search />
                <div className="t">Exact PN review</div>
                <div className="d">We use the submitted numbers as the source of truth for the hunt.</div>
              </div>
              <div className="trust-item">
                <Ic.clock />
                <div className="t">Batch response</div>
                <div className="d">One reply with sourcing status, quote details, and lead times.</div>
              </div>
              <div className="trust-item">
                <Ic.shield />
                <div className="t">No payment now</div>
                <div className="d">Approve only after availability and quote details are checked.</div>
              </div>
            </div>
          </section>

          <BulkRfqForm />
        </div>
      </main>
      <Footer />
      <WaFloat />
    </div>
  );
}
