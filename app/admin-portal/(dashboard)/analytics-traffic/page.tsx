import Link from "next/link";
import { getAnalyticsOverview, type AnalyticsEventFilter } from "@/app/_lib/admin";
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
    rfq_submitted: "RFQ submitted",
    whatsapp_click: "WhatsApp click",
  };
  return <>{map[eventName] ?? eventName}</>;
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

function formatCountryLabel(code: string): string {
  const normalized = code.toUpperCase();
  const name = regionNames.of(normalized);
  return name ? `${normalized} (${name})` : normalized;
}

export default async function TrafficAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; event?: string }>;
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

  const daysValue = Number(params.days);
  const days = (daysValue === 7 || daysValue === 30 || daysValue === 90 ? daysValue : 30) as 7 | 30 | 90;
  const eventFilter = (params.event === "clicks" || params.event === "searches" || params.event === "rfqs"
    ? params.event
    : "all") as AnalyticsEventFilter;

  const analytics = await getAnalyticsOverview({ days, eventFilter });
  const sinceLabel = new Date(analytics.sinceIso).toLocaleDateString();

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Traffic analytics</h1>
          <div className="sub">
            Last {analytics.days} days since {sinceLabel} · {eventFilterLabel[analytics.appliedEventFilter]}
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

        <div className="admin-stats">
          <div className="admin-stat">
            <div className="n">{analytics.totalEvents.toLocaleString()}</div>
            <div className="l">Tracked events</div>
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
            <div className="n">{analytics.whatsappClicks.toLocaleString()}</div>
            <div className="l">WhatsApp clicks</div>
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

        <div className="admin-table-wrap" style={{ marginBottom: 20 }}>
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
                analytics.eventBreakdown.map((row) => (
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

        <div className="admin-table-wrap" style={{ marginBottom: 20 }}>
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
                analytics.topConvertingParts.map((row, i) => (
                  <tr key={row.partPn}>
                    <td>{i + 1}</td>
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

        <div className="admin-table-wrap" style={{ marginBottom: 20 }}>
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
                  <td colSpan={3} className="dim">No click data yet.</td>
                </tr>
              ) : (
                analytics.topPartsByClick.map((row, i) => (
                  <tr key={row.partPn}>
                    <td>{i + 1}</td>
                    <td className="mono">{row.partPn}</td>
                    <td>{row.clicks}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
                analytics.topCountries.map((row, i) => (
                  <tr key={row.countryCode}>
                    <td>{i + 1}</td>
                    <td className="mono">{formatCountryLabel(row.countryCode)}</td>
                    <td>{row.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-table-wrap" style={{ marginTop: 20, marginBottom: 20 }}>
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
                analytics.topQueries.map((row, i) => (
                  <tr key={row.query}>
                    <td>{i + 1}</td>
                    <td className="mono">{row.query}</td>
                    <td>{row.searches}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-table-wrap" style={{ marginTop: 20 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Part</th>
                <th>Query</th>
                <th>Location</th>
                <th>Path</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="dim">No recent events yet.</td>
                </tr>
              ) : (
                analytics.recentEvents.map((row, i) => (
                  <tr key={`${row.createdAt}-${row.eventName}-${i}`}>
                    <td className="mono">{new Date(row.createdAt).toLocaleString()}</td>
                    <td><EventLabel eventName={row.eventName} /></td>
                    <td className="mono">{row.partPn ?? "—"}</td>
                    <td className="mono">{row.query ?? "—"}</td>
                    <td className="mono">
                      {[row.countryCode, row.region, row.city].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="mono">{row.pagePath ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
