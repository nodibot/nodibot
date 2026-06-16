"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OutreachLead } from "@/app/_lib/outreach/types";
import { sendLeadsAction } from "./actions";

function isSendable(status: OutreachLead["status"]) {
  return status === "pending" || status === "contacted";
}

export function LeadsTable({ leads }: { leads: OutreachLead[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
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
    return <div className="admin-empty">No leads yet. Add one or import a CSV.</div>;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {selected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" className="btn" disabled={pending} onClick={handleSend}>
            {pending ? "Sending…" : `Send to ${selected.size} selected`}
          </button>
          <span style={{ fontSize: 13, color: "#666" }}>
            Pending leads get the initial template; contacted leads get the reminder.
          </span>
        </div>
      )}

      {feedback && (
        <div style={{ fontSize: 13 }}>
          {feedback.sent > 0 && <p style={{ color: "green", margin: 0 }}>Sent {feedback.sent} email(s).</p>}
          {feedback.failed > 0 && (
            <ul style={{ color: "#b00", margin: "4px 0 0", paddingLeft: 20 }}>
              {feedback.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", width: 36 }}>
              <input
                type="checkbox"
                aria-label="Select all sendable leads"
                checked={allSendableSelected}
                disabled={sendableLeads.length === 0}
                onChange={toggleAllSendable}
              />
            </th>
            <th style={{ textAlign: "left" }}>Company</th>
            <th style={{ textAlign: "left" }}>Email</th>
            <th style={{ textAlign: "left" }}>Part</th>
            <th style={{ textAlign: "left" }}>Status</th>
            <th style={{ textAlign: "left" }}>Last sent</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => {
            const sendable = isSendable(l.status);
            return (
              <tr key={l.id} style={{ borderTop: "1px solid #eee" }}>
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
                  {l.company}
                  {l.contact_name ? ` · ${l.contact_name}` : ""}
                </td>
                <td>{l.email}</td>
                <td>{l.part_number ?? "—"}</td>
                <td>{l.status}</td>
                <td>{l.last_sent_at ? new Date(l.last_sent_at).toLocaleDateString() : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
