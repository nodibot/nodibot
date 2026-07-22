"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Ic } from "@/app/_components/icons";
import { trackEvent } from "@/app/_lib/analytics-client";
import { NoMatchRfqForm } from "@/app/_components/rfq/NoMatchRfqForm";
import { withLocale } from "@/app/_lib/locale-path";
import { ProductCard, ProductListItem } from "./ProductCard";
import { CatalogScrollReveal, useMobileCatalogLayout } from "./CatalogScrollReveal";
import { CatalogScrollDepthTracker } from "./CatalogScrollDepth";
import { CatalogTopbarMeasure, scrollToCatalogResults } from "./CatalogTopbarMeasure";
import { Pagination, paginateItems, parsePageParam, clampPageForTotal } from "@/app/_components/Pagination";
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
const CATALOG_PAGE_SIZE = 20;

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
  initialHost = null,
  searchParams = {},
}: {
  parts: Part[];
  initialQuery?: string;
  initialCat?: string | null;
  initialHost?: string | null;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const locale = useLocale();
  const t = useTranslations("Catalog");
  const isMobileCatalog = useMobileCatalogLayout();
  const [sel, setSel] = useState<Record<Group, string[]>>({
    cats: initialCat ? [initialCat] : [],
    hosts: initialHost ? [initialHost] : [],
    stock: [],
  });
  const [sort, setSort] = useState<SortKey>("demand");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const mounted = useRef(false);
  const trackedNoResultQueries = useRef<Set<string>>(new Set());
  const trackedSearchQueries = useRef<Set<string>>(new Set());
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

  const currentPage = clampPageForTotal(
    parsePageParam(searchParams),
    results.length,
    CATALOG_PAGE_SIZE,
  );
  const pagedResults = paginateItems(results, currentPage, CATALOG_PAGE_SIZE);
  const catalogPath = withLocale(locale, "/catalog");
  const paginationSearchParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (query) params.q = query;
    if (initialCat) params.cat = initialCat;
    if (initialHost) params.host = initialHost;
    return params;
  }, [query, initialCat, initialHost]);

  const scrollDepthViewKey = `${currentPage}|${query}|${sel.cats.join(",")}|${sel.hosts.join(",")}|${sel.stock.join(",")}`;

  const activeFilterCount = sel.cats.length + sel.hosts.length + sel.stock.length;

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ group: Group; id: string; label: string }> = [];
    for (const id of sel.cats) {
      const cat = CATEGORIES.find((c) => c.id === id);
      if (cat) chips.push({ group: "cats", id, label: cat.label });
    }
    for (const id of sel.hosts) {
      const host = HOSTS.find((h) => h.id === id);
      if (host) chips.push({ group: "hosts", id, label: host.label });
    }
    for (const id of sel.stock) {
      chips.push({
        group: "stock",
        id,
        label: id === "in" ? t("inStock") : t("sourceOnRequest"),
      });
    }
    return chips;
  }, [sel.cats, sel.hosts, sel.stock, t]);

  const clearFilters = () =>
    setSel({
      cats: [],
      hosts: [],
      stock: [],
    });

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
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery || results.length === 0 || trackedSearchQueries.current.has(normalizedQuery)) return;

    trackedSearchQueries.current.add(normalizedQuery);
    trackEvent({
      event_name: "catalog_search",
      query,
      metadata: {
        cats: sel.cats,
        hosts: sel.hosts,
        stock: sel.stock,
        results: results.length,
      },
    });
  }, [query, results.length, sel.cats, sel.hosts, sel.stock]);

  useEffect(() => {
    mounted.current = true;
  }, []);

  useEffect(() => {
    trackEvent({
      event_name: "catalog_view",
      query: query || undefined,
      metadata: {
        page: currentPage,
      },
    });
  }, [currentPage, query]);

  const seenPage = useRef<number | null>(null);
  useEffect(() => {
    if (seenPage.current === null) {
      seenPage.current = currentPage;
      return;
    }
    if (seenPage.current === currentPage) return;
    seenPage.current = currentPage;
    scrollToCatalogResults("smooth");
  }, [currentPage]);

  return (
    <>
      <CatalogScrollDepthTracker
        viewKey={scrollDepthViewKey}
        query={query}
        currentPage={currentPage}
        resultsCount={results.length}
      />
      <CatalogTopbarMeasure />
      <CatalogHero hostFilter={sel.hosts} toggleHost={(id) => toggle("hosts", id)} />
      <div className="wrap">
        <div className="mobile-catalog-bar">
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
        {activeFilterChips.length > 0 && (
          <div className="catalog-active-filters" aria-label={t("activeFilters")}>
            <span className="label">{t("activeFilters")}</span>
            {activeFilterChips.map((chip) => (
              <button
                key={`${chip.group}-${chip.id}`}
                type="button"
                className="catalog-filter-chip"
                onClick={() => toggle(chip.group, chip.id)}
              >
                {chip.label}
                <span aria-hidden="true">×</span>
              </button>
            ))}
            <button type="button" className="catalog-clear-filters" onClick={clearFilters}>
              {t("clearAll")}
            </button>
          </div>
        )}
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

          <div id="catalog-results">
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
              query ? (
                <div style={{ maxWidth: 760, margin: "0 auto", padding: "18px 0 60px" }}>
                  <NoMatchRfqForm partPn={query} />
                </div>
              ) : (
                <div style={{ padding: "60px 0", textAlign: "center", color: "var(--muted)" }}>
                  <p style={{ fontSize: 15 }}>{t("noFilterMatch")}</p>
                  <p style={{ fontSize: 13 }}>{t("clearFiltersHint")}</p>
                </div>
              )
            ) : (
              <>
                <div className="grid density-regular catalog-card-grid" key={`cards-${currentPage}`}>
                  {pagedResults.map((p, index) => (
                    <ProductCard key={p.id} part={p} revealIndex={index} />
                  ))}
                </div>
                <div className="part-list" key={`${currentPage}-${isMobileCatalog ? "mobile" : "desktop"}`}>
                  {pagedResults.map((p, index) => (
                    <CatalogScrollReveal key={p.id} index={index} enabled={isMobileCatalog}>
                      <ProductListItem part={p} />
                    </CatalogScrollReveal>
                  ))}
                </div>
                <Pagination
                  pathname={catalogPath}
                  currentPage={currentPage}
                  totalItems={results.length}
                  pageSize={CATALOG_PAGE_SIZE}
                  searchParams={paginationSearchParams}
                  labels={{
                    showing: (start, end, total) => t("paginationShowing", { start, end, total }),
                    prev: t("paginationPrev"),
                    next: t("paginationNext"),
                    ariaLabel: t("paginationAria"),
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
