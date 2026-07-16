// Static marketing sections for the landing page (server components).
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Ic } from "@/app/_components/icons";
import { WaChatLink } from "@/app/_components/WaChatLink";
import { withLocale } from "@/app/_lib/locale-path";
import { CATEGORIES, HOSTS } from "@/app/_lib/taxonomy";

export function HostStrip() {
  const t = useTranslations("LandingSections");

  return (
    <section className="lp-strip" id="hosts">
      <div className="wrap">
        <div className="lp-strip-label">{t("hostStrip")}</div>
        <div className="lp-strip-row">
          {HOSTS.map((h) => (
            <span className="host" key={h.id}>
              {h.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { n: "1", accent: false },
  { n: "2", accent: false },
  { n: "3", accent: true },
  { n: "4", accent: false },
];

export function HowItWorks() {
  const t = useTranslations("LandingSections");

  return (
    <section className="lp-section" id="how">
      <div className="wrap">
        <div className="lp-eyebrow">{t("howEyebrow")}</div>
        <h2 className="lp-h2">{t("howTitle")}</h2>
        <p className="lp-lead">{t("howLead")}</p>
        <div className="lp-steps">
          {STEPS.map((s) => (
            <div className={"lp-step" + (s.accent ? " accent" : "")} key={s.n}>
              <div className="connector" />
              <div className="num">{s.n}</div>
              <h3>{t(`steps.${s.n}.title`)}</h3>
              <p>{t(`steps.${s.n}.desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pillars() {
  const locale = useLocale();
  const t = useTranslations("LandingSections");

  return (
    <section className="lp-section tight" id="pillars" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="wrap">
        <div className="lp-eyebrow">{t("sourceEyebrow")}</div>
        <h2 className="lp-h2">{t("sourceTitle")}</h2>
        <div className="lp-pillars">
          {CATEGORIES.map((c, i) => (
            <Link
              className={"lp-pillar" + (i === 0 ? " span2" : "")}
              key={c.id}
              href={`${withLocale(locale, "/catalog")}?cat=${c.id}`}
            >
              <span className="tier">{c.tier}</span>
              <h3>{c.label}</h3>
              <p>{c.blurb}</p>
              <div className="go">
                {t("browse")} <Ic.arrowR />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const VALUES = [
  { icon: <Ic.shield />, key: "guarantee" },
  { icon: <Ic.clock />, key: "speed" },
  { icon: <Ic.tag />, key: "rfq" },
  { icon: <Ic.link />, key: "compat" },
];

export function WhyNodibot() {
  const t = useTranslations("LandingSections");

  return (
    <section className="lp-section lp-why">
      <div className="wrap">
        <div className="lp-eyebrow">{t("whyEyebrow")}</div>
        <h2 className="lp-h2">{t("whyTitle")}</h2>
        <div className="lp-values">
          {VALUES.map((v, i) => (
            <div className="lp-value" key={i}>
              <div className="ic">{v.icon}</div>
              <div>
                <h3>{t(`values.${v.key}.title`)}</h3>
                <p>{t(`values.${v.key}.desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SourcingConfidence() {
  const locale = useLocale();
  const t = useTranslations("LandingSections");

  return (
    <section className="lp-section">
      <div className="wrap">
        <div className="lp-price-grid">
          <div>
            <div className="lp-eyebrow">{t("confidenceEyebrow")}</div>
            <h2 className="lp-h2">{t("confidenceTitle")}</h2>
            <p className="lp-lead">{t("confidenceLead")}</p>
            <Link className="btn btn-dark btn-lg" style={{ marginTop: 26 }} href={withLocale(locale, "/catalog")}>
              {t("browseCatalog")} <Ic.arrowR />
            </Link>
          </div>
          <div className="lp-compare">
            <div className="lp-compare-head">
              <div>
                <div
                  className="brand"
                  style={{
                    fontSize: 11,
                    fontWeight: 650,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                    marginBottom: 3,
                  }}
                >
                  ABB · FlexPendant
                </div>
                <div className="pn mono">3HAC028357-001</div>
              </div>
              <span className="badge badge-life">{t("discontinued")}</span>
            </div>
            <div className="lp-compare-body">
              <div className="lp-compare-row muted">
                <span className="lbl">
                  <span className="dotc" style={{ background: "var(--muted)" }} />
                  {t("compatibility")}
                </span>
                <span className="amt">IRC5</span>
              </div>
              <div className="lp-compare-row">
                <span className="lbl">
                  <span className="dotc" style={{ background: "var(--accent)" }} />
                  {t("rfqReady")}
                </span>
                <span className="amt" style={{ color: "var(--accent)" }}>
                  {t("availability")}
                </span>
              </div>
            </div>
            <div className="lp-compare-foot">
              <Ic.tag style={{ width: 16, height: 16 }} /> {t("quoteConfirmed")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function EmergencyBand({ findPartHref }: { findPartHref?: string }) {
  const locale = useLocale();
  const t = useTranslations("LandingSections");

  return (
    <section className="lp-section tight">
      <div className="wrap">
        <div className="lp-band">
          <h2>{t("emergencyTitle")}</h2>
          <p>{t("emergencyText")}</p>
          <div className="cta-row">
            <WaChatLink className="btn btn-wa btn-lg">
              <Ic.whatsapp /> {t("chatNow")}
            </WaChatLink>
            <Link
              className="btn btn-lg"
              style={{
                background: "rgba(255,255,255,.12)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,.2)",
              }}
              href={findPartHref ?? withLocale(locale, "/catalog")}
            >
              <Ic.bolt /> {t("findMyPart")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  const locale = useLocale();
  const t = useTranslations("LandingSections");

  return (
    <section className="lp-section lp-final">
      <div className="wrap lp-center">
        <div className="lp-eyebrow">{t("startEyebrow")}</div>
        <h2>{t("startTitle")}</h2>
        <p className="lp-lead">{t("startLead")}</p>
        <div className="cta-row">
          <Link className="btn btn-primary btn-lg" href={withLocale(locale, "/catalog")}>
            <Ic.search /> {t("searchCatalog")}
          </Link>
          <Link className="btn btn-ghost btn-lg" href={withLocale(locale, "/catalog")}>
            <Ic.doc /> {t("requestQuote")}
          </Link>
        </div>
      </div>
    </section>
  );
}
