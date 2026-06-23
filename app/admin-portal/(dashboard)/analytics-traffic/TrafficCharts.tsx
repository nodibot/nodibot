"use client";

import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, BarChart, Bar } from "recharts";
import { WorldMap } from "react-svg-worldmap";
import type { ISOCode } from "react-svg-worldmap";

type DailyRow = {
  day: string;
  total: number;
  clicks: number;
  searches: number;
  rfqs: number;
  whatsapp: number;
};

type EventRow = { eventName: string; count: number };
type CountryRow = { countryCode: string; count: number };

function eventLabel(eventName: string): string {
  const map: Record<string, string> = {
    catalog_item_click: "Catalog item click",
    catalog_search: "Catalog search",
    catalog_filter_change: "Catalog filter change",
    catalog_sort_change: "Catalog sort change",
    rfq_submitted: "RFQ submitted",
    whatsapp_click: "WhatsApp click",
  };
  return map[eventName] ?? eventName;
}

export function TrafficCharts({
  dailySeries,
  eventBreakdown,
  topCountries,
}: {
  dailySeries: DailyRow[];
  eventBreakdown: EventRow[];
  topCountries: CountryRow[];
}) {
  const eventMixData = eventBreakdown.map((r) => ({
    name: eventLabel(r.eventName),
    count: r.count,
  }));

  const countryData: Array<{ country: ISOCode; value: number }> = topCountries
    .filter((r) => /^[A-Z]{2}$/.test(r.countryCode))
    .map((r) => ({ country: r.countryCode.toUpperCase() as ISOCode, value: r.count }));

  return (
    <div style={{ display: "grid", gap: 20, marginBottom: 20 }}>
      <div className="admin-stat">
        <h2 style={{ margin: "0 0 10px", fontSize: 16 }}>Daily trend</h2>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={dailySeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" name="Total events" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="rfqs" name="RFQ submits" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-stat">
        <h2 style={{ margin: "0 0 10px", fontSize: 16 }}>Event mix</h2>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={eventMixData} layout="vertical" margin={{ left: 18 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={170} />
              <Tooltip />
              <Bar dataKey="count" name="Events" fill="#14b8a6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-stat">
        <h2 style={{ margin: "0 0 10px", fontSize: 16 }}>World heat map (by country)</h2>
        {countryData.length === 0 ? (
          <div className="dim">No country data yet.</div>
        ) : (
          <WorldMap
            data={countryData}
            color="#2563eb"
            size="responsive"
            title=""
            valueSuffix=" events"
            richInteraction
          />
        )}
      </div>
    </div>
  );
}
