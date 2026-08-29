"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { PartImage } from "@/app/_components/badges";
import { Ic } from "@/app/_components/icons";
import { trackEvent } from "@/app/_lib/analytics-client";
import { withLocale } from "@/app/_lib/locale-path";
import type { Part } from "@/app/_lib/types";

export function ProductCard({ part, revealIndex }: { part: Part; revealIndex?: number }) {
  const locale = useLocale();
  const trackClick = (surface: "card" | "list") => {
    trackEvent({
      event_name: "catalog_item_click",
      part_pn: part.pn,
      metadata: { surface },
    });
  };

  return (
    <Link
      className="card catalog-card-enter"
      style={typeof revealIndex === "number" ? { animationDelay: `${Math.min(revealIndex, 11) * 45}ms` } : undefined}
      href={withLocale(locale, `/products/${encodeURIComponent(part.pn)}`)}
      onPointerDown={() => trackClick("card")}
    >
      <div className="card-img">
        <PartImage part={part} />
      </div>
      <div className="card-body">
        <div className="card-brand">{part.brand}</div>
        <div className="card-pn mono">{part.pn}</div>
        <p className="card-name">{part.name}</p>
        <div className="card-meta">
          <span style={{ color: "var(--accent)", display: "flex", marginLeft: "auto" }}>
            <Ic.arrowR style={{ width: 18, height: 18 }} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProductListItem({ part }: { part: Part }) {
  const locale = useLocale();
  const trackClick = (surface: "card" | "list") => {
    trackEvent({
      event_name: "catalog_item_click",
      part_pn: part.pn,
      metadata: { surface },
    });
  };

  return (
    <Link
      className="part-row"
      href={withLocale(locale, `/products/${encodeURIComponent(part.pn)}`)}
      onPointerDown={() => trackClick("list")}
    >
      <PartImage part={part} className="part-row-img" />
      <div className="part-row-main">
        <div className="part-row-kicker">{part.brand}</div>
        <div className="part-row-pn mono">{part.pn}</div>
        <p className="part-row-name">{part.name}</p>
      </div>
      <div className="part-row-side">
        <Ic.arrowR />
      </div>
    </Link>
  );
}
