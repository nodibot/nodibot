import Link from "next/link";
import { getLeads, getSettings } from "@/app/_lib/outreach/queries";
import { Pagination, paginateItems, parsePageParam } from "../_components/Pagination";
import { AddLeadForm } from "./AddLeadForm";
import { ImportLeadsForm } from "./ImportLeadsForm";
import { LeadsTable } from "./LeadsTable";

export default async function OutreachPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [leads, settings] = await Promise.all([getLeads(), getSettings()]);
  const pageSize = 20;
  const currentPage = parsePageParam(params);
  const pagedLeads = paginateItems(leads, currentPage, pageSize);
  const byStatus = (s: string) => leads.filter((l) => l.status === s).length;

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Outreach</h1>
          <div className="sub">
            {leads.length} leads · daily cap {settings.daily_cap}
            {settings.paused ? " · sending paused" : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn btn-ghost" href="/admin-portal/outreach/templates">
            Templates
          </Link>
          <Link className="btn btn-ghost" href="/admin-portal/outreach/settings">
            Settings
          </Link>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-stats">
          <div className="admin-stat">
            <div className="n">{leads.length}</div>
            <div className="l">Total leads</div>
          </div>
          <div className="admin-stat">
            <div className="n">{byStatus("pending")}</div>
            <div className="l">Pending</div>
          </div>
          <div className="admin-stat">
            <div className="n">{byStatus("contacted") + byStatus("reminded")}</div>
            <div className="l">In sequence</div>
          </div>
          <div className="admin-stat">
            <div className="n">{byStatus("replied")}</div>
            <div className="l">Replied</div>
          </div>
        </div>

        <div className="admin-outreach-grid">
          <section className="admin-panel">
            <h2 className="admin-section-title">Add a lead</h2>
            <AddLeadForm />
          </section>
          <section className="admin-panel">
            <h2 className="admin-section-title">Import leads</h2>
            <ImportLeadsForm />
          </section>
        </div>

        <section className="admin-table-section">
          <h2 className="admin-section-title">Leads</h2>
          <LeadsTable leads={pagedLeads} />
          <Pagination
            pathname="/admin-portal/outreach"
            currentPage={currentPage}
            totalItems={leads.length}
            pageSize={pageSize}
            searchParams={params}
          />
        </section>
      </div>
    </>
  );
}
