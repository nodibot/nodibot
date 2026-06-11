import Link from "next/link";
import { PartImage, StockBadge, LifeBadge } from "@/app/_components/badges";
import { Ic } from "@/app/_components/icons";
import { priceRange } from "@/app/_lib/format";
import type { Part } from "@/app/_lib/types";

export function ProductCard({ part }: { part: Part }) {
  return (
    <Link className="card fade-in" href={`/products/${encodeURIComponent(part.pn)}`}>
      <div className="card-img">
        <PartImage part={part} />
      </div>
      <div className="card-body">
        <div className="card-brand">{part.brand}</div>
        <div className="card-pn mono">{part.pn}</div>
        <p className="card-name">{part.name}</p>
        <div className="card-badges">
          <StockBadge part={part} />
          <LifeBadge life={part.life} />
        </div>
        <div className="card-meta">
          <div className="card-price">
            <span className="cur">refurb </span>
            {priceRange(part.refurb)}
          </div>
          <span style={{ color: "var(--accent)", display: "flex" }}>
            <Ic.arrowR style={{ width: 18, height: 18 }} />
          </span>
        </div>
      </div>
    </Link>
  );
}
