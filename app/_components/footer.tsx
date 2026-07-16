import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LanguageSelect } from "./LanguageSelect";
import { LogoMark } from "./logo";
import { withLocale } from "@/app/_lib/locale-path";

export function Footer() {
  const locale = useLocale();
  const t = useTranslations("Footer");

  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <Link href={withLocale(locale, "/")} className="brand">
          <LogoMark />
          <div className="brand-name">
            nod<span className="dot">i</span>bot
          </div>
        </Link>
        <div className="footer-meta">
          <div className="muted">{t("tagline")}</div>
          <LanguageSelect />
        </div>
      </div>
    </footer>
  );
}
