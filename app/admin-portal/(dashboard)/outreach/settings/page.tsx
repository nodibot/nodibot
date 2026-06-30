import Link from "next/link";
import { getSettings } from "@/app/_lib/outreach/queries";
import { SettingsForm } from "./SettingsForm";

export default async function OutreachSettingsPage() {
  const settings = await getSettings();

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Outreach settings</h1>
          <div className="sub">
            {settings.paused ? (
              <span className="badge badge-urgent">Sending paused</span>
            ) : (
              <span className="badge badge-in">Sending active</span>
            )}
            {" · "}Daily cap {settings.daily_cap} · Reminder after {settings.reminder_delay_days} days
          </div>
        </div>
        <Link className="btn btn-ghost" href="/admin-portal/outreach">
          ← Back to outreach
        </Link>
      </div>

      <div className="admin-content">
        <section className="admin-panel" style={{ maxWidth: 560 }}>
          <h2 className="admin-section-title">Sending controls</h2>
          <p className="hint" style={{ marginBottom: 16 }}>
            Adjust daily volume and warm-up behavior. Use pause to stop the cron immediately without changing
            templates or lead data.
          </p>
          <SettingsForm settings={settings} />
        </section>
      </div>
    </>
  );
}
