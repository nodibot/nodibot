"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Ic } from "./icons";
import { LogoMark } from "./logo";

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
  return (
    <Link href="/" className="brand">
      <LogoMark />
      <div className="brand-name">
        nod<span className="dot">i</span>bot
      </div>
    </Link>
  );
}

function ThemeToggle({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  return (
    <button
      className="topbar-link"
      onClick={toggle}
      style={{ display: "flex", alignItems: "center" }}
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      {dark ? "☀" : "☾"}
    </button>
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
  const [dark, toggle] = useDarkMode();
  const [query, setQuery] = useState(initialQuery);

  const goSearch = (q: string) => {
    const trimmed = q.trim();
    router.push(trimmed ? `/catalog?q=${encodeURIComponent(trimmed)}` : "/catalog");
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
              placeholder="Paste a part number — e.g. 3HAC050363-001, A06B-6114-H206…"
              aria-label="Search parts"
            />
          </div>
        ) : (
          <>
            <nav className="topbar-actions" style={{ marginLeft: 18, gap: 2 }}>
              <Link className="topbar-link" href="/catalog">
                Catalog
              </Link>
              <a className="topbar-link" href="#how">
                How it works
              </a>
              <a className="topbar-link" href="#pillars">
                Categories
              </a>
            </nav>
            <div className="spacer" />
          </>
        )}

        <div className="topbar-actions">
          {variant === "app" && (
            <Link className="topbar-link" href="/catalog">
              Sell parts
            </Link>
          )}
          <span className="divider-v" />
          <ThemeToggle dark={dark} toggle={toggle} />
        </div>
      </div>
    </header>
  );
}
