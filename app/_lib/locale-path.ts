export function withLocale(locale: string, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}

export function replaceLocale(pathname: string, nextLocale: string): string {
  const segments = pathname.split("/");
  if (segments[1] === "en" || segments[1] === "ko") {
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  }

  return withLocale(nextLocale, pathname);
}
