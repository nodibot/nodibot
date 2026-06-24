import Link from "next/link";
import { getLeads } from "@/app/_lib/outreach/queries";
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
  const leads = await getLeads();
  const pageSize = 20;
  const currentPage = parsePageParam(params);
  const pagedLeads = paginateItems(leads, currentPage, pageSize);
  const byStatus = (s: string) => leads.filter((l) => l.status === s).length;

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Outreach</h1>
          <div className="sub">{leads.length} leads · {byStatus("pending")} pending · {byStatus("contacted")} contacted · {byStatus("replied")} replied</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link className="btn" href="/admin-portal/outreach/templates">Templates</Link>
          <Link className="btn" href="/admin-portal/outreach/settings">Settings</Link>
        </div>
      </div>

      <div className="admin-content" style={{ display: "grid", gap: 24 }}>
        <section>
          <h2>Add a lead</h2>
          <AddLeadForm />
        </section>

        <section>
          <h2>Import CSV</h2>
          <ImportLeadsForm />
        </section>

        <section>
          <h2>Leads</h2>
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
