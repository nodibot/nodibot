// Static marketing sections for the landing page (server components).
import Link from "next/link";
import { Ic } from "@/app/_components/icons";
import { WaChatLink } from "@/app/_components/WaChatLink";
import { CATEGORIES, HOSTS } from "@/app/_lib/taxonomy";

export function HostStrip() {
  return (
    <section className="lp-strip" id="hosts">
      <div className="wrap">
        <div className="lp-strip-label">
          Parts salvaged from &amp; verified to fit every major platform
        </div>
        <div className="lp-strip-row">
          {HOSTS.map((h) => (
            <span className="host" key={h.id}>
              {h.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { n: "1", t: "Paste the part number", d: "Search the alphanumeric code off your faulty unit — exactly how you'd Google it.", accent: false },
  { n: "2", t: "Request a quote", d: "No cart, no payment. Flag line-down or spares, pick a channel, hit send.", accent: false },
  { n: "3", t: "We source it", d: "Our desk works a verified China supply network to locate and bench-test the part.", accent: true },
  { n: "4", t: "Tested part ships", d: "Approve the quote and it ships DDP, with a 6-month functional warranty.", accent: false },
];

export function HowItWorks() {
  return (
    <section className="lp-section" id="how">
      <div className="wrap">
        <div className="lp-eyebrow">How it works</div>
        <h2 className="lp-h2">From breakdown to a tested part in hand.</h2>
        <p className="lp-lead">
          A request-for-quote loop built for emergencies — not a checkout cart that quotes you a
          part nobody has in stock.
        </p>
        <div className="lp-steps">
          {STEPS.map((s) => (
            <div className={"lp-step" + (s.accent ? " accent" : "")} key={s.n}>
              <div className="connector" />
              <div className="num">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pillars() {
  return (
    <section className="lp-section tight" id="pillars" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="wrap">
        <div className="lp-eyebrow">What we source</div>
        <h2 className="lp-h2">Five tiers of high-demand automation parts.</h2>
        <div className="lp-pillars">
          {CATEGORIES.map((c, i) => (
            <Link
              className={"lp-pillar" + (i === 0 ? " span2" : "")}
              key={c.id}
              href={`/catalog?cat=${c.id}`}
            >
              <span className="tier">{c.tier}</span>
              <h3>{c.label}</h3>
              <p>{c.blurb}</p>
              <div className="go">
                Browse <Ic.arrowR />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const VALUES = [
  { icon: <Ic.shield />, t: "Verified-refurb guarantee", d: "Every unit is bench-tested and ships with a 6-month functional warranty. No payment until you approve the quote." },
  { icon: <Ic.clock />, t: "Quotes in under 2 hours", d: "A live sourcing desk, not an inbox. Flag a line-down emergency and it jumps the queue." },
  { icon: <Ic.tag />, t: "RFQ-first sourcing", d: "No public cart pricing. We confirm availability, testing status, lead time and quote after checking the exact part." },
  { icon: <Ic.link />, t: "Cross-compatibility checked", d: "Each part is mapped to the host controllers and the robot arms it drives, so you order with confidence." },
];

export function WhyNodibot() {
  return (
    <section className="lp-section lp-why">
      <div className="wrap">
        <div className="lp-eyebrow">Why nodibot</div>
        <h2 className="lp-h2">Built for the engineer with a stopped production line.</h2>
        <div className="lp-values">
          {VALUES.map((v, i) => (
            <div className="lp-value" key={i}>
              <div className="ic">{v.icon}</div>
              <div>
                <h3>{v.t}</h3>
                <p>{v.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SourcingConfidence() {
  return (
    <section className="lp-section">
      <div className="wrap">
        <div className="lp-price-grid">
          <div>
            <div className="lp-eyebrow">Sourcing confidence</div>
            <h2 className="lp-h2">Confirm the right part before you buy.</h2>
            <p className="lp-lead">
              Legacy automation parts are messy: superseded models, repair-only stock, and
              compatibility traps. We keep the catalog focused on identification and RFQ so your
              quote is checked against the exact controller, robot model, and urgency.
            </p>
            <Link className="btn btn-dark btn-lg" style={{ marginTop: 26 }} href="/catalog">
              Browse the catalog <Ic.arrowR />
            </Link>
          </div>
          <div className="lp-compare">
            <div className="lp-compare-head">
              <div>
                <div
                  className="brand"
                  style={{
                    fontSize: 11,
                    fontWeight: 650,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                    marginBottom: 3,
                  }}
                >
                  ABB · FlexPendant
                </div>
                <div className="pn mono">3HAC028357-001</div>
              </div>
              <span className="badge badge-life">Discontinued</span>
            </div>
            <div className="lp-compare-body">
              <div className="lp-compare-row muted">
                <span className="lbl">
                  <span className="dotc" style={{ background: "var(--muted)" }} />
                  Compatibility
                </span>
                <span className="amt">IRC5</span>
              </div>
              <div className="lp-compare-row">
                <span className="lbl">
                  <span className="dotc" style={{ background: "var(--accent)" }} />
                  Availability
                </span>
                <span className="amt" style={{ color: "var(--accent)" }}>
                  RFQ ready
                </span>
              </div>
            </div>
            <div className="lp-compare-foot">
              <Ic.tag style={{ width: 16, height: 16 }} /> Quote confirmed after sourcing review
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function EmergencyBand() {
  return (
    <section className="lp-section tight">
      <div className="wrap">
        <div className="lp-band">
          <h2>Line down right now?</h2>
          <p>
            Skip the form. Message our sourcing desk on WhatsApp with your part number and we&apos;ll
            start hunting immediately.
          </p>
          <div className="cta-row">
            <WaChatLink className="btn btn-wa btn-lg">
              <Ic.whatsapp /> Chat to source now
            </WaChatLink>
            <Link
              className="btn btn-lg"
              style={{
                background: "rgba(255,255,255,.12)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,.2)",
              }}
              href="/catalog"
            >
              <Ic.bolt /> Find my part
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="lp-section lp-final">
      <div className="wrap lp-center">
        <div className="lp-eyebrow">Start sourcing</div>
        <h2>Got a part number?</h2>
        <p className="lp-lead">
          Drop it in and we&apos;ll tell you what we can source, what it costs, and how fast it ships.
        </p>
        <div className="cta-row">
          <Link className="btn btn-primary btn-lg" href="/catalog">
            <Ic.search /> Search the catalog
          </Link>
          <Link className="btn btn-ghost btn-lg" href="/bulk-rfq">
            <Ic.doc /> Bulk RFQ
          </Link>
        </div>
      </div>
    </section>
  );
}
