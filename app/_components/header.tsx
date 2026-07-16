"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Ic } from "./icons";
import { LogoMark } from "./logo";
import { withLocale } from "@/app/_lib/locale-path";

const THEME_KEY = "nodibot-theme";

function useDarkMode(): [boolean, () => void] {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark",
  );

  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      const theme = next ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", theme);
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return [dark, toggle];
}

function Brand() {
  const locale = useLocale();
  return (
    <Link href={withLocale(locale, "/")} className="brand">
      <LogoMark />
      <div className="brand-name">
        nod<span className="dot">i</span>bot
      </div>
    </Link>
  );
}

function ThemeToggle({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  const t = useTranslations("Header");
  return (
    <button
      className="topbar-link"
      onClick={toggle}
      style={{ display: "flex", alignItems: "center" }}
      title={t("toggleTheme")}
      aria-label={t("toggleTheme")}
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}

export function Header({
  variant = "app",
  initialQuery = "",
  showTheme,
}: {
  variant?: "app" | "landing" | "landing-v2";
  initialQuery?: string;
  /** Defaults: on for classic landing only; off for catalog + landing-v2. */
  showTheme?: boolean;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Header");
  const [dark, toggle] = useDarkMode();
  const [query, setQuery] = useState(initialQuery);
  const themeVisible = showTheme ?? variant === "landing";

  const goSearch = (q: string) => {
    const trimmed = q.trim();
    const catalogPath = withLocale(locale, "/catalog");
    router.push(trimmed ? `${catalogPath}?q=${encodeURIComponent(trimmed)}` : catalogPath);
  };

  return (
    <header className="topbar">
      <div className="wrap topbar-inner">
        <Brand />

        {variant === "app" ? (
          <div className="searchbar">
            <Ic.search />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goSearch(query)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchAria")}
            />
          </div>
        ) : variant === "landing-v2" ? (
          <>
            <nav className="topbar-actions" style={{ marginLeft: 18, gap: 2 }}>
              <a className="topbar-link" href="#ready-to-ship">
                {t("inventory")}
              </a>
              <a className="topbar-link" href="#brands">
                {t("brands")}
              </a>
              <a className="topbar-link" href="#how">
                {t("howItWorks")}
              </a>
            </nav>
            <div className="spacer" />
          </>
        ) : (
          <>
            <nav className="topbar-actions" style={{ marginLeft: 18, gap: 2 }}>
              <Link className="topbar-link" href={withLocale(locale, "/catalog")}>
                {t("catalog")}
              </Link>
              <a className="topbar-link" href="#how">
                {t("howItWorks")}
              </a>
              <a className="topbar-link" href="#pillars">
                {t("categories")}
              </a>
            </nav>
            <div className="spacer" />
          </>
        )}

        {(variant === "app" || themeVisible) && (
          <div className="topbar-actions">
            {variant === "app" && (
              <Link className="topbar-link" href={withLocale(locale, "/catalog")}>
                {t("sellParts")}
              </Link>
            )}
            {themeVisible && <ThemeToggle dark={dark} toggle={toggle} />}
          </div>
        )}
      </div>
    </header>
  );
}
