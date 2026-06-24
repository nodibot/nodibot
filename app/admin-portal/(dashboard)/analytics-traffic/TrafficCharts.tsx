"use client";

import { useEffect, useState } from "react";
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, BarChart, Bar } from "recharts";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

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

const COUNTRY_CENTROIDS: Record<string, { lat: number; lon: number }> = {
  US: { lat: 39.8, lon: -98.6 },
  CA: { lat: 56.1, lon: -106.3 },
  MX: { lat: 23.6, lon: -102.5 },
  BR: { lat: -14.2, lon: -51.9 },
  AR: { lat: -38.4, lon: -63.6 },
  CL: { lat: -35.7, lon: -71.5 },
  CO: { lat: 4.6, lon: -74.1 },
  PE: { lat: -9.2, lon: -75.0 },
  GB: { lat: 55.4, lon: -3.4 },
  IE: { lat: 53.1, lon: -8.2 },
  FR: { lat: 46.2, lon: 2.2 },
  DE: { lat: 51.2, lon: 10.4 },
  ES: { lat: 40.4, lon: -3.7 },
  IT: { lat: 41.9, lon: 12.6 },
  NL: { lat: 52.1, lon: 5.3 },
  BE: { lat: 50.5, lon: 4.5 },
  PL: { lat: 52.1, lon: 19.1 },
  SE: { lat: 60.1, lon: 18.6 },
  NO: { lat: 60.5, lon: 8.5 },
  FI: { lat: 64.9, lon: 26.0 },
  TR: { lat: 39.0, lon: 35.2 },
  UA: { lat: 48.4, lon: 31.2 },
  RU: { lat: 61.5, lon: 105.3 },
  SA: { lat: 23.9, lon: 45.1 },
  AE: { lat: 24.3, lon: 54.4 },
  IL: { lat: 31.0, lon: 35.0 },
  EG: { lat: 26.8, lon: 30.8 },
  ZA: { lat: -30.6, lon: 22.9 },
  NG: { lat: 9.1, lon: 8.7 },
  KE: { lat: -0.0, lon: 37.9 },
  IN: { lat: 20.6, lon: 78.9 },
  PK: { lat: 30.4, lon: 69.3 },
  BD: { lat: 23.7, lon: 90.4 },
  CN: { lat: 35.9, lon: 104.2 },
  JP: { lat: 36.2, lon: 138.3 },
  KR: { lat: 36.5, lon: 127.9 },
  TW: { lat: 23.7, lon: 121.0 },
  HK: { lat: 22.3, lon: 114.2 },
  SG: { lat: 1.35, lon: 103.8 },
  TH: { lat: 15.8, lon: 101.0 },
  VN: { lat: 14.1, lon: 108.3 },
  MY: { lat: 4.2, lon: 102.0 },
  ID: { lat: -2.5, lon: 118.0 },
  PH: { lat: 12.8, lon: 121.8 },
  AU: { lat: -25.3, lon: 133.8 },
  NZ: { lat: -40.9, lon: 174.9 },
};

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
    email_click: "Email click",
  };
  return map[eventName] ?? eventName;
}

function MapControls() {
  const map = useMap();
  return (
    <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000, display: "grid", gap: 6 }}>
      <button className="btn btn-ghost" style={{ padding: "6px 10px" }} type="button" onClick={() => map.zoomIn()}>
        +
      </button>
      <button className="btn btn-ghost" style={{ padding: "6px 10px" }} type="button" onClick={() => map.zoomOut()}>
        -
      </button>
      <button
        className="btn btn-ghost"
        style={{ padding: "6px 10px" }}
        type="button"
        onClick={() => map.setView([20, 0], 2)}
      >
        Reset
      </button>
    </div>
  );
}

export function TrafficCharts({
  dailySeries,
  eventBreakdown,
  topCountries,
}: TrafficChartsProps) {
  const eventMixData = eventBreakdown.map((r) => ({
    name: eventLabel(r.eventName),
    count: r.count,
  }));

  const points = topCountries
    .map((r) => ({ ...r, geo: COUNTRY_CENTROIDS[r.countryCode.toUpperCase()] }))
    .filter((r): r is CountryRow & { geo: { lat: number; lon: number } } => Boolean(r.geo));
  const maxCountryCount = Math.max(1, ...topCountries.map((r) => r.count));

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
        {points.length === 0 ? (
          <div className="dim">No country data yet.</div>
        ) : (
          <div style={{ height: 520, border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", position: "relative" }}>
            <MapContainer center={[20, 0]} zoom={2} minZoom={2} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              <MapControls />
              <MarkerClusterGroup
                chunkedLoading
                iconCreateFunction={(cluster: L.MarkerCluster) => {
                  const total = cluster
                    .getAllChildMarkers()
                    .reduce(
                      (sum, m: L.Marker<Record<string, unknown>>) =>
                        sum + Number((m.options as { count?: number }).count ?? 0),
                      0,
                    );
                  const size = total > 100 ? 56 : total > 30 ? 46 : 38;
                  return L.divIcon({
                    html: `<div style="width:${size}px;height:${size}px;border-radius:999px;background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid #fff;box-shadow:0 6px 14px rgba(37,99,235,.32)">${total}</div>`,
                    className: "",
                    iconSize: [size, size],
                  });
                }}
              >
                {points.map((p) => {
                  const ratio = p.count / maxCountryCount;
                  const size = Math.round(24 + ratio * 32);
                  const icon = L.divIcon({
                    html: `<div style="width:${size}px;height:${size}px;border-radius:999px;background:rgba(37,99,235,.72);border:2px solid #fff;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">${p.count}</div>`,
                    className: "",
                    iconSize: [size, size],
                  });
                  return (
                    <Marker
                      key={p.countryCode}
                      position={[p.geo.lat, p.geo.lon]}
                      icon={icon}
                      title={`${p.countryCode}: ${p.count} events`}
                      {...({ count: p.count } as Record<string, unknown>)}
                    />
                  );
                })}
              </MarkerClusterGroup>
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export type TrafficChartsProps = {
  dailySeries: DailyRow[];
  eventBreakdown: EventRow[];
  topCountries: CountryRow[];
};
