"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { OutreachLead, OutreachStatus } from "@/app/_lib/outreach/types";
import { updateLeadAction } from "./actions";

type UpdateState = { ok: boolean; error: string | null };

const initial: UpdateState = { ok: false, error: null };

const STATUSES: OutreachStatus[] = [
  "pending",
  "contacted",
  "reminded",
  "replied",
  "bounced",
  "unsubscribed",
  "completed",
];

export function LeadEditPanel({ lead, onClose }: { lead: OutreachLead; onClose: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateLeadAction, initial);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
      onClose();
    }
  }, [state.ok, onClose, router]);

  return (
    <section className="admin-panel" style={{ marginBottom: 16 }}>
      <h2 className="admin-section-title">Edit lead</h2>
      <form action={formAction} className="admin-form">
        <input type="hidden" name="id" value={lead.id} />
        <div className="grid2">
          <div className="field">
            <label>
              Company <span className="req">*</span>
            </label>
            <input name="company" defaultValue={lead.company} required />
          </div>
          <div className="field">
            <label>First name</label>
            <input name="first_name" defaultValue={lead.first_name ?? ""} />
          </div>
        </div>
        <div className="grid2">
          <div className="field">
            <label>Last name</label>
            <input name="last_name" defaultValue={lead.last_name ?? ""} />
          </div>
          <div className="field">
            <label>
              Email <span className="req">*</span>
            </label>
            <input name="email" type="email" defaultValue={lead.email} required />
          </div>
        </div>
        <div className="grid2">
          <div className="field">
            <label>Part number</label>
            <input name="part_number" defaultValue={lead.part_number ?? ""} className="mono" />
          </div>
          <div className="field">
            <label>Status</label>
            <select name="status" defaultValue={lead.status} className="select">
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Note</label>
          <textarea name="note" rows={3} defaultValue={lead.note ?? ""} />
        </div>
        {state.error && <div className="admin-feedback error">{state.error}</div>}
        <div className="admin-form-foot">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={pending}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
