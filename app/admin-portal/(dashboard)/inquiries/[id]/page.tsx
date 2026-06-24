import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getInquiryById,
  getPartForInquiry,
  getSourcingQuotes,
} from "@/app/_lib/admin";
import { buildChineseSourcingQuery, buildSourcingSearchLinks, buildSourcingQuery } from "@/app/_lib/sourcing/search-links";
import type { SourcingQuote } from "@/app/_lib/types";
import { PartImage, StockBadge, LifeBadge } from "@/app/_components/badges";
import { Pagination, paginateItems, parsePageParam } from "../../_components/Pagination";
import { StatusSelect } from "../StatusSelect";
import { selectSourcingQuoteAction } from "../actions";
import { CopyButton } from "./CopyButton";
import { SourcingQuoteForm } from "./SourcingQuoteForm";

function host(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
        {label}
      </div>
      <div style={{ fontWeight: 650 }}>{value || "—"}</div>
    </div>
  );
}

function QuoteTable({ quotes }: { quotes: SourcingQuote[] }) {
  if (quotes.length === 0) {
    return <div className="admin-empty" style={{ padding: "30px 0" }}>No supplier findings logged yet.</div>;
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Listing</th>
            <th>Terms</th>
            <th>Notes</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => (
            <tr key={q.id}>
              <td>
                <strong>{q.supplier_name}</strong>
                <div className="sub">{q.platform}{q.contact_handle ? ` · ${q.contact_handle}` : ""}</div>
                {q.selected && <span className="badge badge-in">Selected</span>}
              </td>
              <td>
                <a href={q.listing_url} target="_blank" rel="noopener noreferrer">
                  {host(q.listing_url)}
                </a>
              </td>
              <td>
                <div>{q.condition || "Condition TBD"}</div>
                <div className="sub">
                  MOQ {q.moq ?? "—"} · Lead {q.lead_time_days ?? "—"}d
                </div>
              </td>
              <td>{q.notes || "—"}</td>
              <td className="row-actions">
                {!q.selected && (
                  <form action={selectSourcingQuoteAction}>
                    <input type="hidden" name="quote_id" value={q.id} />
                    <button className="btn btn-ghost" type="submit">Mark selected</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function InquiryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const { id } = await params;
  const inquiry = await getInquiryById(id);
  if (!inquiry) notFound();

  const [part, quotes] = await Promise.all([
    getPartForInquiry(inquiry),
    getSourcingQuotes(inquiry.id),
  ]);
  const searchLinks = buildSourcingSearchLinks(inquiry, part);
  const searchText = buildSourcingQuery(inquiry, part);
  const chineseSearchText = buildChineseSourcingQuery(inquiry, part);
  const quotePageSize = 8;
  const quotePage = parsePageParam(query, "quotesPage");
  const pagedQuotes = paginateItems(quotes, quotePage, quotePageSize);

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>{inquiry.part_pn ?? "Un-indexed inquiry"}</h1>
          <div className="sub">{inquiry.ticket} · {inquiry.channel} · {new Date(inquiry.created_at).toLocaleString()}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Link className="btn btn-ghost" href="/admin-portal/inquiries">Back to pipeline</Link>
          <StatusSelect id={inquiry.id} status={inquiry.status} />
        </div>
      </div>

      <div className="admin-content" style={{ display: "grid", gap: 24 }}>
        <section className="admin-stat">
          <h2 style={{ margin: "0 0 14px", fontSize: 18 }}>Inquiry</h2>
          <div className="grid3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            <DetailRow label="Customer" value={inquiry.name} />
            <DetailRow label="Company" value={inquiry.company} />
            <DetailRow label="Contact" value={inquiry.contact} />
            <DetailRow label="Urgency" value={inquiry.urgency === "down" ? "Line down" : "Spare / planned"} />
            <DetailRow label="Qty" value={inquiry.qty} />
            <DetailRow label="Condition" value={inquiry.cond} />
          </div>
          {inquiry.notes && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Notes</div>
              <p style={{ margin: "6px 0 0" }}>{inquiry.notes}</p>
            </div>
          )}
        </section>

        <section className="admin-stat">
          <h2 style={{ margin: "0 0 14px", fontSize: 18 }}>Sourcing search</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {searchText && <CopyButton value={searchText} label="Copy search" />}
            {chineseSearchText && <CopyButton value={chineseSearchText} label="Copy CN search" />}
            {inquiry.part_pn && <CopyButton value={inquiry.part_pn} label="Copy PN" />}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            {searchLinks.map((link) => (
              <a
                key={link.label}
                className="btn"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                title={link.hint}
                style={{ justifyContent: "center" }}
              >
                Search {link.label}
              </a>
            ))}
          </div>
        </section>

        {part && (
          <section className="admin-stat">
            <h2 style={{ margin: "0 0 14px", fontSize: 18 }}>Catalog part context</h2>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 18 }}>
              <PartImage part={part} />
              <div>
                <div className="sub">{part.brand}</div>
                <h3 className="mono" style={{ margin: "2px 0 4px" }}>{part.pn}</h3>
                <p style={{ margin: "0 0 10px" }}>{part.name}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <StockBadge part={part} />
                  <LifeBadge life={part.life} />
                  {part.alternativePns.map((pn) => (
                    <span className="badge badge-life" key={pn}>{pn}</span>
                  ))}
                </div>
                {part.descriptionKr && <p style={{ margin: "0 0 10px" }}>{part.descriptionKr}</p>}
                {part.sourceUrls.length > 0 && (
                  <div>
                    <strong>Saved source URLs</strong>
                    <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                      {part.sourceUrls.map((url) => (
                        <li key={url}>
                          <a href={url} target="_blank" rel="noopener noreferrer">{host(url)}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="admin-stat">
          <h2 style={{ margin: "0 0 14px", fontSize: 18 }}>Supplier findings</h2>
          <QuoteTable quotes={pagedQuotes} />
          <Pagination
            pathname={`/admin-portal/inquiries/${inquiry.id}`}
            currentPage={quotePage}
            totalItems={quotes.length}
            pageSize={quotePageSize}
            searchParams={query}
            pageParam="quotesPage"
          />
        </section>

        <section className="admin-stat">
          <h2 style={{ margin: "0 0 14px", fontSize: 18 }}>Log supplier finding</h2>
          <SourcingQuoteForm inquiryId={inquiry.id} />
        </section>
      </div>
    </>
  );
}
