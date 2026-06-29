"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Ic } from "./icons";
import { LogoMark } from "./logo";
import { replaceLocale, withLocale } from "@/app/_lib/locale-path";

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

function LanguageSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("Header");

  const switchLocale = (nextLocale: string) => {
    const query = searchParams.toString();
    const nextPath = replaceLocale(pathname, nextLocale);
    router.push(query ? `${nextPath}?${query}` : nextPath);
  };

  return (
    <select
      className="locale-select"
      aria-label={t("language")}
      value={locale}
      onChange={(event) => switchLocale(event.target.value)}
    >
      <option value="en">EN</option>
      <option value="ko">KO</option>
    </select>
  );
}

export function Header({
  variant = "app",
  initialQuery = "",
}: {
  variant?: "app" | "landing";
  initialQuery?: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Header");
  const [dark, toggle] = useDarkMode();
  const [query, setQuery] = useState(initialQuery);

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

        <div className="topbar-actions">
          {variant === "app" && (
            <Link className="topbar-link" href={withLocale(locale, "/catalog")}>
              {t("sellParts")}
            </Link>
          )}
          <LanguageSelect />
          <span className="divider-v" />
          <ThemeToggle dark={dark} toggle={toggle} />
        </div>
      </div>
    </header>
  );
}
