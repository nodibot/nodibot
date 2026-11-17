import { routing } from "@/i18n/routing";
import { withLocale } from "@/app/_lib/locale-path";

const siteURL = process.env.NEXT_PUBLIC_SITE_URL;
if (!siteURL) {
  throw new Error("NEXT_PUBLIC_SITE_URL is not set");
}
export const SITE_URL = siteURL;

export const SITE_NAME = "nodibot";

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

/** hreflang map for the public locales, plus x-default → English. */
export function localeLanguages(path: string): Record<string, string> {
  const languages: Record<string, string> = {
    "x-default": withLocale(routing.defaultLocale, path),
  };
  for (const locale of routing.locales) {
    languages[locale] = withLocale(locale, path);
  }
  return languages;
}
