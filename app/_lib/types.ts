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
  life: string;
  cond: string;
  stock: StockState;
  qty: number | null;
  lead: string;
  hosts: string[];
  views: number;
  alternativePns: string[];
  categoryL1: string | null;
  categoryL2: string | null;
  series: string | null;
  equipmentType: string | null;
  compatibleControllers: string[];
  compatibleRobotModels: string[];
  controllerGeneration: string | null;
  availabilityLabel: string | null;
  descriptionKr: string | null;
  failureKeywords: string[];
  imageUrl: string | null;
  imageStoragePath: string | null;
  imageStatus: "missing" | "pending_review" | "approved" | "rejected";
}

// Row shape returned by Supabase for the `parts` table.
export interface PartRow {
  id: string;
  cat: string;
  brand: string;
  pn: string;
  name: string;
  life: string;
  cond: string;
  stock: StockState;
  qty: number | null;
  lead: string;
  hosts: string[];
  views: number;
  is_active: boolean;
  alternative_pns: string[] | null;
  category_l1: string | null;
  category_l2: string | null;
  series: string | null;
  equipment_type: string | null;
  compatible_controllers: string[] | null;
  compatible_robot_models: string[] | null;
  controller_generation: string | null;
  availability_label: string | null;
  description_kr: string | null;
  failure_keywords: string[] | null;
  image_url: string | null;
  image_storage_path: string | null;
  image_status: "missing" | "pending_review" | "approved" | "rejected";
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
  demandScore: number | null;
  scarcityScore: number | null;
  salesPriorityGrade: string | null;
  salesPriorityScore: number | null;
  sourceUrls: string[];
  adminNotes: string | null;
}

// Editable fields for the product CRUD form.
export interface AdminPartInput {
  cat: string;
  brand: string;
  pn: string;
  name: string;
  life: string;
  cond: string;
  stock: StockState;
  qty: number | null;
  lead: string;
  hosts: string[];
  is_active: boolean;
  alternative_pns: string[];
  category_l1: string | null;
  category_l2: string | null;
  series: string | null;
  equipment_type: string | null;
  compatible_controllers: string[];
  compatible_robot_models: string[];
  controller_generation: string | null;
  availability_label: string | null;
  description_kr: string | null;
  failure_keywords: string[];
  image_url: string | null;
  image_storage_path: string | null;
  image_status: "missing" | "pending_review" | "approved" | "rejected";
  demand_score: number | null;
  scarcity_score: number | null;
  sales_priority_grade: string | null;
  sales_priority_score: number | null;
  source_urls: string[];
  admin_notes: string | null;
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

export interface SourcingQuote {
  id: string;
  inquiry_id: string;
  platform: "1688" | "alibaba" | "taobao" | "xianyu" | "wechat" | "other";
  supplier_name: string;
  listing_url: string;
  contact_handle: string | null;
  condition: string | null;
  moq: number | null;
  lead_time_days: number | null;
  notes: string | null;
  selected: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminPartRow extends PartRow {
  demand_score: number | null;
  scarcity_score: number | null;
  sales_priority_grade: string | null;
  sales_priority_score: number | null;
  source_urls: string[] | null;
  admin_notes: string | null;
}

export function rowToAdminPart(row: AdminPartRow): AdminPart {
  return {
    ...rowToPart(row),
    isActive: row.is_active,
    demandScore: row.demand_score,
    scarcityScore: row.scarcity_score,
    salesPriorityGrade: row.sales_priority_grade,
    salesPriorityScore: row.sales_priority_score,
    sourceUrls: row.source_urls ?? [],
    adminNotes: row.admin_notes,
  };
}

export function rowToPart(row: PartRow): Part {
  return {
    id: row.id,
    cat: row.cat,
    brand: row.brand,
    pn: row.pn,
    name: row.name,
    life: row.life,
    cond: row.cond,
    stock: row.stock,
    qty: row.qty,
    lead: row.lead,
    hosts: row.hosts ?? [],
    views: row.views,
    alternativePns: row.alternative_pns ?? [],
    categoryL1: row.category_l1,
    categoryL2: row.category_l2,
    series: row.series,
    equipmentType: row.equipment_type,
    compatibleControllers: row.compatible_controllers ?? [],
    compatibleRobotModels: row.compatible_robot_models ?? [],
    controllerGeneration: row.controller_generation,
    availabilityLabel: row.availability_label,
    descriptionKr: row.description_kr,
    failureKeywords: row.failure_keywords ?? [],
    imageUrl: row.image_url,
    imageStoragePath: row.image_storage_path,
    imageStatus: row.image_status ?? "missing",
  };
}
