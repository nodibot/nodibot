"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ic } from "@/app/_components/icons";

const EXAMPLES = ["3HAC050363-001", "A06B-6114-H206", "6ES7315-2AH14-0AB0"];

export function LandingHero() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const go = (value: string) => {
    const trimmed = value.trim();
    router.push(trimmed ? `/catalog?q=${encodeURIComponent(trimmed)}` : "/catalog");
  };

  return (
    <section className="lp-hero">
      <div className="wrap lp-hero-grid">
        <div>
          <div className="lp-status">
            <span className="pulse" /> Sourcing desk online · responding now
          </div>
          <h1>
            When the line is down, <em>every hour counts.</em>
          </h1>
          <p className="sub">
            Tested secondary-market controllers, drives, pendants and reducers for discontinued
            automation — located, verified and quoted in hours, not weeks.
          </p>

          <div className="lp-search">
            <div className="lp-search-label">
              <Ic.search style={{ width: 14, height: 14 }} /> Drop the part number off your faulty unit
            </div>
            <div className="lp-search-box">
              <div className="lp-search-input">
                <Ic.search />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && go(q)}
                  placeholder="e.g. 3HAC050363-001"
                  aria-label="Search by part number"
                />
              </div>
              <button className="btn btn-primary btn-lg" onClick={() => go(q)}>
                <Ic.bolt /> Find it
              </button>
            </div>
            <div className="lp-chip-try">
              <span style={{ fontSize: 12, color: "var(--muted)", alignSelf: "center", marginRight: 2 }}>
                Try:
              </span>
              {EXAMPLES.map((e) => (
                <button key={e} onClick={() => go(e)}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="lp-hero-stats">
            <div>
              <div className="n">
                &lt; <em>2</em> hrs
              </div>
              <div className="l">Median quote response</div>
            </div>
            <div>
              <div className="n">
                12,400<em>+</em>
              </div>
              <div className="l">Part numbers indexed</div>
            </div>
            <div>
              <div className="n">
                <em>7</em>
              </div>
              <div className="l">OEM host families covered</div>
            </div>
          </div>
        </div>

        {/* hero visual: stacked "found part" cards + quote float */}
        <div className="lp-hero-visual">
          <div className="lp-fcard c1">
            <div className="ph" style={{ aspectRatio: "16/10" }}>
              <span className="ph-label">teach pendant</span>
            </div>
            <div className="brand">ABB</div>
            <div className="row">
              <span className="pn mono">3HAC028357-001</span>
              <span className="badge badge-in">
                <span className="dot-s" style={{ background: "var(--in-stock)" }} />
                Found
              </span>
            </div>
            <div className="price">
              <span className="cur">status </span>RFQ ready
            </div>
          </div>
          <div className="lp-fcard c2">
            <div className="ph" style={{ aspectRatio: "16/10" }}>
              <span className="ph-label">servo drive</span>
            </div>
            <div className="brand">Fanuc</div>
            <div className="row">
              <span className="pn mono">A06B-6114-H206</span>
            </div>
            <div className="price">
              <span className="cur">status </span>Source on request
            </div>
          </div>
          <div className="lp-fcard c3">
            <div className="ph" style={{ aspectRatio: "16/10" }}>
              <span className="ph-label">gear reducer</span>
            </div>
            <div className="brand">Nabtesco</div>
            <div className="row">
              <span className="pn mono">RV-40E</span>
            </div>
            <div className="price">
              <span className="cur">status </span>Compatibility checked
            </div>
          </div>
          <div className="lp-quote-float">
            <div className="t">
              <Ic.clock style={{ width: 13, height: 13 }} /> Quote ready
            </div>
            <div className="b">
              3 sources · save <span>up to 81%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
