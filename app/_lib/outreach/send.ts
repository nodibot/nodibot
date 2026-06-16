import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailSender } from "../gmail";
import { renderTemplate } from "./templating";
import {
  getActiveTemplateWith,
  getLatestMessageWith,
  recordMessageWith,
  updateLeadStatusWith,
} from "./queries";
import type { OutreachLead, OutreachStep } from "./types";

const FOOTER_ADDRESS = process.env.OUTREACH_MAILING_ADDRESS ?? "";

export function sendStepForStatus(status: OutreachLead["status"]): OutreachStep | null {
  if (status === "pending") return "initial";
  if (status === "contacted") return "reminder";
  return null;
}

export async function sendOutreachToLead(
  supabase: SupabaseClient,
  sender: EmailSender,
  lead: OutreachLead,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const step = sendStepForStatus(lead.status);
  if (!step) {
    return { ok: false, error: `${lead.email}: cannot send (status: ${lead.status})` };
  }

  const tpl = await getActiveTemplateWith(supabase, step);
  if (!tpl) {
    return { ok: false, error: `No active ${step} template` };
  }

  const footer = `${lead.company}\n${FOOTER_ADDRESS}\nReply STOP to unsubscribe.`;
  const rendered = renderTemplate(
    { subject: tpl.subject, body: tpl.body },
    { company: lead.company, contact_name: lead.contact_name, part_number: lead.part_number },
    footer,
  );

  let threadId: string | undefined;
  let inReplyTo: string | undefined;
  if (step === "reminder") {
    const last = await getLatestMessageWith(supabase, lead.id);
    if (!last?.gmail_thread_id) {
      return { ok: false, error: `${lead.email}: no prior thread for reminder` };
    }
    threadId = last.gmail_thread_id;
    inReplyTo = last.gmail_message_id ? `<${last.gmail_message_id}>` : undefined;
  }

  try {
    const sentAt = new Date().toISOString();
    const res = await sender.send({
      to: lead.email,
      subject: rendered.subject,
      body: rendered.body,
      threadId,
      inReplyTo,
    });
    await recordMessageWith(supabase, {
      lead_id: lead.id,
      template_id: tpl.id,
      step,
      gmail_message_id: res.messageId,
      gmail_thread_id: res.threadId,
      status: "sent",
      error: null,
      sent_at: sentAt,
    });
    await updateLeadStatusWith(supabase, lead.id, {
      status: step === "initial" ? "contacted" : "reminded",
      last_sent_at: sentAt,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await recordMessageWith(supabase, {
      lead_id: lead.id,
      template_id: tpl.id,
      step,
      gmail_message_id: null,
      gmail_thread_id: null,
      status: "failed",
      error: message,
      sent_at: null,
    });
    return { ok: false, error: `${lead.email}: ${message}` };
  }
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
