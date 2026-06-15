"use client";

import { saveTemplateAction } from "../actions";

export function TemplateForm() {
  return (
    <form action={saveTemplateAction} style={{ display: "grid", gap: 8, maxWidth: 640 }}>
      <input name="name" placeholder="Template name *" required />
      <select name="kind" defaultValue="initial">
        <option value="initial">initial</option>
        <option value="reminder">reminder</option>
      </select>
      <input name="subject" placeholder="Subject *" required />
      <textarea name="body" rows={8} placeholder="Hi {{contact_name}}, we stock parts for {{company}}…" required />
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" name="active" defaultChecked /> Active
      </label>
      <button type="submit" className="btn">Save template</button>
    </form>
  );
}
