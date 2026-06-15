import { NextResponse } from "next/server";
import { getSupabaseService } from "@/app/_lib/supabase-service";
import { createGmailSender, threadHasReply, type EmailSender } from "@/app/_lib/gmail";
import { renderTemplate } from "@/app/_lib/outreach/templating";
import { planActions, planRetirements } from "@/app/_lib/outreach/engine";
import {
  getSettingsWith,
  getActiveLeadsWith,
  getActiveTemplateWith,
  countSentTodayWith,
  getLatestMessageWith,
  recordMessageWith,
  updateLeadStatusWith,
} from "@/app/_lib/outreach/queries";
import type { LeadState } from "@/app/_lib/outreach/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const FOOTER_ADDRESS = process.env.OUTREACH_MAILING_ADDRESS ?? "";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseService();
  const now = new Date();
  const summary = { replies: 0, bounces: 0, sent: 0, errors: 0, retired: 0 };

  let sender: EmailSender;
  try {
    sender = createGmailSender();
  } catch (err) {
    console.error("Gmail init failed:", err);
    return NextResponse.json({ error: "Gmail init failed" }, { status: 500 });
  }

  const settings = await getSettingsWith(supabase);
  const leads = await getActiveLeadsWith(supabase);

  // 1. Sync replies for contacted/reminded leads that have a thread.
  for (const lead of leads.filter((l) => l.status === "contacted" || l.status === "reminded")) {
    const last = await getLatestMessageWith(supabase, lead.id);
    if (!last?.gmail_thread_id || !last.sent_at) continue;
    try {
      const msgs = await sender.getThreadMessages(last.gmail_thread_id);
      if (threadHasReply(msgs, sender.senderEmail, new Date(last.sent_at).getTime())) {
        await updateLeadStatusWith(supabase, lead.id, { status: "replied", reply_detected_at: now.toISOString() });
        lead.status = "replied"; // reflect locally so planning skips it
        summary.replies++;
      }
    } catch (err) {
      console.error(`reply sync failed for ${lead.id}:`, err);
      summary.errors++;
    }
  }

  // 2. Retire reminded leads past the window with no reply.
  const leadStates: LeadState[] = leads.map((l) => ({ id: l.id, status: l.status, last_sent_at: l.last_sent_at, created_at: l.created_at }));
  for (const id of planRetirements({ now, leads: leadStates, settings })) {
    await updateLeadStatusWith(supabase, id, { status: "completed" });
    summary.retired++;
  }

  // 3. Plan + execute sends within today's budget.
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const sentToday = await countSentTodayWith(supabase, startOfDay.toISOString());
  const actions = planActions({ now, leads: leadStates, settings, sentToday });

  const initialTpl = await getActiveTemplateWith(supabase, "initial");
  const reminderTpl = await getActiveTemplateWith(supabase, "reminder");

  for (const action of actions) {
    const lead = leads.find((l) => l.id === action.leadId)!;
    const tpl = action.type === "send_initial" ? initialTpl : reminderTpl;
    if (!tpl) {
      console.error(`No active ${action.type} template — skipping ${lead.id}`);
      summary.errors++;
      continue;
    }
    const footer = `${lead.company}\n${FOOTER_ADDRESS}\nReply STOP to unsubscribe.`;
    const rendered = renderTemplate(
      { subject: tpl.subject, body: tpl.body },
      { company: lead.company, contact_name: lead.contact_name, part_number: lead.part_number },
      footer,
    );

    let threadId: string | undefined;
    let inReplyTo: string | undefined;
    if (action.type === "send_reminder") {
      const last = await getLatestMessageWith(supabase, lead.id);
      threadId = last?.gmail_thread_id ?? undefined;
      inReplyTo = last?.gmail_message_id ? `<${last.gmail_message_id}>` : undefined;
    }

    try {
      const sentAt = new Date().toISOString();
      const res = await sender.send({ to: lead.email, subject: rendered.subject, body: rendered.body, threadId, inReplyTo });
      await recordMessageWith(supabase, {
        lead_id: lead.id,
        template_id: tpl.id,
        step: action.type === "send_initial" ? "initial" : "reminder",
        gmail_message_id: res.messageId,
        gmail_thread_id: res.threadId,
        status: "sent",
        error: null,
        sent_at: sentAt,
      });
      await updateLeadStatusWith(supabase, lead.id, {
        status: action.type === "send_initial" ? "contacted" : "reminded",
        last_sent_at: sentAt,
      });
      summary.sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`send failed for ${lead.id}:`, message);
      await recordMessageWith(supabase, {
        lead_id: lead.id,
        template_id: tpl.id,
        step: action.type === "send_initial" ? "initial" : "reminder",
        gmail_message_id: null,
        gmail_thread_id: null,
        status: "failed",
        error: message,
        sent_at: null,
      });
      summary.errors++;
    }

    // Jitter between sends so traffic doesn't look machine-fired.
    await sleep(2000 + Math.floor(Math.random() * 4000));
  }

  return NextResponse.json({ ok: true, ...summary });
}
