"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Ic } from "@/app/_components/icons";
import { withLocale } from "@/app/_lib/locale-path";

const EXAMPLES = ["3HAC050363-001", "A06B-6114-H206", "6ES7315-2AH14-0AB0"];

export function LandingHero() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("LandingHero");
  const [q, setQ] = useState("");

  const go = (value: string) => {
    const trimmed = value.trim();
    const catalogPath = withLocale(locale, "/catalog");
    router.push(trimmed ? `${catalogPath}?q=${encodeURIComponent(trimmed)}` : catalogPath);
  };

  return (
    <section className="lp-hero">
      <div className="wrap lp-hero-grid">
        <div>
          <div className="lp-status">
            <span className="pulse" /> {t("status")}
          </div>
          <h1>
            {t("titlePrefix")}<em>{t("titleEmphasis")}</em>
          </h1>
          <p className="sub">{t("subtitle")}</p>

          <div className="lp-search">
            <div className="lp-search-label">
              <Ic.search style={{ width: 14, height: 14 }} /> {t("searchLabel")}
            </div>
            <div className="lp-search-box">
              <div className="lp-search-input">
                <Ic.search />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && go(q)}
                  placeholder={t("searchPlaceholder")}
                  aria-label={t("searchAria")}
                />
              </div>
              <button className="btn btn-primary btn-lg" onClick={() => go(q)}>
                <Ic.bolt /> {t("findIt")}
              </button>
            </div>
            <div className="lp-chip-try">
              <span style={{ fontSize: 12, color: "var(--muted)", alignSelf: "center", marginRight: 2 }}>
                {t("try")}
              </span>
              {EXAMPLES.map((e) => (
                <button key={e} onClick={() => go(e)}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="lp-hero-stats">
            <div>
              <div className="n">
                &lt; <em>2</em> hrs
              </div>
              <div className="l">{t("medianResponse")}</div>
            </div>
            <div>
              <div className="n">
                12,400<em>+</em>
              </div>
              <div className="l">{t("indexed")}</div>
            </div>
            <div>
              <div className="n">
                <em>7</em>
              </div>
              <div className="l">{t("hosts")}</div>
            </div>
          </div>
        </div>

        {/* hero visual: stacked "found part" cards + quote float */}
        <div className="lp-hero-visual">
          <div className="lp-fcard c1">
            <div className="ph" style={{ aspectRatio: "16/10" }}>
              <span className="ph-label">{t("teachPendant")}</span>
            </div>
            <div className="brand">ABB</div>
            <div className="row">
              <span className="pn mono">3HAC028357-001</span>
              <span className="badge badge-in">
                <span className="dot-s" style={{ background: "var(--in-stock)" }} />
                {t("found")}
              </span>
            </div>
            <div className="price">
              <span className="cur">{t("statusLabel")} </span>{t("rfqReady")}
            </div>
          </div>
          <div className="lp-fcard c2">
            <div className="ph" style={{ aspectRatio: "16/10" }}>
              <span className="ph-label">{t("servoDrive")}</span>
            </div>
            <div className="brand">Fanuc</div>
            <div className="row">
              <span className="pn mono">A06B-6114-H206</span>
            </div>
            <div className="price">
              <span className="cur">{t("statusLabel")} </span>{t("sourceOnRequest")}
            </div>
          </div>
          <div className="lp-fcard c3">
            <div className="ph" style={{ aspectRatio: "16/10" }}>
              <span className="ph-label">{t("gearReducer")}</span>
            </div>
            <div className="brand">Nabtesco</div>
            <div className="row">
              <span className="pn mono">RV-40E</span>
            </div>
            <div className="price">
              <span className="cur">{t("statusLabel")} </span>{t("compatChecked")}
            </div>
          </div>
          <div className="lp-quote-float">
            <div className="t">
              <Ic.clock style={{ width: 13, height: 13 }} /> {t("quoteReady")}
            </div>
            <div className="b">{t("sourcesSave")}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
