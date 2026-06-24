export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
export const SITE_NAME = "nodibot";

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}
