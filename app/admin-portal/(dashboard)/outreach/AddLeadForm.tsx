"use client";

import { addLeadAction } from "./actions";

export function AddLeadForm() {
  return (
    <form action={addLeadAction} style={{ display: "grid", gap: 8, maxWidth: 480 }}>
      <input name="company" placeholder="Company *" required />
      <input name="contact_name" placeholder="Contact name" />
      <input name="email" type="email" placeholder="Email *" required />
      <input name="part_number" placeholder="Part number" />
      <input name="note" placeholder="Note" />
      <button type="submit" className="btn">Add lead</button>
    </form>
  );
}
