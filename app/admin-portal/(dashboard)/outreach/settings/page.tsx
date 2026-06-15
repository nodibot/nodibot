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
          <div className="sub">{settings.paused ? "⏸ Sending is paused" : "▶ Sending is active"}</div>
        </div>
        <Link className="btn" href="/admin-portal/outreach">← Back to outreach</Link>
      </div>
      <div className="admin-content">
        <SettingsForm settings={settings} />
      </div>
    </>
  );
}
