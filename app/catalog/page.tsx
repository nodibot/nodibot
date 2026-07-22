import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Header } from "@/app/_components/header";
import { Footer } from "@/app/_components/footer";
import { WaFloat } from "@/app/_components/wa-float";
import { CatalogView } from "@/app/_components/catalog/CatalogView";
import { getActiveParts } from "@/app/_lib/parts";
import { HOST_BY_ID } from "@/app/_lib/taxonomy";
import { withLocale } from "@/app/_lib/locale-path";
import { localeLanguages } from "@/app/_lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const canonical = withLocale(locale, "/catalog");
  return {
    title: "Catalog — search secondary-market automation parts",
    description:
      "Search verified refurbished controllers, servo drives, teach pendants and reducers by exact part number. Filter by category, host system and availability.",
    alternates: {
      canonical,
      languages: localeLanguages("/catalog"),
    },
    openGraph: {
      title: "Catalog — search secondary-market automation parts",
      description:
        "Search nodibot's catalog of verified secondary-market controllers, drives, teach pendants, reducers, and automation modules by exact part number.",
      url: canonical,
      type: "website",
    },
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; host?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { q, cat, host } = params;
  const initialHost = host && HOST_BY_ID[host] ? host : null;
  const parts = await getActiveParts();

  return (
    <div className="app app-catalog">
      <Header variant="app" initialQuery={q ?? ""} key={q ?? ""} />
      <CatalogView
        parts={parts}
        initialQuery={q ?? ""}
        initialCat={cat ?? null}
        initialHost={initialHost}
        searchParams={params}
      />
      <Footer />
      <WaFloat />
    </div>
  );
}
