// Shared domain types for the nodibot public site.

export type StockState = "in" | "request";
export type Channel = "WhatsApp" | "Email" | "Phone";
export type Urgency = "down" | "spare";
export type InquiryStatus = "new" | "sourcing" | "found" | "quoted" | "closed";

// A catalog part as used throughout the UI.
export interface Part {
  id: string;
  cat: string;
  brand: string;
  pn: string;
  name: string;
  /** [low, high] refurbished price range in USD */
  refurb: [number, number];
  /** OEM brand-new list price in USD */
  oem: number;
  life: string;
  cond: string;
  stock: StockState;
  qty: number | null;
  lead: string;
  hosts: string[];
  views: number;
}

// Row shape returned by Supabase for the `parts` table.
export interface PartRow {
  id: string;
  cat: string;
  brand: string;
  pn: string;
  name: string;
  refurb_low: number;
  refurb_high: number;
  oem: number;
  life: string;
  cond: string;
  stock: StockState;
  qty: number | null;
  lead: string;
  hosts: string[];
  views: number;
  is_active: boolean;
}

// Payload accepted by POST /api/inquiries.
export interface InquiryInput {
  partId?: string | null;
  partPn?: string | null;
  name: string;
  company?: string | null;
  contact: string;
  channel: Channel;
  urgency: Urgency;
  qty?: number | null;
  cond?: string | null;
  notes?: string | null;
}

// Admin-facing part: the public Part plus the admin-only columns.
export interface AdminPart extends Part {
  isActive: boolean;
  supplierNotes: string | null;
  resaleRef: number | null;
}

// Editable fields for the product CRUD form.
export interface AdminPartInput {
  cat: string;
  brand: string;
  pn: string;
  name: string;
  refurb_low: number;
  refurb_high: number;
  oem: number;
  life: string;
  cond: string;
  stock: StockState;
  qty: number | null;
  lead: string;
  hosts: string[];
  is_active: boolean;
  supplier_notes: string | null;
  resale_ref: number | null;
}

// A row from the `inquiries` table (admin CRM).
export interface Inquiry {
  id: string;
  part_id: string | null;
  part_pn: string | null;
  name: string;
  company: string | null;
  contact: string;
  channel: Channel;
  urgency: Urgency;
  qty: number | null;
  cond: string | null;
  notes: string | null;
  status: InquiryStatus;
  ticket: string;
  created_at: string;
}

interface AdminPartRow extends PartRow {
  supplier_notes: string | null;
  resale_ref: number | null;
}

export function rowToAdminPart(row: AdminPartRow): AdminPart {
  return {
    ...rowToPart(row),
    isActive: row.is_active,
    supplierNotes: row.supplier_notes,
    resaleRef: row.resale_ref,
  };
}

export function rowToPart(row: PartRow): Part {
  return {
    id: row.id,
    cat: row.cat,
    brand: row.brand,
    pn: row.pn,
    name: row.name,
    refurb: [row.refurb_low, row.refurb_high],
    oem: row.oem,
    life: row.life,
    cond: row.cond,
    stock: row.stock,
    qty: row.qty,
    lead: row.lead,
    hosts: row.hosts ?? [],
    views: row.views,
  };
}
