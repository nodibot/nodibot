"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { trackEvent } from "@/app/_lib/analytics-client";
import { withLocale } from "@/app/_lib/locale-path";
import { HOST_BY_ID } from "@/app/_lib/taxonomy";

const BRAND_IDS = ["abb"] as const;
const BRAND_SLUGS: Record<(typeof BRAND_IDS)[number], string> = {
  abb: "abb",
};

/** Compact brand chip row — intended to sit inside the Ready to ship section. */
export function BrandGrid() {
  const locale = useLocale();
  const t = useTranslations("LandingV2");

  return (
    <div className="lp2-brand-strip" id="brands">
      <div className="lp2-brand-strip-label">{t("brandsTitle")}</div>
      <div className="lp2-brand-chips">
        {BRAND_IDS.map((id) => {
          const host = HOST_BY_ID[id];
          if (!host) return null;
          return (
            <Link
              key={id}
              className="lp2-brand-chip"
              href={withLocale(locale, `/brands/${BRAND_SLUGS[id]}`)}
              onClick={() =>
                trackEvent({
                  event_name: "homepage_brand_click",
                  metadata: { brand: id, surface: "brand_grid" },
                })
              }
            >
              {host.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
