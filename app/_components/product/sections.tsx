// Product-detail sub-sections (server components). Ported from product.jsx.
import { Ic } from "@/app/_components/icons";
import { fmt, priceRange, savePct } from "@/app/_lib/format";
import { CAT_LABEL, COND, HOST_BY_ID } from "@/app/_lib/taxonomy";
import type { Part } from "@/app/_lib/types";

export function PriceBlock({ part }: { part: Part }) {
  const pct = savePct(part.refurb, part.oem);
  return (
    <div className="price-block">
      <div className="price-rows">
        <div className="price-cell">
          <div className="lbl">
            <Ic.shield style={{ width: 13, height: 13, color: "var(--accent)" }} /> nodibot refurbished
          </div>
          <div className="val">{priceRange(part.refurb)}</div>
        </div>
        <div className="price-divider" />
        <div className="price-cell oem">
          <div className="lbl">OEM brand-new</div>
          <div className="val">{fmt(part.oem)}</div>
        </div>
      </div>
      <div className="price-save">
        <Ic.tag style={{ width: 15, height: 15, color: "var(--in-stock)" }} />
        <span>
          <strong>Save up to {pct}%</strong> vs. OEM list — final price confirmed on your quote.
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
    ["Manufacturer", part.brand, false],
    ["Category", CAT_LABEL[part.cat], false],
    ["Condition", COND[part.cond] ?? part.cond, false],
    ["Lifecycle status", part.life, false],
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
