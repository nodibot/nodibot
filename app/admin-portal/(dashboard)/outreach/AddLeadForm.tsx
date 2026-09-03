"use client";

import { addLeadAction } from "./actions";

export function AddLeadForm() {
  return (
    <form action={addLeadAction} className="admin-form">
        <div className="grid2">
          <div className="field">
            <label>
              Company <span className="req">*</span>
            </label>
            <input name="company" placeholder="Acme Robotics" required />
          </div>
          <div className="field">
            <label>First name</label>
            <input name="first_name" placeholder="Sam" />
          </div>
        </div>
        <div className="grid2">
          <div className="field">
            <label>Last name</label>
            <input name="last_name" placeholder="Lee" />
          </div>
          <div className="field">
            <label>
              Email <span className="req">*</span>
            </label>
            <input name="email" type="email" placeholder="sam@acme.com" required />
          </div>
        </div>
        <div className="field">
          <label>Part number</label>
          <input name="part_number" placeholder="3HAC050363-001" className="mono" />
        </div>
      <div className="field">
        <label>Note</label>
        <textarea name="note" rows={3} placeholder="Optional context for this lead" />
      </div>
      <div className="admin-form-foot">
        <button type="submit" className="btn btn-primary">
          Add lead
        </button>
      </div>
    </form>
  );
}
