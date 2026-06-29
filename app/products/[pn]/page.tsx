import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Header } from "@/app/_components/header";
import { Footer } from "@/app/_components/footer";
import { WaFloat } from "@/app/_components/wa-float";
import { Ic } from "@/app/_components/icons";
import { PartImage, StockBadge, LifeBadge } from "@/app/_components/badges";
import { ProductCard, ProductListItem } from "@/app/_components/catalog/ProductCard";
import { Specs, Compat, AvailabilityPanel, TrustStrip } from "@/app/_components/product/sections";
import { ViewCounter } from "@/app/_components/product/ViewCounter";
import { RfqForm } from "@/app/_components/rfq/RfqForm";
import { withLocale } from "@/app/_lib/locale-path";
import { getActiveParts, getPartByPn } from "@/app/_lib/parts";
import { absoluteUrl, SITE_NAME } from "@/app/_lib/seo";
import { CAT_LABEL, COND } from "@/app/_lib/taxonomy";
import type { Part } from "@/app/_lib/types";

function productDescription(part: Part) {
  return `${part.brand} ${part.pn}: ${part.name}. ${part.life}. Request sourcing, testing status, lead time, and availability from nodibot.`;
}

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
  const title = `Buy ${part.brand} ${part.pn} | ${part.name}`;
  const description = productDescription(part);
  const url = absoluteUrl(`/products/${encodeURIComponent(part.pn)}`);
  const images = part.imageStatus === "approved" && part.imageUrl ? [part.imageUrl] : [];

  return {
    title,
    description,
    alternates: { canonical: `/products/${encodeURIComponent(part.pn)}` },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images,
    },
    twitter: {
      card: images.length > 0 ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
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
  const locale = await getLocale();
  const t = await getTranslations("Product");

  // One image per part today; the gallery scales up if that ever changes.
  const galleryImages =
    part.imageStatus === "approved" && part.imageUrl ? [part.imageUrl] : [];
  const productUrl = absoluteUrl(`/products/${encodeURIComponent(part.pn)}`);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${part.brand} ${part.pn} ${part.name}`,
    sku: part.pn,
    mpn: part.pn,
    brand: {
      "@type": "Brand",
      name: part.brand,
    },
    category: CAT_LABEL[part.cat] ?? part.cat,
    description: productDescription(part),
    image: galleryImages,
    url: productUrl,
    additionalProperty: [
      { "@type": "PropertyValue", name: "Condition", value: COND[part.cond] ?? part.cond },
      { "@type": "PropertyValue", name: "Lifecycle status", value: part.life },
      { "@type": "PropertyValue", name: "Lead time", value: part.lead },
      ...(part.series ? [{ "@type": "PropertyValue", name: "Series", value: part.series }] : []),
      ...(part.controllerGeneration
        ? [
            {
              "@type": "PropertyValue",
              name: "Controller generation",
              value: part.controllerGeneration,
            },
          ]
        : []),
    ],
    offers: {
      "@type": "Offer",
      availability:
        part.stock === "in" ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      itemCondition:
        part.cond === "refurb"
          ? "https://schema.org/RefurbishedCondition"
          : "https://schema.org/UsedCondition",
      url: productUrl,
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Catalog",
        item: absoluteUrl("/catalog"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: CAT_LABEL[part.cat] ?? part.cat,
        item: absoluteUrl(`/catalog?cat=${encodeURIComponent(part.cat)}`),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: part.pn,
        item: productUrl,
      },
    ],
  };

  return (
    <div className="app">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header variant="app" />
      <ViewCounter pn={part.pn} />

      <div className="wrap fade-in">
        <div className="breadcrumb">
          <Link href={withLocale(locale, "/catalog")}>{t("catalog")}</Link>
          <span className="sep">
            <Ic.chevron style={{ width: 14, height: 14 }} />
          </span>
          <Link href={`${withLocale(locale, "/catalog")}?cat=${part.cat}`}>{CAT_LABEL[part.cat]}</Link>
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
              {/* Parts currently have a single image; the thumbnail strip only
                  appears if a part ever carries more than one. */}
              {galleryImages.length > 1 && (
                <div className="pdp-thumbs">
                  {galleryImages.map((src) => (
                    <div className="pdp-thumb" key={src}>
                      <PartImage part={part} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 34 }}>
              <h3 className="section-h">{t("specifications")}</h3>
              <Specs part={part} />
              <Compat part={part} />

              {related.length > 0 && (
                <>
                  <h3 className="section-h">{t("relatedIn", { category: CAT_LABEL[part.cat] })}</h3>
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
            <p className="pdp-name">{t("description", { brand: part.brand, pn: part.pn })}</p>
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
                <span className="pulse" /> {t("engineersViewed", { count: part.views.toLocaleString() })}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                {t("leadTime")} · <strong style={{ color: "var(--ink)" }}>{part.lead}</strong>
              </div>
            </div>

            <RfqForm part={part} />
          </div>
        </div>
      </div>

      <Footer />
      <WaFloat partPn={part.pn} />
    </div>
  );
}
