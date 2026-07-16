"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { replaceLocale } from "@/app/_lib/locale-path";

export function LanguageSelect({ className = "locale-select" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("Header");

  const switchLocale = (nextLocale: string) => {
    const query = searchParams.toString();
    const nextPath = replaceLocale(pathname, nextLocale);
    router.push(query ? `${nextPath}?${query}` : nextPath);
  };

  return (
    <select
      className={className}
      aria-label={t("language")}
      value={locale}
      onChange={(event) => switchLocale(event.target.value)}
    >
      <option value="en">EN</option>
      <option value="ko">KO</option>
    </select>
  );
}
