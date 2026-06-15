"use client";

import { useActionState } from "react";
import { importLeadsAction } from "./actions";

const initial = { imported: 0, errors: [] as string[] };

export function ImportLeadsForm() {
  const [state, formAction, pending] = useActionState(importLeadsAction, initial);
  return (
    <form action={formAction} style={{ display: "grid", gap: 8, maxWidth: 640 }}>
      <p style={{ fontSize: 13, color: "#666" }}>
        Paste CSV with a header row. Required columns: <code>company</code>, <code>email</code>. Optional: <code>contact_name</code>, <code>part_number</code>, <code>note</code>.
      </p>
      <textarea name="csv" rows={6} placeholder="company,contact_name,email,part_number,note&#10;Acme,Sam,sam@acme.com,ABC-1,hot lead" required />
      <button type="submit" className="btn" disabled={pending}>{pending ? "Importing…" : "Import"}</button>
      {state.imported > 0 && <p style={{ color: "green" }}>Imported {state.imported} lead(s).</p>}
      {state.errors.length > 0 && (
        <ul style={{ color: "#b00", fontSize: 13 }}>
          {state.errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
    </form>
  );
}
