"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Ic } from "@/app/_components/icons";
import { trackEvent } from "@/app/_lib/analytics-client";
import { withLocale } from "@/app/_lib/locale-path";

export function BomDropzone() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("LandingV2");
  const bulkPath = withLocale(locale, "/bulk-rfq");

  const goBulk = () => {
    trackEvent({
      event_name: "homepage_bulk_rfq_open",
      metadata: { surface: "bom_dropzone" },
    });
    router.push(bulkPath);
  };

  return (
    <section className="lp2-section" id="bom">
      <div className="wrap">
        <div className="lp2-section-head lp2-center">
          <h2 className="lp2-h2">{t("bomTitle")}</h2>
          <p className="lp2-lead">{t("bomLead")}</p>
        </div>

        <button
          type="button"
          className="lp2-bom-drop"
          onClick={goBulk}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            goBulk();
          }}
        >
          <span className="lp2-bom-icon" aria-hidden="true">
            <Ic.doc />
          </span>
          <span className="lp2-bom-drop-label">{t("bomDropLabel")}</span>
          <span className="lp2-bom-cta">{t("bomCta")}</span>
        </button>
      </div>
    </section>
  );
}
