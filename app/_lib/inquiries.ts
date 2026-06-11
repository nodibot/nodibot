import { getSupabase } from "./supabase";
import type { Channel, InquiryInput, Urgency } from "./types";

const CHANNELS: Channel[] = ["WhatsApp", "Email", "Phone"];
const URGENCIES: Urgency[] = ["down", "spare"];

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

// Server-side validation of an RFQ submission.
export function validateInquiry(input: Partial<InquiryInput>): ValidationResult {
  const errors: string[] = [];
  if (!input.name || !input.name.trim()) errors.push("name");
  if (!input.contact || !input.contact.trim()) errors.push("contact");
  if (input.channel && !CHANNELS.includes(input.channel)) errors.push("channel");
  if (input.urgency && !URGENCIES.includes(input.urgency)) errors.push("urgency");
  return { ok: errors.length === 0, errors };
}

// Human-friendly reference, e.g. RFQ-AB12-3456.
export function generateTicket(): string {
  const a = Math.random().toString(36).slice(2, 6).toUpperCase();
  const n = Math.floor(1000 + Math.random() * 9000);
  return `RFQ-${a}-${n}`;
}

// Persists a validated inquiry and returns its ticket reference.
export async function createInquiry(input: InquiryInput): Promise<{ ticket: string }> {
  const ticket = generateTicket();
  const supabase = getSupabase();
  const { error } = await supabase.from("inquiries").insert({
    part_id: input.partId ?? null,
    part_pn: input.partPn ?? null,
    name: input.name.trim(),
    company: input.company?.trim() || null,
    contact: input.contact.trim(),
    channel: input.channel,
    urgency: input.urgency,
    qty: input.qty ?? null,
    cond: input.cond ?? null,
    notes: input.notes?.trim() || null,
    status: "new",
    ticket,
  });

  if (error) throw new Error(`Failed to create inquiry: ${error.message}`);
  return { ticket };
}
