"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Ic } from "@/app/_components/icons";
import { WaChatLink } from "@/app/_components/WaChatLink";
import { trackEvent } from "@/app/_lib/analytics-client";
import { withLocale } from "@/app/_lib/locale-path";

export function HeroSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("LandingV2");
  const [q, setQ] = useState(initialQuery);

  const go = (value: string) => {
    const trimmed = value.trim();
    const path = withLocale(locale, "/catalog");
    if (trimmed) {
      trackEvent({
        event_name: "homepage_search",
        query: trimmed,
        metadata: { surface: "hero" },
      });
    }
    router.push(trimmed ? `${path}?q=${encodeURIComponent(trimmed)}` : path);
  };

  return (
    <section className="lp2-hero">
      <div className="wrap lp2-hero-inner">
        <h1 className="lp2-hero-title">{t("heroTitle")}</h1>
        <p className="lp2-hero-sub">{t("heroSubtitle")}</p>

        <form
          className="lp2-search"
          onSubmit={(e) => {
            e.preventDefault();
            go(q);
          }}
        >
          <div className="lp2-search-input">
            <Ic.search />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchAria")}
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg lp2-search-btn">
            {t("searchButton")}
          </button>
        </form>
      </div>
    </section>
  );
}
