// Product-detail sub-sections (server components). Ported from product.jsx.
import { Ic } from "@/app/_components/icons";
import { CAT_LABEL, COND, HOST_BY_ID } from "@/app/_lib/taxonomy";
import type { Part } from "@/app/_lib/types";

export function AvailabilityPanel({ part }: { part: Part }) {
  const availability = part.availabilityLabel ?? (part.stock === "in" ? "In stock" : "Source on request");
  return (
    <div className="price-block">
      <div className="compat-h" style={{ marginBottom: 10 }}>
        <Ic.bolt /> Request-for-quote availability
      </div>
      <div className="price-save" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
        <Ic.shield style={{ width: 15, height: 15, color: "var(--in-stock)" }} />
        <span>
          <strong>{availability}</strong> · Send the part number and requirements. We confirm
          sourcing, testing status, lead time, and quote before any order.
        </span>
      </div>
    </div>
  );
}

export function TrustStrip() {
  const items = [
    { icon: <Ic.shield />, t: "Tested & warrantied", d: "Bench-tested, 6-month warranty on every unit." },
    { icon: <Ic.clock />, t: "< 2 hr quote", d: "Median response from our sourcing desk." },
    { icon: <Ic.globe />, t: "Worldwide ship", d: "DDP freight from our China hubs." },
  ];
  return (
    <div className="trust">
      {items.map((it, i) => (
        <div className="trust-item" key={i}>
          {it.icon}
          <div className="t">{it.t}</div>
          <div className="d">{it.d}</div>
        </div>
      ))}
    </div>
  );
}

export function Compat({ part }: { part: Part }) {
  const hosts = part.hosts.map((h) => HOST_BY_ID[h]).filter(Boolean);
  return (
    <div className="compat">
      <div className="compat-h">
        <Ic.link /> Cross-compatibility
      </div>
      <div className="compat-sub">Verified to fit these host systems and the arms they drive.</div>
      <div className="compat-list">
        {part.compatibleControllers.length > 0 && (
          <div className="compat-row">
            <div className="h">
              <div className="b">Controllers</div>
              <div className="s mono">from product data</div>
            </div>
            <div className="arms">{part.compatibleControllers.join(", ")}</div>
          </div>
        )}
        {part.compatibleRobotModels.length > 0 && (
          <div className="compat-row">
            <div className="h">
              <div className="b">Robot models</div>
              <div className="s mono">matched models</div>
            </div>
            <div className="arms">{part.compatibleRobotModels.join(", ")}</div>
          </div>
        )}
        {hosts.map((h) => (
          <div className="compat-row" key={h.id}>
            <div className="h">
              <div className="b">{h.label}</div>
              <div className="s mono">{h.systems}</div>
            </div>
            <div className="arms">{h.arms}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Specs({ part }: { part: Part }) {
  const rows: [string, string, boolean][] = [
    ["Part number", part.pn, true],
    ...(part.alternativePns.length > 0
      ? [["Alternative P/N", part.alternativePns.join(", "), true] as [string, string, boolean]]
      : []),
    ["Manufacturer", part.brand, false],
    ["Category", CAT_LABEL[part.cat], false],
    ...(part.categoryL2 ? [["Subcategory", part.categoryL2, false] as [string, string, boolean]] : []),
    ...(part.series ? [["Series", part.series, true] as [string, string, boolean]] : []),
    ...(part.equipmentType ? [["Equipment type", part.equipmentType, false] as [string, string, boolean]] : []),
    ["Condition", COND[part.cond] ?? part.cond, false],
    ["Lifecycle status", part.life, false],
    ...(part.controllerGeneration
      ? [["Controller generation", part.controllerGeneration, false] as [string, string, boolean]]
      : []),
    ["Lead time", part.lead, false],
    ["Warranty", "6 months · functional guarantee", false],
  ];
  return (
    <div className="specs">
      {rows.map(([k, v, mono], i) => (
        <div className="spec-row" key={i}>
          <span className="k">{k}</span>
          <span className={"v" + (mono ? " mono" : "")}>{v}</span>
        </div>
      ))}
    </div>
  );
}
