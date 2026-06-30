"use server";

import { revalidatePath } from "next/cache";
import { createGmailSender } from "@/app/_lib/gmail";
import { createSupabaseServerClient } from "@/app/_lib/supabase-server";
import { addLead, deleteLead, getLeadsByIds, importLeads, saveSettings, saveTemplate, updateLead } from "@/app/_lib/outreach/queries";
import { parseLeadsFile } from "@/app/_lib/outreach/import-leads";
import { sendOutreachToLead, sleep } from "@/app/_lib/outreach/send";
import type { TemplateKind } from "@/app/_lib/outreach/types";

export type SendLeadsResult = { sent: number; failed: number; errors: string[] };

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
  const file = formData.get("csv");
  if (!(file instanceof File) || file.size === 0) {
    return { imported: 0, errors: ["Choose a CSV or Excel file to import."] };
  }

  const { rows, errors } = await parseLeadsFile(file);
  if (rows.length === 0 && errors.length === 0) {
    return { imported: 0, errors: ["File has no data rows."] };
  }

  const imported = await importLeads(rows);
  revalidatePath("/admin-portal/outreach");
  return { imported, errors };
}

export async function updateLeadAction(_prev: unknown, formData: FormData): Promise<{ ok: boolean; error: string | null }> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Missing lead id" };

  try {
    await updateLead(id, {
      company: String(formData.get("company") ?? "").trim(),
      contact_name: String(formData.get("contact_name") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim().toLowerCase(),
      part_number: String(formData.get("part_number") ?? "").trim() || null,
      note: String(formData.get("note") ?? "").trim() || null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return { ok: false, error: message };
  }

  revalidatePath("/admin-portal/outreach");
  return { ok: true, error: null };
}

export async function deleteLeadAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing lead id");
  await deleteLead(id);
  revalidatePath("/admin-portal/outreach");
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

// Coerce a FormData value to a positive integer, falling back to `fallback`
// for empty / non-numeric / out-of-range input (the form's min= is client-only).
function positiveInt(value: FormDataEntryValue | null, fallback: number): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 1 ? n : fallback;
}

export async function saveSettingsAction(formData: FormData) {
  await saveSettings({
    daily_cap: positiveInt(formData.get("daily_cap"), 20),
    warmup_start_date: (String(formData.get("warmup_start_date") ?? "").trim() || null),
    reminder_delay_days: positiveInt(formData.get("reminder_delay_days"), 7),
    paused: formData.get("paused") === "on",
  });
  revalidatePath("/admin-portal/outreach/settings");
}

export async function sendLeadsAction(leadIds: string[]): Promise<SendLeadsResult> {
  if (leadIds.length === 0) return { sent: 0, failed: 0, errors: [] };

  let sender;
  try {
    sender = createGmailSender();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gmail not configured";
    return { sent: 0, failed: leadIds.length, errors: [message] };
  }

  const leads = await getLeadsByIds(leadIds);
  const byId = new Map(leads.map((l) => [l.id, l]));
  const supabase = await createSupabaseServerClient();

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < leadIds.length; i++) {
    const lead = byId.get(leadIds[i]);
    if (!lead) {
      failed++;
      errors.push(`Lead not found: ${leadIds[i]}`);
      continue;
    }

    const result = await sendOutreachToLead(supabase, sender, lead);
    if (result.ok) sent++;
    else {
      failed++;
      errors.push(result.error);
    }

    if (i < leadIds.length - 1) await sleep(2000 + Math.floor(Math.random() * 4000));
  }

  revalidatePath("/admin-portal/outreach");
  return { sent, failed, errors };
}
