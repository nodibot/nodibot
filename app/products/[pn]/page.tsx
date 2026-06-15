import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/app/_components/header";
import { Footer } from "@/app/_components/footer";
// import { WaFloat } from "@/app/_components/wa-float"; // WhatsApp disabled for now
import { Ic } from "@/app/_components/icons";
import { PartImage, StockBadge, LifeBadge } from "@/app/_components/badges";
import { ProductCard, ProductListItem } from "@/app/_components/catalog/ProductCard";
import { Specs, Compat, AvailabilityPanel, TrustStrip } from "@/app/_components/product/sections";
import { ViewCounter } from "@/app/_components/product/ViewCounter";
import { RfqForm } from "@/app/_components/rfq/RfqForm";
import { getActiveParts, getPartByPn } from "@/app/_lib/parts";
import { CAT_LABEL, COND } from "@/app/_lib/taxonomy";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pn: string }>;
}): Promise<Metadata> {
  const { pn } = await params;
  const part = await getPartByPn(decodeURIComponent(pn));
  if (!part) {
    return { title: "Part not found" };
  }
  const title = `${part.brand} ${part.pn} — ${part.name}`;
  return {
    title,
    description: `${part.brand} ${part.pn}: ${part.name}. ${part.life}. Request sourcing, testing status, lead time, and availability from nodibot.`,
    alternates: { canonical: `/products/${encodeURIComponent(part.pn)}` },
    openGraph: { title, type: "website" },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ pn: string }>;
}) {
  const { pn } = await params;
  const decoded = decodeURIComponent(pn);
  const part = await getPartByPn(decoded);
  if (!part) notFound();

  const allParts = await getActiveParts();
  const related = allParts.filter((p) => p.cat === part.cat && p.id !== part.id).slice(0, 4);

  return (
    <div className="app">
      <Header variant="app" />
      <ViewCounter pn={part.pn} />

      <div className="wrap fade-in">
        <div className="breadcrumb">
          <Link href="/catalog">Catalog</Link>
          <span className="sep">
            <Ic.chevron style={{ width: 14, height: 14 }} />
          </span>
          <Link href={`/catalog?cat=${part.cat}`}>{CAT_LABEL[part.cat]}</Link>
          <span className="sep">
            <Ic.chevron style={{ width: 14, height: 14 }} />
          </span>
          <span className="mono" style={{ color: "var(--ink)" }}>
            {part.pn}
          </span>
        </div>

        <div className="pdp">
          {/* left: gallery + details */}
          <div>
            <div className="pdp-gallery" style={{ position: "static" }}>
              <div className="pdp-img">
                <PartImage part={part} />
              </div>
              <div className="pdp-thumbs">
                {[0, 1, 2, 3].map((i) => (
                  <div className="pdp-thumb" key={i}>
                    <PartImage part={part} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 34 }}>
              <h3 className="section-h">Specifications</h3>
              <Specs part={part} />
              <Compat part={part} />

              {related.length > 0 && (
                <>
                  <h3 className="section-h">Related in {CAT_LABEL[part.cat]}</h3>
                  <div className="grid density-compact catalog-card-grid">
                    {related.map((p) => (
                      <ProductCard key={p.id} part={p} />
                    ))}
                  </div>
                  <div className="part-list">
                    {related.map((p) => (
                      <ProductListItem key={p.id} part={p} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* right: info + RFQ */}
          <div className="pdp-info">
            <div className="pdp-brand">{part.brand}</div>
            <h1 className="pdp-pn mono">{part.pn}</h1>
            <p className="pdp-name">{part.name}</p>
            <div className="pdp-badges">
              <StockBadge part={part} />
              <LifeBadge life={part.life} />
              <span className="badge badge-life">{COND[part.cond] ?? part.cond}</span>
            </div>

            <AvailabilityPanel part={part} />
            <TrustStrip />

            <div
              style={{
                marginBottom: 18,
                display: "flex",
                alignItems: "center",
                gap: 10,
                justifyContent: "space-between",
              }}
            >
              <div className="resp-pill">
                <span className="pulse" /> {part.views.toLocaleString()} engineers viewed this
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                Lead time · <strong style={{ color: "var(--ink)" }}>{part.lead}</strong>
              </div>
            </div>

            <RfqForm part={part} />
          </div>
        </div>
      </div>

      <Footer />
      {/* <WaFloat partPn={part.pn} /> WhatsApp disabled for now */}
    </div>
  );
}
