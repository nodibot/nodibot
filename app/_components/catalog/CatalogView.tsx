"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ic } from "@/app/_components/icons";
import { trackEvent } from "@/app/_lib/analytics-client";
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
const STOCK_OPTS = [
  { id: "in", l: "In stock now" },
  { id: "request", l: "Source on request" },
];

function CatalogHero({
  hostFilter,
  toggleHost,
}: {
  hostFilter: string[];
  toggleHost: (id: string) => void;
}) {
  return (
    <section className="hero">
      <div className="wrap">
        <h1>
          Industrial automation parts, <em>sourced on demand.</em>
        </h1>
        <p>
          Verified secondary-market controllers, drives, pendants and reducers for decommissioned
          FANUC, ABB, KUKA, Yaskawa &amp; Siemens systems. Drop your part number — we locate, test,
          and quote.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="n">12,400+</div>
            <div className="l">Part numbers indexed</div>
          </div>
          <div className="hero-stat">
            <div className="n">&lt; 2 hrs</div>
            <div className="l">Median quote response</div>
          </div>
          <div className="hero-stat">
            <div className="n">7</div>
            <div className="l">OEM host families</div>
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
    router.push(trimmed ? `/catalog?q=${encodeURIComponent(trimmed)}` : "/catalog");
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
            Search
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="catalog-filters"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            Filters
            {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
          </button>
          <select
            className="select"
            value={sort}
            aria-label="Sort catalog"
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="demand">Most requested</option>
            <option value="brand">Brand A-Z</option>
            <option value="category">Category A-Z</option>
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
              placeholder="Paste a part number"
              aria-label="Search parts"
            />
          </div>
          <button className="btn btn-primary" type="button" onClick={goSearch}>
            Find
          </button>
        </div>
        <div className="catalog">
          <aside id="catalog-filters" className={"filters" + (filtersOpen ? " open" : "")}>
            <div className="filter-group">
              <h3 className="filter-h">Category</h3>
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
              <h3 className="filter-h">Host system</h3>
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
              <h3 className="filter-h">Availability</h3>
              {STOCK_OPTS.map((a) => {
                const on = sel.stock.includes(a.id);
                return (
                  <div
                    key={a.id}
                    className={"filter-opt" + (on ? " on" : "")}
                    onClick={() => toggle("stock", a.id)}
                  >
                    <span className="box">{on && <Ic.check />}</span>
                    {a.l}
                  </div>
                );
              })}
            </div>
          </aside>

          <div>
            <div className="results-head">
              <div>
                <h2 className="results-title">
                  {query ? `Results for “${query}”` : "All inventory"}
                </h2>
                <p className="results-sub">
                  {results.length} parts · prioritized by live search demand
                </p>
              </div>
              <div className="results-tools">
                <select
                  className="select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                >
                  <option value="demand">Sort: Most requested</option>
                  <option value="brand">Brand: A-Z</option>
                  <option value="category">Category: A-Z</option>
                </select>
              </div>
            </div>

            {results.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center", color: "var(--muted)" }}>
                <p style={{ fontSize: 15 }}>No indexed match — but we can still source it.</p>
                <p style={{ fontSize: 13 }}>
                  Submit the part number and our team will hunt it across our China supply network.
                </p>
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
