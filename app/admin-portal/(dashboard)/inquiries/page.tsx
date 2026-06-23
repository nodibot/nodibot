import Link from "next/link";
import { getInquiries } from "@/app/_lib/admin";
import type { Inquiry } from "@/app/_lib/types";
import { STATUSES } from "./status";
import { StatusSelect } from "./StatusSelect";

function LeadCard({ lead }: { lead: Inquiry }) {
  const date = new Date(lead.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return (
    <div className="lead-card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <Link className="pn" href={`/admin-portal/inquiries/${lead.id}`}>
          {lead.part_pn ?? "— (un-indexed part)"}
        </Link>
        {lead.urgency === "down" && <span className="badge badge-down">Line down</span>}
      </div>
      <div className="who">{lead.name}</div>
      <div className="meta">
        {lead.company && <>{lead.company}<br /></>}
        {lead.channel}: {lead.contact}
        <br />
        Qty {lead.qty ?? "—"} · {date} · {lead.ticket}
      </div>
      {lead.notes && <div className="notes">{lead.notes}</div>}
      <div className="lead-foot">
        <Link className="btn btn-ghost" href={`/admin-portal/inquiries/${lead.id}`} style={{ width: "100%", marginBottom: 8 }}>
          Source this inquiry
        </Link>
        <StatusSelect id={lead.id} status={lead.status} />
      </div>
    </div>
  );
}

export default async function AdminInquiriesPage() {
  const inquiries = await getInquiries();

  const byStatus = (status: string) => inquiries.filter((i) => i.status === status);

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Inquiries</h1>
          <div className="sub">{inquiries.length} total leads in the pipeline</div>
        </div>
      </div>

      <div className="admin-content">
        {inquiries.length === 0 ? (
          <div className="admin-empty">No inquiries yet. RFQ submissions will appear here.</div>
        ) : (
          <div className="pipeline">
            {STATUSES.map((s) => {
              const leads = byStatus(s.id);
              return (
                <div className="pipe-col" key={s.id}>
                  <div className="pipe-col-h">
                    <span>{s.label}</span>
                    <span className="ct">{leads.length}</span>
                  </div>
                  <div className="pipe-cards">
                    {leads.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
