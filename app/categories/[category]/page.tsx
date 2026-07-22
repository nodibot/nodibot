import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { CollectionPage } from "@/app/_components/seo/CollectionPage";
import { withLocale } from "@/app/_lib/locale-path";
import { getActiveParts } from "@/app/_lib/parts";
import { absoluteUrl, localeLanguages } from "@/app/_lib/seo";
import {
  CATEGORY_COLLECTIONS,
  getSeoCollection,
  getSeoCollectionParts,
  type SeoLocale,
} from "@/app/_lib/seo-collections";

export function generateStaticParams() {
  return CATEGORY_COLLECTIONS.map((collection) => ({ category: collection.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const collection = getSeoCollection("category", category);
  if (!collection) return { title: "Category not found", robots: { index: false } };

  const locale = (await getLocale()) as SeoLocale;
  const path = `/categories/${collection.slug}`;
  const localizedPath = withLocale(locale, path);
  const title = `${collection.title[locale]} — tested surplus inventory`;
  const description = collection.metaDescription[locale];

  return {
    title,
    description,
    alternates: {
      canonical: localizedPath,
      languages: localeLanguages(path),
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(localizedPath),
      type: "website",
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const collection = getSeoCollection("category", category);
  if (!collection) notFound();

  const [locale, allParts] = await Promise.all([
    getLocale() as Promise<SeoLocale>,
    getActiveParts(),
  ]);
  const parts = getSeoCollectionParts(collection, allParts);

  return <CollectionPage collection={collection} parts={parts} locale={locale} />;
}
