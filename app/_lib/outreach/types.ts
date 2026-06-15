// Shared types for the cold email outreach feature.

export type OutreachStatus =
  | "pending"
  | "contacted"
  | "reminded"
  | "replied"
  | "bounced"
  | "unsubscribed"
  | "completed";

export type OutreachStep = "initial" | "reminder";
export type TemplateKind = "initial" | "reminder";

export interface OutreachLead {
  id: string;
  company: string;
  contact_name: string | null;
  email: string;
  part_number: string | null;
  note: string | null;
  source: "csv" | "manual";
  status: OutreachStatus;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  kind: TemplateKind;
  subject: string;
  body: string;
  active: boolean;
  created_at: string;
}

export interface OutreachSettings {
  id: number;
  daily_cap: number;
  warmup_start_date: string | null;
  reminder_delay_days: number;
  paused: boolean;
}

// Minimal lead shape the pure engine reasons about.
export interface LeadState {
  id: string;
  status: OutreachStatus;
  last_sent_at: string | null;
  created_at: string;
}

export type OutreachAction =
  | { type: "send_initial"; leadId: string }
  | { type: "send_reminder"; leadId: string };
