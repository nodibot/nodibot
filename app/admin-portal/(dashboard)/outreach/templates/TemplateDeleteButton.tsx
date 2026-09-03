"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteTemplateAction } from "../actions";

type DeleteState = { ok: boolean; error: string | null };

const initial: DeleteState = { ok: false, error: null };

export function TemplateDeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(deleteTemplateAction, initial);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(`Delete template “${name}”? This cannot be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="btn btn-ghost btn-sm" type="submit" disabled={pending}>
        {pending ? "Deleting…" : "Delete"}
      </button>
      {state.error && (
        <div className="admin-feedback error" style={{ marginTop: 8 }}>
          {state.error}
        </div>
      )}
    </form>
  );
}
