import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase-server";
import type { EmailTemplate, OutreachLead, OutreachSettings, TemplateKind } from "./types";
import type { ParsedLead } from "./csv";

// ---- reads (admin UI, cookie client) ----

export async function getLeads(): Promise<OutreachLead[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("outreach_leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as OutreachLead[];
}

export async function getTemplates(): Promise<EmailTemplate[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("email_templates").select("*").order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as EmailTemplate[];
}

export async function getSettings(): Promise<OutreachSettings> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("outreach_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(error.message);
  return data as OutreachSettings;
}

// ---- writes (admin UI) ----

export async function addLead(input: { company: string; contact_name: string | null; email: string; part_number: string | null; note: string | null }): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("outreach_leads").insert({ ...input, source: "manual" });
  if (error) throw new Error(error.message);
}

// Upsert imported rows by email (no duplicates). Returns inserted/updated count.
export async function importLeads(rows: ParsedLead[]): Promise<number> {
  if (rows.length === 0) return 0;
  const supabase = await createSupabaseServerClient();
  const { error, count } = await supabase
    .from("outreach_leads")
    .upsert(rows.map((r) => ({ ...r, source: "csv" as const })), { onConflict: "email", ignoreDuplicates: false, count: "exact" });
  if (error) throw new Error(error.message);
  return count ?? rows.length;
}

export async function saveTemplate(input: { id?: string; name: string; kind: TemplateKind; subject: string; body: string; active: boolean }): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (input.id) {
    const { error } = await supabase.from("email_templates").update(input).eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("email_templates").insert(input);
    if (error) throw new Error(error.message);
  }
}

export async function saveSettings(input: { daily_cap: number; warmup_start_date: string | null; reminder_delay_days: number; paused: boolean }): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("outreach_settings").update(input).eq("id", 1);
  if (error) throw new Error(error.message);
}

// ---- cron reads/writes (injected service client) ----

export async function getSettingsWith(supabase: SupabaseClient): Promise<OutreachSettings> {
  const { data, error } = await supabase.from("outreach_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(error.message);
  return data as OutreachSettings;
}

export async function getActiveLeadsWith(supabase: SupabaseClient): Promise<OutreachLead[]> {
  const { data, error } = await supabase
    .from("outreach_leads")
    .select("*")
    .in("status", ["pending", "contacted", "reminded"]);
  if (error) throw new Error(error.message);
  return (data ?? []) as OutreachLead[];
}

export async function getActiveTemplateWith(supabase: SupabaseClient, kind: TemplateKind): Promise<EmailTemplate | null> {
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("kind", kind)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as EmailTemplate) ?? null;
}

export async function countSentTodayWith(supabase: SupabaseClient, startOfDayIso: string): Promise<number> {
  const { count, error } = await supabase
    .from("outreach_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", startOfDayIso);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getLatestMessageWith(supabase: SupabaseClient, leadId: string) {
  const { data, error } = await supabase
    .from("outreach_messages")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as { gmail_thread_id: string | null; gmail_message_id: string | null; sent_at: string | null } | null;
}

export async function recordMessageWith(
  supabase: SupabaseClient,
  msg: { lead_id: string; template_id: string | null; step: "initial" | "reminder"; gmail_message_id: string | null; gmail_thread_id: string | null; status: "sent" | "failed"; error: string | null; sent_at: string | null },
): Promise<void> {
  const { error } = await supabase.from("outreach_messages").insert(msg);
  if (error) throw new Error(error.message);
}

export async function updateLeadStatusWith(
  supabase: SupabaseClient,
  leadId: string,
  fields: { status: string; last_sent_at?: string; reply_detected_at?: string },
): Promise<void> {
  const patch: Record<string, unknown> = { status: fields.status, updated_at: new Date().toISOString() };
  if (fields.last_sent_at) patch.last_sent_at = fields.last_sent_at;
  const { error } = await supabase.from("outreach_leads").update(patch).eq("id", leadId);
  if (error) throw new Error(error.message);
}
