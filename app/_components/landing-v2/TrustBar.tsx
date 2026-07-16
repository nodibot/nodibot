import { useTranslations } from "next-intl";
import { Ic } from "@/app/_components/icons";

const ITEMS = [
  { key: "shipping" as const, Icon: Ic.truck },
  { key: "tested" as const, Icon: Ic.check },
  { key: "warranty" as const, Icon: Ic.shield },
  { key: "support" as const, Icon: Ic.whatsapp },
];

export function TrustBar() {
  const t = useTranslations("LandingV2");

  return (
    <section className="lp2-trust" aria-label={t("trustAria")}>
      <div className="wrap">
        <ul className="lp2-trust-row">
          {ITEMS.map(({ key, Icon }) => (
            <li key={key} className="lp2-trust-item">
              <span className="lp2-trust-icon" aria-hidden="true">
                <Icon />
              </span>
              <span>
                <strong>{t(`trust.${key}.title`)}</strong>
                <span className="lp2-trust-desc">{t(`trust.${key}.desc`)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
