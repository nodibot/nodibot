"use client";

import { deleteLeadAction } from "./actions";

export function LeadDeleteButton({ id, company }: { id: string; company: string }) {
  return (
    <form
      action={deleteLeadAction}
      onSubmit={(e) => {
        if (!confirm(`Delete ${company}? This cannot be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="btn btn-ghost btn-sm" type="submit">
        Delete
      </button>
    </form>
  );
}
