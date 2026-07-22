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

/** hreflang map for en/ko plus x-default → English. */
export function localeLanguages(path: string): Record<string, string> {
  return {
    en: withLocale("en", path),
    ko: withLocale("ko", path),
    "x-default": withLocale("en", path),
  };
}
