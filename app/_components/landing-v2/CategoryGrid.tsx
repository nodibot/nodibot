"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Ic } from "@/app/_components/icons";
import { trackEvent } from "@/app/_lib/analytics-client";
import { withLocale } from "@/app/_lib/locale-path";

const CATEGORY_TILES = [
  { key: "drives" as const, slug: "servo-drives", Icon: Ic.bolt },
  { key: "plcs" as const, slug: "plcs", Icon: Ic.cube },
  { key: "hmi" as const, slug: "hmi-panels", Icon: Ic.spark },
  { key: "pendants" as const, slug: "robot-pendants", Icon: Ic.phone },
];

export function CategoryGrid() {
  const locale = useLocale();
  const t = useTranslations("LandingV2");

  return (
    <section className="lp2-section lp2-section-tight" id="categories">
      <div className="wrap">
        <div className="lp2-section-head">
          <h2 className="lp2-h2">{t("categoriesTitle")}</h2>
          <p className="lp2-lead">{t("categoriesLead")}</p>
        </div>
        <div className="lp2-cat-grid">
          {CATEGORY_TILES.map(({ key, slug, Icon }) => (
            <Link
              key={key}
              className="lp2-cat-tile"
              href={withLocale(locale, `/categories/${slug}`)}
              onClick={() =>
                trackEvent({
                  event_name: "homepage_category_click",
                  metadata: { category: slug, surface: "category_grid" },
                })
              }
            >
              <span className="lp2-cat-icon" aria-hidden="true">
                <Icon />
              </span>
              <span className="lp2-cat-label">{t(`categories.${key}`)}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
