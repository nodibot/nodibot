import { cache } from "react";
import { getSupabase } from "./supabase";
import { rowToPart, type Part, type PartRow } from "./types";

const PART_COLUMNS =
  "id, cat, brand, pn, name, refurb_low, refurb_high, oem, life, cond, stock, qty, lead, hosts, views, is_active";

// All active parts, highest demand first. Memoized per request.
export const getActiveParts = cache(async (): Promise<Part[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("parts")
    .select(PART_COLUMNS)
    .eq("is_active", true)
    .order("views", { ascending: false });

  if (error) throw new Error(`Failed to load parts: ${error.message}`);
  return (data as PartRow[]).map(rowToPart);
});

// A single active part by its part number, or null if not found. Memoized per request.
export const getPartByPn = cache(async (pn: string): Promise<Part | null> => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("parts")
    .select(PART_COLUMNS)
    .eq("pn", pn)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(`Failed to load part ${pn}: ${error.message}`);
  return data ? rowToPart(data as PartRow) : null;
});

// Atomic, fire-and-forget view-count increment via the SECURITY DEFINER rpc.
export async function incrementView(pn: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("increment_part_view", { p_pn: pn });
  if (error) throw new Error(`Failed to increment view for ${pn}: ${error.message}`);
}
