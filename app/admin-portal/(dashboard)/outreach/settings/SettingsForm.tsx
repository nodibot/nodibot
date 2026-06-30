"use client";

import { saveSettingsAction } from "../actions";
import type { OutreachSettings } from "@/app/_lib/outreach/types";

export function SettingsForm({ settings }: { settings: OutreachSettings }) {
  return (
    <form action={saveSettingsAction} className="admin-form">
      <div className="grid2">
        <div className="field">
          <label>Daily cap</label>
          <input name="daily_cap" type="number" min={1} defaultValue={settings.daily_cap} />
        </div>
        <div className="field">
          <label>Reminder delay (days)</label>
          <input name="reminder_delay_days" type="number" min={1} defaultValue={settings.reminder_delay_days} />
        </div>
      </div>
      <div className="field">
        <label>Warm-up start date (optional)</label>
        <input name="warmup_start_date" type="date" defaultValue={settings.warmup_start_date ?? ""} />
      </div>
      <label className="admin-toggle">
        <input type="checkbox" name="paused" defaultChecked={settings.paused} />
        Pause all sending
      </label>
      <div className="admin-form-foot">
        <button type="submit" className="btn btn-primary">
          Save settings
        </button>
      </div>
    </form>
  );
}
