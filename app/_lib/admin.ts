import { createSupabaseServerClient } from "./supabase-server";
import {
  rowToAdminPart,
  type AdminPart,
  type AdminPartInput,
  type Inquiry,
  type InquiryStatus,
} from "./types";

const ADMIN_COLUMNS =
  "id, cat, brand, pn, name, life, cond, stock, qty, lead, hosts, views, is_active, alternative_pns, category_l1, category_l2, series, equipment_type, compatible_controllers, compatible_robot_models, controller_generation, availability_label, description_kr, failure_keywords, image_url, image_storage_path, image_status, demand_score, scarcity_score, sales_priority_grade, sales_priority_score, source_urls, admin_notes";

// ---- parts ----

export async function getAllParts(): Promise<AdminPart[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("parts")
    .select(ADMIN_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToAdminPart);
}

export async function getPartById(id: string): Promise<AdminPart | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("parts")
    .select(ADMIN_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToAdminPart(data) : null;
}

export async function createPart(input: AdminPartInput): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const id = crypto.randomUUID();
  const { error } = await supabase.from("parts").insert({ id, ...input });
  if (error) throw new Error(error.message);
}

export async function updatePart(id: string, input: AdminPartInput): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("parts").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deletePart(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("parts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- inquiries ----

export async function getInquiries(): Promise<Inquiry[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Inquiry[];
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}
