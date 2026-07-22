import type { MetadataRoute } from "next";
import { withLocale } from "@/app/_lib/locale-path";
import { getActiveParts } from "@/app/_lib/parts";
import { absoluteUrl } from "@/app/_lib/seo";
import {
  BRAND_COLLECTIONS,
  CATEGORY_COLLECTIONS,
} from "@/app/_lib/seo-collections";
import { routing, type Locale } from "@/i18n/routing";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const parts = await getActiveParts();
  const now = new Date();
  const locales = [...routing.locales] as Locale[];

  const staticRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) => [
    {
      url: absoluteUrl(withLocale(locale, "/")),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: absoluteUrl(withLocale(locale, "/catalog")),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: absoluteUrl(withLocale(locale, "/bulk-rfq")),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
  ]);

  const collectionRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) => [
    ...BRAND_COLLECTIONS.map((collection) => ({
      url: absoluteUrl(withLocale(locale, `/brands/${collection.slug}`)),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    ...CATEGORY_COLLECTIONS.map((collection) => ({
      url: absoluteUrl(withLocale(locale, `/categories/${collection.slug}`)),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  ]);

  const productRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    parts.map((part) => ({
    url: absoluteUrl(withLocale(locale, `/products/${encodeURIComponent(part.pn)}`)),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
    })),
  );

  return [...staticRoutes, ...collectionRoutes, ...productRoutes];
}
