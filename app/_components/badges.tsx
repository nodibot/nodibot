// Small presentational pieces ported from util.jsx.
import { PH_LABEL } from "@/app/_lib/taxonomy";
import type { Part } from "@/app/_lib/types";

export function PartImage({ part, className }: { part: Part; className?: string }) {
  return (
    <div className={"ph " + (className || "")}>
      <span className="ph-label">{PH_LABEL[part.cat] || "part photo"}</span>
    </div>
  );
}

export function StockBadge({ part }: { part: Part }) {
  if (part.stock === "in") {
    return (
      <span className="badge badge-in">
        <span className="dot-s" style={{ background: "var(--in-stock)" }} />
        In stock · {part.qty}
      </span>
    );
  }
  return (
    <span className="badge badge-req">
      <span className="dot-s" style={{ background: "var(--accent)" }} />
      Source on request
    </span>
  );
}

export function LifeBadge({ life }: { life: string }) {
  return <span className="badge badge-life">{life}</span>;
}
