"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { PartImage } from "@/app/_components/badges";
import { BrandGrid } from "@/app/_components/landing-v2/BrandGrid";
import { trackEvent } from "@/app/_lib/analytics-client";
import { withLocale } from "@/app/_lib/locale-path";
import type { Part } from "@/app/_lib/types";

export function ReadyToShip({ parts }: { parts: Part[] }) {
  const locale = useLocale();
  const t = useTranslations("LandingV2");

  return (
    <section className="lp2-section lp2-shop" id="ready-to-ship">
      <div className="wrap">
        <BrandGrid />

        <div className="lp2-section-head lp2-section-head-row">
          <div>
            <h2 className="lp2-h2">{t("readyTitle")}</h2>
            <p className="lp2-lead">{t("readyLead")}</p>
          </div>
          <Link className="btn btn-ghost" href={withLocale(locale, "/catalog")}>
            {t("readyBrowseAll")}
          </Link>
        </div>

        {parts.length === 0 ? (
          <p className="lp2-empty">{t("readyEmpty")}</p>
        ) : (
          <div className="lp2-ready-grid">
            {parts.map((part) => (
              <Link
                key={part.id}
                className="lp2-ready-card"
                href={withLocale(locale, `/products/${encodeURIComponent(part.pn)}`)}
                onClick={() =>
                  trackEvent({
                    event_name: "homepage_ready_product_click",
                    part_pn: part.pn,
                    metadata: { brand: part.brand, surface: "ready_to_ship" },
                  })
                }
              >
                <div className="lp2-ready-img">
                  <PartImage part={part} />
                </div>
                <div className="lp2-ready-body">
                  <div className="lp2-ready-brand">{part.brand}</div>
                  <div className="lp2-ready-pn mono">{part.pn}</div>
                  <p className="lp2-ready-name">{part.name}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
