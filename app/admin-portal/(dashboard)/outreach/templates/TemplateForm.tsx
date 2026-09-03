"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { EmailTemplate } from "@/app/_lib/outreach/types";
import { saveTemplateAction } from "../actions";

type SaveState = { ok: boolean; error: string | null };

const initial: SaveState = { ok: false, error: null };

export function TemplateForm({
  template,
  onCancel,
}: {
  template?: EmailTemplate;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveTemplateAction, initial);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
      onCancel?.();
    }
  }, [state.ok, onCancel, router]);

  return (
    <form action={formAction} className="admin-form">
      {template && <input type="hidden" name="id" value={template.id} />}
      <div className="grid2">
        <div className="field">
          <label>
            Template name <span className="req">*</span>
          </label>
          <input
            name="name"
            placeholder="Initial outreach v1"
            defaultValue={template?.name}
            required
          />
        </div>
        <div className="field">
          <label>Kind</label>
          <select name="kind" defaultValue={template?.kind ?? "initial"} className="select">
            <option value="initial">initial</option>
            <option value="reminder">reminder</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label>
          Subject <span className="req">*</span>
        </label>
        <input
          name="subject"
          placeholder="Parts sourcing for {{company}}"
          defaultValue={template?.subject}
          required
        />
      </div>
      <div className="field">
        <label>
          Body <span className="req">*</span>
        </label>
        <textarea
          name="body"
          rows={10}
          placeholder="Hi {{contact_name}}, we can help source {{part_number}} for {{company}}…"
          defaultValue={template?.body}
          required
        />
      </div>
      <label className="admin-toggle">
        <input type="checkbox" name="active" defaultChecked={template?.active ?? true} />
        Active template
      </label>
      {state.error && <div className="admin-feedback error">{state.error}</div>}
      <div className="admin-form-foot">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : template ? "Save changes" : "Save template"}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
