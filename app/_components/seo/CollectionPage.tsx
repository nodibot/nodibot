import Link from "next/link";
import { Header } from "@/app/_components/header";
import { Footer } from "@/app/_components/footer";
import { WaFloat } from "@/app/_components/wa-float";
import { ProductCard } from "@/app/_components/catalog/ProductCard";
import { Ic } from "@/app/_components/icons";
import { withLocale } from "@/app/_lib/locale-path";
import { absoluteUrl } from "@/app/_lib/seo";
import {
  BRAND_COLLECTIONS,
  CATEGORY_COLLECTIONS,
  type SeoCollection,
  type SeoLocale,
} from "@/app/_lib/seo-collections";
import type { Part } from "@/app/_lib/types";

function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function CollectionPage({
  collection,
  parts,
  locale,
}: {
  collection: SeoCollection;
  parts: Part[];
  locale: SeoLocale;
}) {
  const title = collection.title[locale];
  const kindLabel =
    collection.kind === "brand"
      ? locale === "ko"
        ? "브랜드"
        : "Brands"
      : locale === "ko"
        ? "카테고리"
        : "Categories";
  const routePrefix = collection.kind === "brand" ? "brands" : "categories";
  const path = withLocale(locale, `/${routePrefix}/${collection.slug}`);
  const relatedCollections =
    collection.kind === "brand" ? BRAND_COLLECTIONS : CATEGORY_COLLECTIONS;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "ko" ? "홈" : "Home",
        item: absoluteUrl(withLocale(locale, "/")),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title,
        item: absoluteUrl(path),
      },
    ],
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: collection.faq[locale].map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="app seo-collection">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
      />
      <Header variant="app" />

      <main>
        <section className="seo-collection-hero">
          <div className="wrap">
            <nav className="breadcrumb" aria-label={locale === "ko" ? "경로" : "Breadcrumb"}>
              <Link href={withLocale(locale, "/")}>{locale === "ko" ? "홈" : "Home"}</Link>
              <span className="sep"><Ic.chevron /></span>
              <span>{kindLabel}</span>
              <span className="sep"><Ic.chevron /></span>
              <span>{title}</span>
            </nav>
            <p className="seo-collection-kicker">{kindLabel}</p>
            <h1>{title}</h1>
            <p className="seo-collection-summary">{collection.metaDescription[locale]}</p>
            <Link
              className="btn btn-primary btn-lg"
              href={withLocale(locale, collection.catalogHref)}
            >
              {locale === "ko" ? "전체 재고 필터 보기" : "View all matching inventory"}
              <Ic.arrowR />
            </Link>
          </div>
        </section>

        <section className="seo-collection-products">
          <div className="wrap">
            <div className="seo-collection-heading">
              <h2>{locale === "ko" ? "관련 부품" : "Relevant parts"}</h2>
              <span>
                {locale === "ko"
                  ? `${parts.length}개 결과`
                  : `${parts.length} ${parts.length === 1 ? "result" : "results"}`}
              </span>
            </div>
            {parts.length > 0 ? (
              <div className="grid density-regular catalog-card-grid">
                {parts.slice(0, 12).map((part) => (
                  <ProductCard key={part.id} part={part} />
                ))}
              </div>
            ) : (
              <div className="seo-collection-empty">
                <h2>{locale === "ko" ? "공개 재고를 확인 중입니다." : "Published inventory is being checked."}</h2>
                <p>
                  {locale === "ko"
                    ? "정확한 부품 번호를 보내 주시면 세컨더리 마켓 재고를 확인합니다."
                    : "Send the exact part number and the sourcing desk will check secondary-market availability."}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="seo-collection-copy">
          <div className="wrap seo-collection-copy-grid">
            <article>
              <h2>{locale === "ko" ? `${title} 소싱 가이드` : `${title} sourcing guide`}</h2>
              {collection.intro[locale].map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </article>
            <aside>
              <h2>{locale === "ko" ? "관련 페이지" : "Related pages"}</h2>
              <div className="seo-related-links">
                {relatedCollections
                  .filter((entry) => entry.slug !== collection.slug)
                  .map((entry) => (
                    <Link
                      key={entry.slug}
                      href={withLocale(locale, `/${routePrefix}/${entry.slug}`)}
                    >
                      {entry.title[locale]}
                      <Ic.arrowR />
                    </Link>
                  ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="seo-collection-faq">
          <div className="wrap">
            <h2>{locale === "ko" ? "자주 묻는 질문" : "Frequently asked questions"}</h2>
            <div className="seo-faq-list">
              {collection.faq[locale].map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WaFloat />
    </div>
  );
}
