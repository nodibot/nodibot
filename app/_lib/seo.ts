const siteURL = process.env.NEXT_PUBLIC_SITE_URL;
if (!siteURL) {
  throw new Error("NEXT_PUBLIC_SITE_URL is not set");
}
export const SITE_URL = siteURL;

export const SITE_NAME = "nodibot";

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}
