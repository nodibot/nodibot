"use client";

import { saveTemplateAction } from "../actions";

export function TemplateForm() {
  return (
    <form action={saveTemplateAction} className="admin-form">
      <div className="grid2">
        <div className="field">
          <label>
            Template name <span className="req">*</span>
          </label>
          <input name="name" placeholder="Initial outreach v1" required />
        </div>
        <div className="field">
          <label>Kind</label>
          <select name="kind" defaultValue="initial" className="select">
            <option value="initial">initial</option>
            <option value="reminder">reminder</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label>
          Subject <span className="req">*</span>
        </label>
        <input name="subject" placeholder="Parts sourcing for {{company}}" required />
      </div>
      <div className="field">
        <label>
          Body <span className="req">*</span>
        </label>
        <textarea
          name="body"
          rows={10}
          placeholder="Hi {{contact_name}}, we can help source {{part_number}} for {{company}}…"
          required
        />
      </div>
      <label className="admin-toggle">
        <input type="checkbox" name="active" defaultChecked />
        Active template
      </label>
      <div className="admin-form-foot">
        <button type="submit" className="btn btn-primary">
          Save template
        </button>
      </div>
    </form>
  );
}
