"use client";

import { useState } from "react";
import type { EmailTemplate } from "@/app/_lib/outreach/types";
import { TemplateDeleteButton } from "./TemplateDeleteButton";
import { TemplateForm } from "./TemplateForm";

export function TemplatesList({ templates }: { templates: EmailTemplate[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {templates.map((t) =>
        editingId === t.id ? (
          <article key={t.id} className="admin-template-card">
            <h3 className="admin-section-title" style={{ marginBottom: 12 }}>
              Edit template
            </h3>
            <TemplateForm template={t} onCancel={() => setEditingId(null)} />
          </article>
        ) : (
          <article key={t.id} className="admin-template-card">
            <div className="admin-template-card-head">
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{t.name}</div>
                <div className="dim" style={{ fontSize: 12.5, marginTop: 4 }}>
                  Subject: {t.subject}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
                <span className="badge badge-life">{t.kind}</span>
                <span className={t.active ? "badge badge-in" : "badge badge-life dim"}>
                  {t.active ? "Active" : "Inactive"}
                </span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingId(t.id)}>
                  Edit
                </button>
                <TemplateDeleteButton id={t.id} name={t.name} />
              </div>
            </div>
            <pre>{t.body}</pre>
          </article>
        ),
      )}
    </div>
  );
}
