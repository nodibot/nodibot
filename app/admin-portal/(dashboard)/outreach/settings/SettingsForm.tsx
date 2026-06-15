"use client";

import { saveSettingsAction } from "../actions";
import type { OutreachSettings } from "@/app/_lib/outreach/types";

export function SettingsForm({ settings }: { settings: OutreachSettings }) {
  return (
    <form action={saveSettingsAction} style={{ display: "grid", gap: 12, maxWidth: 480 }}>
      <label>Daily cap
        <input name="daily_cap" type="number" min={1} defaultValue={settings.daily_cap} />
      </label>
      <label>Reminder delay (days)
        <input name="reminder_delay_days" type="number" min={1} defaultValue={settings.reminder_delay_days} />
      </label>
      <label>Warm-up start date (optional)
        <input name="warmup_start_date" type="date" defaultValue={settings.warmup_start_date ?? ""} />
      </label>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" name="paused" defaultChecked={settings.paused} /> Pause all sending
      </label>
      <button type="submit" className="btn">Save settings</button>
    </form>
  );
}
