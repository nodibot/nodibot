import { ImageResponse } from "next/og";

export const alt = "nodibot — industrial automation parts, sourced on demand";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#15171b",
          color: "#f6f6f3",
          padding: "64px 72px",
          fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "#ff5b1f",
            }}
          />
          <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-0.04em" }}>
            nodibot
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 900 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.045em",
            }}
          >
            Industrial automation parts, sourced on demand
          </div>
          <div style={{ fontSize: 28, color: "#a8adb6", lineHeight: 1.35 }}>
            Controllers, drives, pendants, and reducers — searched by exact part number.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#767b83" }}>
          nodibot.io
        </div>
      </div>
    ),
    { ...size },
  );
}
