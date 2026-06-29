"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Ic } from "@/app/_components/icons";
import { trackEvent } from "@/app/_lib/analytics-client";
import { withLocale } from "@/app/_lib/locale-path";
import { NoMatchRfqForm } from "@/app/_components/rfq/NoMatchRfqForm";
import { ProductCard, ProductListItem } from "./ProductCard";
import { CATEGORIES, HOSTS } from "@/app/_lib/taxonomy";
import {
  computeCounts,
  filterParts,
  sortParts,
  type SortKey,
} from "@/app/_lib/catalog";
import type { Part } from "@/app/_lib/types";

type Group = "cats" | "hosts" | "stock";
const STOCK_OPTS = ["in", "request"] as const;

function CatalogHero({
  hostFilter,
  toggleHost,
}: {
  hostFilter: string[];
  toggleHost: (id: string) => void;
}) {
  const t = useTranslations("Catalog");
  return (
    <section className="hero">
      <div className="wrap">
        <h1>
          {t("heroTitlePrefix")}<em>{t("heroTitleEmphasis")}</em>
        </h1>
        <p>{t("heroSubtitle")}</p>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="n">12,400+</div>
            <div className="l">{t("indexed")}</div>
          </div>
          <div className="hero-stat">
            <div className="n">&lt; 2 hrs</div>
            <div className="l">{t("medianResponse")}</div>
          </div>
          <div className="hero-stat">
            <div className="n">7</div>
            <div className="l">{t("hostFamilies")}</div>
          </div>
        </div>
        <div className="host-row">
          {HOSTS.map((h) => (
            <button
              key={h.id}
              className={"host-chip" + (hostFilter.includes(h.id) ? " on" : "")}
              onClick={() => toggleHost(h.id)}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CatalogView({
  parts,
  initialQuery = "",
  initialCat = null,
}: {
  parts: Part[];
  initialQuery?: string;
  initialCat?: string | null;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Catalog");
  const [sel, setSel] = useState<Record<Group, string[]>>({
    cats: initialCat ? [initialCat] : [],
    hosts: [],
    stock: [],
  });
  const [sort, setSort] = useState<SortKey>("demand");
  const [mobileQuery, setMobileQuery] = useState(initialQuery);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const mounted = useRef(false);
  const trackedNoResultQueries = useRef<Set<string>>(new Set());
  const query = initialQuery;

  const toggle = (group: Group, id: string) =>
    setSel((s) => ({
      ...s,
      [group]: s[group].includes(id) ? s[group].filter((x) => x !== id) : [...s[group], id],
    }));

  const counts = useMemo(() => computeCounts(parts), [parts]);

  const results = useMemo(
    () =>
      sortParts(
        filterParts(parts, { cats: sel.cats, hosts: sel.hosts, stock: sel.stock, query }),
        sort,
      ),
    [parts, sel, query, sort],
  );

  const activeFilterCount = sel.cats.length + sel.hosts.length + sel.stock.length;
  const goSearch = () => {
    const trimmed = mobileQuery.trim();
    trackEvent({
      event_name: "catalog_search",
      query: trimmed || undefined,
      metadata: { has_query: Boolean(trimmed) },
    });
    const catalogPath = withLocale(locale, "/catalog");
    router.push(trimmed ? `${catalogPath}?q=${encodeURIComponent(trimmed)}` : catalogPath);
  };

  useEffect(() => {
    if (!mounted.current) return;
    trackEvent({
      event_name: "catalog_filter_change",
      query: query || undefined,
      metadata: { cats: sel.cats, hosts: sel.hosts, stock: sel.stock, results: results.length },
    });
  }, [sel, query, results.length]);

  useEffect(() => {
    if (!mounted.current) return;
    trackEvent({
      event_name: "catalog_sort_change",
      query: query || undefined,
      metadata: { sort, results: results.length },
    });
  }, [sort, query, results.length]);

  useEffect(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery || results.length > 0 || trackedNoResultQueries.current.has(normalizedQuery)) return;

    trackedNoResultQueries.current.add(normalizedQuery);
    trackEvent({
      event_name: "catalog_no_results",
      query,
      metadata: {
        cats: sel.cats,
        hosts: sel.hosts,
        stock: sel.stock,
      },
    });
  }, [query, results.length, sel.cats, sel.hosts, sel.stock]);

  useEffect(() => {
    mounted.current = true;
  }, []);

  return (
    <>
      <CatalogHero hostFilter={sel.hosts} toggleHost={(id) => toggle("hosts", id)} />
      <div className="wrap">
        <div className="mobile-catalog-bar">
          <button
            className="btn btn-ghost"
            type="button"
            aria-expanded={searchOpen}
            aria-controls="mobile-catalog-search"
            onClick={() => setSearchOpen((open) => !open)}
          >
            <Ic.search />
            {t("search")}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="catalog-filters"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            {t("filters")}
            {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
          </button>
          <select
            className="select"
            value={sort}
            aria-label={t("sortAria")}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="demand">{t("mostRequested")}</option>
            <option value="brand">{t("brandAz")}</option>
            <option value="category">{t("categoryAz")}</option>
          </select>
        </div>
        <div
          id="mobile-catalog-search"
          className={"mobile-catalog-search" + (searchOpen ? " open" : "")}
        >
          <div className="searchbar">
            <Ic.search />
            <input
              value={mobileQuery}
              onChange={(e) => setMobileQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goSearch()}
              placeholder={t("pastePart")}
              aria-label={t("search")}
            />
          </div>
          <button className="btn btn-primary" type="button" onClick={goSearch}>
            {t("find")}
          </button>
        </div>
        <div className="catalog">
          <aside id="catalog-filters" className={"filters" + (filtersOpen ? " open" : "")}>
            <div className="filter-group">
              <h3 className="filter-h">{t("category")}</h3>
              {CATEGORIES.map((c) => {
                const on = sel.cats.includes(c.id);
                return (
                  <div
                    key={c.id}
                    className={"filter-opt" + (on ? " on" : "")}
                    onClick={() => toggle("cats", c.id)}
                  >
                    <span className="box">{on && <Ic.check />}</span>
                    {c.label}
                    <span className="count">{counts.cat[c.id] || 0}</span>
                  </div>
                );
              })}
            </div>
            <div className="filter-group">
              <h3 className="filter-h">{t("hostSystem")}</h3>
              {HOSTS.map((h) => {
                const on = sel.hosts.includes(h.id);
                return (
                  <div
                    key={h.id}
                    className={"filter-opt" + (on ? " on" : "")}
                    onClick={() => toggle("hosts", h.id)}
                  >
                    <span className="box">{on && <Ic.check />}</span>
                    {h.label}
                    <span className="count">{counts.host[h.id] || 0}</span>
                  </div>
                );
              })}
            </div>
            <div className="filter-group">
              <h3 className="filter-h">{t("availability")}</h3>
              {STOCK_OPTS.map((id) => {
                const on = sel.stock.includes(id);
                return (
                  <div
                    key={id}
                    className={"filter-opt" + (on ? " on" : "")}
                    onClick={() => toggle("stock", id)}
                  >
                    <span className="box">{on && <Ic.check />}</span>
                    {id === "in" ? t("inStock") : t("sourceOnRequest")}
                  </div>
                );
              })}
            </div>
          </aside>

          <div>
            <div className="results-head">
              <div>
                <h2 className="results-title">
                  {query ? t("resultsFor", { query }) : t("allInventory")}
                </h2>
                <p className="results-sub">
                  {t("partsDemand", { count: results.length })}
                </p>
              </div>
              <div className="results-tools">
                <select
                  className="select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                >
                  <option value="demand">{t("sortMostRequested")}</option>
                  <option value="brand">{t("sortBrand")}</option>
                  <option value="category">{t("sortCategory")}</option>
                </select>
              </div>
            </div>

            {results.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center", color: "var(--muted)" }}>
                <p style={{ fontSize: 15 }}>{t("noMatchTitle")}</p>
                <p style={{ fontSize: 13 }}>{t("noMatchText")}</p>
              </div>
            ) : (
              <>
                <div className="grid density-regular catalog-card-grid">
                  {results.map((p) => (
                    <ProductCard key={p.id} part={p} />
                  ))}
                </div>
                <div className="part-list">
                  {results.map((p) => (
                    <ProductListItem key={p.id} part={p} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
