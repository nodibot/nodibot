import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { Header } from "@/app/_components/header";
import { Footer } from "@/app/_components/footer";
import { Ic } from "@/app/_components/icons";
import { withLocale } from "@/app/_lib/locale-path";

export const metadata: Metadata = {
  title: "Part not found",
  robots: { index: false, follow: true },
};

export default async function PartNotFound() {
  const locale = await getLocale();
  const catalogHref = withLocale(locale, "/catalog");

  return (
    <div className="app">
      <Header variant="app" />
      <div className="wrap" style={{ padding: "90px 0", textAlign: "center", maxWidth: 620 }}>
        <h1 className="results-title" style={{ fontSize: 30, marginBottom: 12 }}>
          Not indexed yet — but we can still source it.
        </h1>
        <p className="results-sub" style={{ fontSize: 15, marginBottom: 28 }}>
          We don&apos;t have this exact part in our catalog. Our desk can still hunt it across our
          verified China supply network — send us the number and we&apos;ll quote you.
        </p>
        <div className="cta-row" style={{ justifyContent: "center" }}>
          <Link className="btn btn-primary btn-lg" href={catalogHref}>
            <Ic.search /> Search the catalog
          </Link>
          <Link className="btn btn-ghost btn-lg" href={catalogHref}>
            <Ic.doc /> Request a quote
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
