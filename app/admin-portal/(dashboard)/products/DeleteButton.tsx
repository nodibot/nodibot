"use client";

import { deletePartAction } from "./actions";

export function DeleteButton({ id, pn }: { id: string; pn: string }) {
  return (
    <form
      action={deletePartAction}
      onSubmit={(e) => {
        if (!confirm(`Delete ${pn}? This removes it from the catalog.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="btn btn-ghost btn-sm" type="submit">
        Delete
      </button>
    </form>
  );
}
