"use client";

import { useEffect, useState } from "react";
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, BarChart, Bar } from "recharts";
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

function useMeasuredWidthById(elementId: string) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = document.getElementById(elementId);
    if (!node) return;

    const update = () => setWidth(Math.floor(node.getBoundingClientRect().width));
    update();

    const observer = new ResizeObserver(() => update());
    observer.observe(node);
    return () => observer.disconnect();
  }, [elementId]);

  return width;
}

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

  const lineContainerId = "traffic-line-chart-container";
  const barContainerId = "traffic-bar-chart-container";
  const lineWidth = useMeasuredWidthById(lineContainerId);
  const barWidth = useMeasuredWidthById(barContainerId);

  return (
    <div style={{ display: "grid", gap: 20, marginBottom: 20 }}>
      <div
        style={{
          display: "grid",
          gap: 20,
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
        }}
      >
        <div className="admin-stat">
          <h2 style={{ margin: "0 0 10px", fontSize: 16 }}>Daily trend</h2>
          <div id={lineContainerId} style={{ width: "100%", height: 300, minWidth: 0, minHeight: 300 }}>
            {lineWidth > 0 && (
              <LineChart width={lineWidth} height={300} data={dailySeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total events" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="rfqs" name="RFQ submits" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            )}
          </div>
        </div>

        <div className="admin-stat">
          <h2 style={{ margin: "0 0 10px", fontSize: 16 }}>Event mix</h2>
          <div id={barContainerId} style={{ width: "100%", height: 300, minWidth: 0, minHeight: 300 }}>
            {barWidth > 0 && (
              <BarChart width={barWidth} height={300} data={eventMixData} layout="vertical" margin={{ left: 18 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={170} />
                <Tooltip />
                <Bar dataKey="count" name="Events" fill="#14b8a6" />
              </BarChart>
            )}
          </div>
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
