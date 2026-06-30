"use client";

import { useActionState, useRef } from "react";
import { importLeadsAction } from "./actions";

const initial = { imported: 0, errors: [] as string[] };

export function ImportLeadsForm() {
  const [state, formAction, pending] = useActionState(importLeadsAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction} className="admin-form">
      <p className="hint">
        Upload a <code>.csv</code> or Excel <code>.xlsx</code> file. Required columns:{" "}
        <code>company</code>, <code>email</code>. Optional: <code>contact_name</code>,{" "}
        <code>part_number</code>, <code>note</code>.
      </p>

      <div className="admin-form-foot">
        <label className="btn btn-primary">
          {pending ? "Importing…" : "Import leads"}
          <input
            type="file"
            name="csv"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            required
            hidden
            disabled={pending}
            onChange={(e) => {
              if (e.target.files?.[0]) formRef.current?.requestSubmit();
            }}
          />
        </label>
      </div>

      {state.imported > 0 && (
        <div className="admin-feedback success">Imported {state.imported} lead(s).</div>
      )}
      {state.errors.length > 0 && (
        <div className="admin-feedback error">
          <ul>
            {state.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
