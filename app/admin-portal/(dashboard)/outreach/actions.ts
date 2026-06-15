"use server";

import { revalidatePath } from "next/cache";
import { addLead, importLeads, saveSettings, saveTemplate } from "@/app/_lib/outreach/queries";
import { parseLeadsCsv } from "@/app/_lib/outreach/csv";
import type { TemplateKind } from "@/app/_lib/outreach/types";

export async function addLeadAction(formData: FormData) {
  await addLead({
    company: String(formData.get("company") ?? "").trim(),
    contact_name: (String(formData.get("contact_name") ?? "").trim() || null),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    part_number: (String(formData.get("part_number") ?? "").trim() || null),
    note: (String(formData.get("note") ?? "").trim() || null),
  });
  revalidatePath("/admin-portal/outreach");
}

export async function importLeadsAction(_prev: unknown, formData: FormData): Promise<{ imported: number; errors: string[] }> {
  const text = String(formData.get("csv") ?? "");
  const { rows, errors } = parseLeadsCsv(text);
  const imported = await importLeads(rows);
  revalidatePath("/admin-portal/outreach");
  return { imported, errors };
}

export async function saveTemplateAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  await saveTemplate({
    id: id || undefined,
    name: String(formData.get("name") ?? "").trim(),
    kind: String(formData.get("kind") ?? "initial") as TemplateKind,
    subject: String(formData.get("subject") ?? ""),
    body: String(formData.get("body") ?? ""),
    active: formData.get("active") === "on",
  });
  revalidatePath("/admin-portal/outreach/templates");
}

export async function saveSettingsAction(formData: FormData) {
  await saveSettings({
    daily_cap: Number(formData.get("daily_cap") ?? 20),
    warmup_start_date: (String(formData.get("warmup_start_date") ?? "").trim() || null),
    reminder_delay_days: Number(formData.get("reminder_delay_days") ?? 7),
    paused: formData.get("paused") === "on",
  });
  revalidatePath("/admin-portal/outreach/settings");
}
