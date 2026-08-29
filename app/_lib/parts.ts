import { cache } from "react";
import { getSupabase } from "./supabase";
import { rowToPart, type Part, type PartRow } from "./types";

const PART_COLUMNS =
  "id, cat, brand, pn, name, life, cond, stock, qty, lead, hosts, views, is_active, alternative_pns, category_l1, category_l2, series, equipment_type, compatible_controllers, compatible_robot_models, controller_generation, availability_label, description_kr, failure_keywords, image_url, image_storage_path, image_status";

function extraImageUrl(primaryUrl: string, index: number): string {
  return primaryUrl.replace(/(\.[A-Za-z0-9]+)(\?.*)?$/, `_${index}$1$2`);
}

async function inferGallery(part: Part): Promise<Part> {
  const primary = part.imageUrl;
  if (part.imageUrls.length > 0 || !primary || part.imageStatus !== "approved") return part;
  const candidates = [2, 3, 4].map((i) => extraImageUrl(primary, i));
  const extras: string[] = [];
  const results = await Promise.all(
    candidates.map(async (url) => {
      try {
        const res = await fetch(url, { method: "HEAD" });
        return res.ok ? url : null;
      } catch {
        return null;
      }
    }),
  );
  for (const url of results) {
    if (!url) break;
    extras.push(url);
  }
  return extras.length ? { ...part, imageUrls: [primary, ...extras] } : part;
}

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
  if (!data) return null;

  const part = rowToPart(data as PartRow);
  const extra = await supabase.from("parts").select("image_urls").eq("id", part.id).maybeSingle();
  const stored = !extra.error && Array.isArray(extra.data?.image_urls) ? extra.data.image_urls.filter(Boolean) : [];
  if (stored.length > 0) return { ...part, imageUrls: stored };
  return inferGallery(part);
});

// Atomic, fire-and-forget view-count increment via the SECURITY DEFINER rpc.
export async function incrementView(pn: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("increment_part_view", { p_pn: pn });
  if (error) throw new Error(`Failed to increment view for ${pn}: ${error.message}`);
}
