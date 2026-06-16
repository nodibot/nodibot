import { NextResponse } from "next/server";
import { getSupabaseService } from "@/app/_lib/supabase-service";
import { createGmailSender, threadHasReply, type EmailSender } from "@/app/_lib/gmail";
import { planActions, planRetirements } from "@/app/_lib/outreach/engine";
import { sendOutreachToLead, sleep } from "@/app/_lib/outreach/send";
import {
  getSettingsWith,
  getActiveLeadsWith,
  countSentTodayWith,
  getLatestMessageWith,
  updateLeadStatusWith,
} from "@/app/_lib/outreach/queries";
import type { LeadState } from "@/app/_lib/outreach/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
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
        lead.status = "replied";
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

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const lead = leads.find((l) => l.id === action.leadId)!;
    const result = await sendOutreachToLead(supabase, sender, lead);
    if (result.ok) {
      lead.status = action.type === "send_initial" ? "contacted" : "reminded";
      summary.sent++;
    } else {
      console.error(`send failed for ${lead.id}:`, result.error);
      summary.errors++;
    }

    if (i < actions.length - 1) await sleep(2000 + Math.floor(Math.random() * 4000));
  }

  return NextResponse.json({ ok: true, ...summary });
}
