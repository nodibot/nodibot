"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OutreachLead, OutreachStatus } from "@/app/_lib/outreach/types";
import { sendLeadsAction } from "./actions";
import { LeadDeleteButton } from "./LeadDeleteButton";
import { LeadEditPanel } from "./LeadEditPanel";

function isSendable(status: OutreachLead["status"]) {
  return status === "pending" || status === "contacted";
}

function statusBadgeClass(status: OutreachStatus): string {
  switch (status) {
    case "pending":
      return "badge badge-req";
    case "contacted":
    case "reminded":
      return "badge badge-life";
    case "replied":
    case "completed":
      return "badge badge-in";
    case "bounced":
      return "badge badge-urgent";
    case "unsubscribed":
      return "badge badge-life dim";
    default:
      return "badge badge-life";
  }
}

function formatLastSent(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

export function LeadsTable({ leads }: { leads: OutreachLead[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<OutreachLead | null>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ sent: number; failed: number; errors: string[] } | null>(null);

  const sendableLeads = leads.filter((l) => isSendable(l.status));
  const allSendableSelected =
    sendableLeads.length > 0 && sendableLeads.every((l) => selected.has(l.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllSendable() {
    if (allSendableSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sendableLeads.map((l) => l.id)));
    }
  }

  function handleSend() {
    const ids = [...selected];
    setFeedback(null);
    startTransition(async () => {
      const result = await sendLeadsAction(ids);
      setFeedback(result);
      if (result.sent > 0) {
        setSelected(new Set());
        router.refresh();
      }
    });
  }

  if (leads.length === 0) {
    return <div className="admin-empty">No leads yet. Add one above or import a file.</div>;
  }

  return (
    <>
      {editing && <LeadEditPanel key={editing.id} lead={editing} onClose={() => setEditing(null)} />}

      {(selected.size > 0 || feedback) && (
        <div className="admin-toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {selected.size > 0 && (
              <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={handleSend}>
                {pending ? "Sending…" : `Send to ${selected.size} selected`}
              </button>
            )}
            {selected.size > 0 && (
              <span className="admin-toolbar-note">
                Pending leads get the initial template; contacted leads get the reminder.
              </span>
            )}
          </div>
          {feedback && (
            <div style={{ width: "100%" }}>
              {feedback.sent > 0 && (
                <div className="admin-feedback success">Sent {feedback.sent} email(s).</div>
              )}
              {feedback.failed > 0 && (
                <div className="admin-feedback error" style={{ marginTop: feedback.sent > 0 ? 8 : 0 }}>
                  <ul>
                    {feedback.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 44 }}>
                <input
                  type="checkbox"
                  aria-label="Select all sendable leads"
                  checked={allSendableSelected}
                  disabled={sendableLeads.length === 0}
                  onChange={toggleAllSendable}
                />
              </th>
              <th>Company</th>
              <th>Email</th>
              <th>Part</th>
              <th>Status</th>
              <th>Last sent</th>
              <th style={{ width: 140 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => {
              const sendable = isSendable(l.status);
              return (
                <tr key={l.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${l.company}`}
                      checked={selected.has(l.id)}
                      disabled={!sendable}
                      onChange={() => toggle(l.id)}
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: 650 }}>{l.company}</div>
                    {l.contact_name && (
                      <div className="dim" style={{ fontSize: 12.5, marginTop: 2 }}>
                        {l.contact_name}
                      </div>
                    )}
                    {l.note && (
                      <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 6, lineHeight: 1.4 }}>
                        {l.note}
                      </div>
                    )}
                  </td>
                  <td className="mono">{l.email}</td>
                  <td className="mono">{l.part_number ?? "—"}</td>
                  <td>
                    <span className={statusBadgeClass(l.status)}>{l.status}</span>
                  </td>
                  <td className="dim">
                    {l.last_sent_at ? formatLastSent(l.last_sent_at) : "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditing(l)}
                      >
                        Edit
                      </button>
                      <LeadDeleteButton id={l.id} company={l.company} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
