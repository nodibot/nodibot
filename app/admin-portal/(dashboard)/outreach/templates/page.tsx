import Link from "next/link";
import { getTemplates } from "@/app/_lib/outreach/queries";
import { TemplateForm } from "./TemplateForm";

export default async function TemplatesPage() {
  const templates = await getTemplates();
  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Templates</h1>
          <div className="sub">Variables: {"{{company}}"}, {"{{contact_name}}"}, {"{{part_number}}"}</div>
        </div>
        <Link className="btn" href="/admin-portal/outreach">← Back to outreach</Link>
      </div>
      <div className="admin-content" style={{ display: "grid", gap: 24 }}>
        <section>
          <h2>New / edit template</h2>
          <TemplateForm />
        </section>
        <section>
          <h2>Existing templates</h2>
          {templates.length === 0 ? (
            <div className="admin-empty">No templates yet. The cron needs one active <code>initial</code> and one active <code>reminder</code> template.</div>
          ) : (
            <ul style={{ display: "grid", gap: 12 }}>
              {templates.map((t) => (
                <li key={t.id} style={{ border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
                  <strong>{t.name}</strong> · {t.kind} {t.active ? "· active" : "· inactive"}
                  <div style={{ fontSize: 13, color: "#666" }}>Subject: {t.subject}</div>
                  <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{t.body}</pre>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
