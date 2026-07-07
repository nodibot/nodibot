import Link from "next/link";
import { getAnalyticsOverview, type AnalyticsEventFilter } from "@/app/_lib/admin";
import { Pagination, clampPageForTotal, paginateItems, parsePageParam } from "../_components/Pagination";
import { TrafficChartsClient } from "./TrafficChartsClient";

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function EventLabel({ eventName }: { eventName: string }) {
  const map: Record<string, string> = {
    catalog_item_click: "Catalog item click",
    catalog_search: "Catalog search",
    catalog_filter_change: "Catalog filter change",
    catalog_sort_change: "Catalog sort change",
    catalog_scroll_depth: "Catalog scroll depth",
    catalog_no_results: "No-result search",
    rfq_submitted: "RFQ submitted",
    bulk_rfq_submitted: "Bulk RFQ submitted",
    whatsapp_click: "WhatsApp click",
    email_click: "Email click",
  };
  return <>{map[eventName] ?? eventName}</>;
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

function formatCountryLabel(code: string): string {
  const normalized = code.toUpperCase();
  const name = regionNames.of(normalized);
  return name ? `${normalized} (${name})` : normalized;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TrafficAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const DAYS: Array<7 | 30 | 90> = [7, 30, 90];
  const EVENT_FILTERS: AnalyticsEventFilter[] = ["all", "clicks", "searches", "rfqs"];
  const eventFilterLabel: Record<AnalyticsEventFilter, string> = {
    all: "All events",
    clicks: "Only clicks",
    searches: "Only searches",
    rfqs: "Only RFQs",
  };

  const params = await searchParams;

  const daysValue = Number(firstParam(params.days));
  const days = (daysValue === 7 || daysValue === 30 || daysValue === 90 ? daysValue : 30) as 7 | 30 | 90;
  const eventValue = firstParam(params.event);
  const eventFilter = (eventValue === "clicks" || eventValue === "searches" || eventValue === "rfqs"
    ? eventValue
    : "all") as AnalyticsEventFilter;

  const analytics = await getAnalyticsOverview({ days, eventFilter });
  const sinceLabel = new Date(analytics.sinceIso).toLocaleDateString("en-US");
  const tablePageSize = 10;
  const recentEventsSize = 20;

  const eventBreakdownPage = clampPageForTotal(
    parsePageParam(params, "ebPage"),
    analytics.eventBreakdown.length,
    tablePageSize,
  );
  const topConvertingPage = clampPageForTotal(
    parsePageParam(params, "tcPage"),
    analytics.topConvertingParts.length,
    tablePageSize,
  );
  const topPartsPage = clampPageForTotal(
    parsePageParam(params, "tpPage"),
    analytics.topPartsByClick.length,
    tablePageSize,
  );
  const topCountriesPage = clampPageForTotal(
    parsePageParam(params, "cPage"),
    analytics.topCountries.length,
    tablePageSize,
  );
  const topQueriesPage = clampPageForTotal(
    parsePageParam(params, "qPage"),
    analytics.topQueries.length,
    tablePageSize,
  );
  const topNoResultQueriesPage = clampPageForTotal(
    parsePageParam(params, "nrPage"),
    analytics.topNoResultQueries.length,
    tablePageSize,
  );
  const topPagesPage = clampPageForTotal(
    parsePageParam(params, "pgPage"),
    analytics.topPages.length,
    tablePageSize,
  );
  const topSurfacesPage = clampPageForTotal(
    parsePageParam(params, "sfPage"),
    analytics.topSurfaces.length,
    tablePageSize,
  );
  const recentEventsPage = clampPageForTotal(
    parsePageParam(params, "rePage"),
    analytics.recentEvents.length,
    recentEventsSize,
  );

  const pagedEventBreakdown = paginateItems(analytics.eventBreakdown, eventBreakdownPage, tablePageSize);
  const pagedTopConverting = paginateItems(analytics.topConvertingParts, topConvertingPage, tablePageSize);
  const pagedTopParts = paginateItems(analytics.topPartsByClick, topPartsPage, tablePageSize);
  const pagedTopCountries = paginateItems(analytics.topCountries, topCountriesPage, tablePageSize);
  const pagedTopQueries = paginateItems(analytics.topQueries, topQueriesPage, tablePageSize);
  const pagedTopNoResultQueries = paginateItems(
    analytics.topNoResultQueries,
    topNoResultQueriesPage,
    tablePageSize,
  );
  const pagedTopPages = paginateItems(analytics.topPages, topPagesPage, tablePageSize);
  const pagedTopSurfaces = paginateItems(analytics.topSurfaces, topSurfacesPage, tablePageSize);
  const pagedRecentEvents = paginateItems(analytics.recentEvents, recentEventsPage, recentEventsSize);

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Traffic analytics</h1>
          <div className="sub">
            Last {analytics.days} days since {sinceLabel} · {eventFilterLabel[analytics.appliedEventFilter]}
            {analytics.eventsTruncated ? " · showing latest 10,000 events" : ""}
          </div>
        </div>
        <Link className="btn btn-ghost" href="/admin-portal/inquiries">
          Open inquiries
        </Link>
      </div>

      <div className="admin-content">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {DAYS.map((d) => (
            <Link
              key={d}
              href={`/admin-portal/analytics-traffic?days=${d}&event=${analytics.appliedEventFilter}`}
              className={"btn " + (analytics.days === d ? "btn-primary" : "btn-ghost")}
            >
              {d}d
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {EVENT_FILTERS.map((f) => (
            <Link
              key={f}
              href={`/admin-portal/analytics-traffic?days=${analytics.days}&event=${f}`}
              className={"btn " + (analytics.appliedEventFilter === f ? "btn-primary" : "btn-ghost")}
            >
              {eventFilterLabel[f]}
            </Link>
          ))}
        </div>

        <TrafficChartsClient
          dailySeries={analytics.dailySeries}
          eventBreakdown={analytics.eventBreakdown}
          topCountries={analytics.topCountries}
        />

        {/* Stats */}
        <div className="admin-stats">
          <div className="admin-stat">
            <div className="n">{analytics.totalEvents.toLocaleString()}</div>
            <div className="l">Tracked events</div>
          </div>
          <div className="admin-stat">
            <div className="n">{analytics.uniqueVisitors.toLocaleString()}</div>
            <div className="l">Unique visitors (est.)</div>
          </div>
          <div className="admin-stat">
            <div className="n">{analytics.productClicks.toLocaleString()}</div>
            <div className="l">Catalog item clicks</div>
          </div>
          <div className="admin-stat">
            <div className="n">{analytics.catalogSearches.toLocaleString()}</div>
            <div className="l">Catalog searches</div>
          </div>
          <div className="admin-stat">
            <div className="n">{analytics.scrollDepthEvents.toLocaleString()}</div>
            <div className="l">Scroll depth hits</div>
          </div>
          <div className="admin-stat">
            <div className="n">{analytics.whatsappClicks.toLocaleString()}</div>
            <div className="l">WhatsApp clicks</div>
          </div>
          <div className="admin-stat">
            <div className="n">{analytics.emailClicks.toLocaleString()}</div>
            <div className="l">Email clicks</div>
          </div>
          <div className="admin-stat">
            <div className="n">{analytics.rfqSubmittedEvents.toLocaleString()}</div>
            <div className="l">RFQ submit events</div>
          </div>
          <div className="admin-stat">
            <div className="n">{analytics.inquiriesCreated.toLocaleString()}</div>
            <div className="l">Inquiries created</div>
          </div>
          <div className="admin-stat">
            <div className="n">{pct(analytics.rfqPerClickRate)}</div>
            <div className="l">RFQ per click rate</div>
          </div>
        </div>

        {/* Event breakdown */}
        <section className="admin-table-section">
          <h2 className="admin-section-title">Event breakdown</h2>
          <p className="hint" style={{ marginBottom: 12 }}>
            Count and share of each tracked event type in the selected window.
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event type</th>
                  <th>Count</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {analytics.eventBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="dim">No event data yet.</td>
                  </tr>
                ) : (
                  pagedEventBreakdown.map((row) => (
                    <tr key={row.eventName}>
                      <td><EventLabel eventName={row.eventName} /></td>
                      <td>{row.count}</td>
                      <td>{pct(row.count / Math.max(1, analytics.totalEvents))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            pathname="/admin-portal/analytics-traffic"
            currentPage={eventBreakdownPage}
            totalItems={analytics.eventBreakdown.length}
            pageSize={tablePageSize}
            searchParams={params}
            pageParam="ebPage"
          />
        </section>

        <section className="admin-table-section">
          <h2 className="admin-section-title">Top parts by clicks</h2>
          <p className="hint" style={{ marginBottom: 12 }}>
            Most opened product pages from the catalog grid or list.
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Part number</th>
                  <th>Clicks</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topPartsByClick.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="dim">No catalog click data yet.</td>
                  </tr>
                ) : (
                  pagedTopParts.map((row, i) => (
                    <tr key={row.partPn}>
                      <td>{(topPartsPage - 1) * tablePageSize + i + 1}</td>
                      <td className="mono">{row.partPn}</td>
                      <td>{row.clicks}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            pathname="/admin-portal/analytics-traffic"
            currentPage={topPartsPage}
            totalItems={analytics.topPartsByClick.length}
            pageSize={tablePageSize}
            searchParams={params}
            pageParam="tpPage"
          />
        </section>

        <section className="admin-table-section">
          <h2 className="admin-section-title">Top converting parts</h2>
          <p className="hint" style={{ marginBottom: 12 }}>
            Parts with at least 2 clicks, ranked by RFQ submit rate.
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Part number</th>
                  <th>Clicks</th>
                  <th>RFQs</th>
                  <th>Conversion</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topConvertingParts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="dim">Need more click/RFQ data (minimum 2 clicks per part).</td>
                  </tr>
                ) : (
                  pagedTopConverting.map((row, i) => (
                    <tr key={row.partPn}>
                      <td>{(topConvertingPage - 1) * tablePageSize + i + 1}</td>
                      <td className="mono">{row.partPn}</td>
                      <td>{row.clicks}</td>
                      <td>{row.rfqs}</td>
                      <td>{pct(row.conversionRate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            pathname="/admin-portal/analytics-traffic"
            currentPage={topConvertingPage}
            totalItems={analytics.topConvertingParts.length}
            pageSize={tablePageSize}
            searchParams={params}
            pageParam="tcPage"
          />
        </section>

        <section className="admin-table-section">
          <h2 className="admin-section-title">Top pages</h2>
          <p className="hint" style={{ marginBottom: 12 }}>
            URLs where events were recorded (catalog, product, RFQ, etc.).
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Page path</th>
                  <th>Events</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topPages.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="dim">No page path data yet.</td>
                  </tr>
                ) : (
                  pagedTopPages.map((row, i) => (
                    <tr key={row.pagePath}>
                      <td>{(topPagesPage - 1) * tablePageSize + i + 1}</td>
                      <td className="mono">{row.pagePath}</td>
                      <td>{row.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            pathname="/admin-portal/analytics-traffic"
            currentPage={topPagesPage}
            totalItems={analytics.topPages.length}
            pageSize={tablePageSize}
            searchParams={params}
            pageParam="pgPage"
          />
        </section>

        <section className="admin-table-section">
          <h2 className="admin-section-title">Click surfaces</h2>
          <p className="hint" style={{ marginBottom: 12 }}>
            Where WhatsApp, email, and catalog clicks originated (RFQ panel, float button, grid, etc.).
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Surface</th>
                  <th>Events</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topSurfaces.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="dim">No surface metadata yet.</td>
                  </tr>
                ) : (
                  pagedTopSurfaces.map((row, i) => (
                    <tr key={row.surface}>
                      <td>{(topSurfacesPage - 1) * tablePageSize + i + 1}</td>
                      <td className="mono">{row.surface}</td>
                      <td>{row.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            pathname="/admin-portal/analytics-traffic"
            currentPage={topSurfacesPage}
            totalItems={analytics.topSurfaces.length}
            pageSize={tablePageSize}
            searchParams={params}
            pageParam="sfPage"
          />
        </section>

        {analytics.scrollDepthBreakdown.length > 0 && (
          <section className="admin-table-section">
            <h2 className="admin-section-title">Catalog scroll depth</h2>
            <p className="hint" style={{ marginBottom: 12 }}>
              How far users scrolled on the catalog (25/50/75/100% milestones, once per view).
            </p>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Depth</th>
                    <th>Events</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.scrollDepthBreakdown.map((row) => (
                    <tr key={row.depth}>
                      <td>{row.depth}%</td>
                      <td>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Top countries */}
        <section className="admin-table-section">
          <h2 className="admin-section-title">Top countries</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Country</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topCountries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="dim">No location data yet.</td>
                  </tr>
                ) : (
                  pagedTopCountries.map((row, i) => (
                    <tr key={row.countryCode}>
                      <td>{(topCountriesPage - 1) * tablePageSize + i + 1}</td>
                      <td className="mono">{formatCountryLabel(row.countryCode)}</td>
                      <td>{row.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            pathname="/admin-portal/analytics-traffic"
            currentPage={topCountriesPage}
            totalItems={analytics.topCountries.length}
            pageSize={tablePageSize}
            searchParams={params}
            pageParam="cPage"
          />
        </section>

        {/* Top queries */}
        <section className="admin-table-section">
          <h2 className="admin-section-title">Top search queries</h2>
          <p className="hint" style={{ marginBottom: 12 }}>
            Successful catalog searches (`catalog_search` events).
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Search query</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topQueries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="dim">No search data yet.</td>
                  </tr>
                ) : (
                  pagedTopQueries.map((row, i) => (
                    <tr key={row.query}>
                      <td>{(topQueriesPage - 1) * tablePageSize + i + 1}</td>
                      <td className="mono">{row.query}</td>
                      <td>{row.searches}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            pathname="/admin-portal/analytics-traffic"
            currentPage={topQueriesPage}
            totalItems={analytics.topQueries.length}
            pageSize={tablePageSize}
            searchParams={params}
            pageParam="qPage"
          />
        </section>

        {/* No-result queries */}
        <section className="admin-table-section">
          <h2 className="admin-section-title">No-result searches</h2>
          <p className="hint" style={{ marginBottom: 12 }}>
            Queries that returned zero catalog matches — candidates for catalog expansion.
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>No-result search query</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topNoResultQueries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="dim">No no-result search data yet.</td>
                  </tr>
                ) : (
                  pagedTopNoResultQueries.map((row, i) => (
                    <tr key={row.query}>
                      <td>{(topNoResultQueriesPage - 1) * tablePageSize + i + 1}</td>
                      <td className="mono">{row.query}</td>
                      <td>{row.searches}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            pathname="/admin-portal/analytics-traffic"
            currentPage={topNoResultQueriesPage}
            totalItems={analytics.topNoResultQueries.length}
            pageSize={tablePageSize}
            searchParams={params}
            pageParam="nrPage"
          />
        </section>

        {/* Recent events */}
        <section className="admin-table-section">
          <h2 className="admin-section-title">Recent events</h2>
          <p className="hint" style={{ marginBottom: 12 }}>
            Latest 200 events with location, path, and parsed metadata (filters, scroll depth, click surface, etc.).
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Event</th>
                  <th>Part</th>
                  <th>Query</th>
                  <th>Location</th>
                  <th>Path</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="dim">No recent events yet.</td>
                  </tr>
                ) : (
                  pagedRecentEvents.map((row, i) => (
                    <tr key={`${row.createdAt}-${row.eventName}-${i}`}>
                      <td className="mono">{new Date(row.createdAt).toLocaleString("en-US")}</td>
                      <td><EventLabel eventName={row.eventName} /></td>
                      <td className="mono">{row.partPn ?? "—"}</td>
                      <td className="mono">{row.query ?? "—"}</td>
                      <td className="mono">
                        {[row.countryCode, row.region, row.city].filter(Boolean).join(" / ") || "—"}
                      </td>
                      <td className="mono">{row.pagePath ?? "—"}</td>
                      <td style={{ fontSize: 12.5, maxWidth: 280, lineHeight: 1.4 }}>
                        {row.metadataSummary ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            pathname="/admin-portal/analytics-traffic"
            currentPage={recentEventsPage}
            totalItems={analytics.recentEvents.length}
            pageSize={recentEventsSize}
            searchParams={params}
            pageParam="rePage"
          />
        </section>
      </div>
    </>
  );
}
