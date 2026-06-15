import Link from "next/link";
import { getLeads } from "@/app/_lib/outreach/queries";
import { AddLeadForm } from "./AddLeadForm";
import { ImportLeadsForm } from "./ImportLeadsForm";

export default async function OutreachPage() {
  const leads = await getLeads();
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
          {leads.length === 0 ? (
            <div className="admin-empty">No leads yet. Add one or import a CSV.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr><th style={{ textAlign: "left" }}>Company</th><th style={{ textAlign: "left" }}>Email</th><th style={{ textAlign: "left" }}>Part</th><th style={{ textAlign: "left" }}>Status</th><th style={{ textAlign: "left" }}>Last sent</th></tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} style={{ borderTop: "1px solid #eee" }}>
                    <td>{l.company}{l.contact_name ? ` · ${l.contact_name}` : ""}</td>
                    <td>{l.email}</td>
                    <td>{l.part_number ?? "—"}</td>
                    <td>{l.status}</td>
                    <td>{l.last_sent_at ? new Date(l.last_sent_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
