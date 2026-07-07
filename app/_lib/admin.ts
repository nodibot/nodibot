import { createSupabaseServerClient } from "./supabase-server";
import {
  rowToAdminPart,
  type AdminPart,
  type AdminPartInput,
  type Inquiry,
  type InquiryStatus,
  type SourcingQuote,
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

export async function getInquiryById(id: string): Promise<Inquiry | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Inquiry) ?? null;
}

export async function getPartForInquiry(inquiry: Inquiry): Promise<AdminPart | null> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("parts").select(ADMIN_COLUMNS);

  if (inquiry.part_id) query = query.eq("id", inquiry.part_id);
  else if (inquiry.part_pn) query = query.eq("pn", inquiry.part_pn);
  else return null;

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToAdminPart(data) : null;
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- sourcing quotes ----

export async function getSourcingQuotes(inquiryId: string): Promise<SourcingQuote[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("sourcing_quotes")
    .select("*")
    .eq("inquiry_id", inquiryId)
    .order("selected", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SourcingQuote[];
}

export async function createSourcingQuote(input: {
  inquiry_id: string;
  platform: SourcingQuote["platform"];
  supplier_name: string;
  listing_url: string;
  contact_handle: string | null;
  condition: string | null;
  moq: number | null;
  lead_time_days: number | null;
  notes: string | null;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("sourcing_quotes").insert(input);
  if (error) throw new Error(error.message);
}

export async function selectSourcingQuote(quoteId: string): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data: quote, error: quoteError } = await supabase
    .from("sourcing_quotes")
    .select("inquiry_id")
    .eq("id", quoteId)
    .single();
  if (quoteError) throw new Error(quoteError.message);

  const inquiryId = quote.inquiry_id as string;
  const { error: clearError } = await supabase
    .from("sourcing_quotes")
    .update({ selected: false, updated_at: new Date().toISOString() })
    .eq("inquiry_id", inquiryId);
  if (clearError) throw new Error(clearError.message);

  const { error: selectError } = await supabase
    .from("sourcing_quotes")
    .update({ selected: true, updated_at: new Date().toISOString() })
    .eq("id", quoteId);
  if (selectError) throw new Error(selectError.message);

  await updateInquiryStatus(inquiryId, "found");
  return inquiryId;
}

// ---- website analytics ----

export interface AnalyticsOverview {
  sinceIso: string;
  days: 7 | 30 | 90;
  appliedEventFilter: AnalyticsEventFilter;
  totalEvents: number;
  productClicks: number;
  whatsappClicks: number;
  rfqSubmittedEvents: number;
  catalogSearches: number;
  inquiriesCreated: number;
  rfqPerClickRate: number;
  uniqueVisitors: number;
  emailClicks: number;
  scrollDepthEvents: number;
  eventsTruncated: boolean;
  topPartsByClick: Array<{ partPn: string; clicks: number }>;
  topConvertingParts: Array<{ partPn: string; clicks: number; rfqs: number; conversionRate: number }>;
  topQueries: Array<{ query: string; searches: number }>;
  topNoResultQueries: Array<{ query: string; searches: number }>;
  topCountries: Array<{ countryCode: string; count: number }>;
  topPages: Array<{ pagePath: string; count: number }>;
  topSurfaces: Array<{ surface: string; count: number }>;
  scrollDepthBreakdown: Array<{ depth: number; count: number }>;
  eventBreakdown: Array<{ eventName: string; count: number }>;
  dailySeries: Array<{ day: string; total: number; clicks: number; searches: number; rfqs: number; whatsapp: number }>;
  recentEvents: Array<{
    eventName: string;
    createdAt: string;
    partPn: string | null;
    query: string | null;
    pagePath: string | null;
    channel: string | null;
    countryCode: string | null;
    region: string | null;
    city: string | null;
    metadataSummary: string | null;
  }>;
}

export type AnalyticsEventFilter = "all" | "clicks" | "searches" | "rfqs";

interface AnalyticsOptions {
  days?: 7 | 30 | 90;
  eventFilter?: AnalyticsEventFilter;
}

function decodeMaybe(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function asMetadata(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function summarizeEventMetadata(meta: Record<string, unknown> | null): string | null {
  if (!meta || Object.keys(meta).length === 0) return null;

  const bits: string[] = [];
  if (typeof meta.surface === "string") bits.push(`surface: ${meta.surface}`);
  if (typeof meta.depth === "number") bits.push(`depth: ${meta.depth}%`);
  if (typeof meta.page === "number") bits.push(`catalog page: ${meta.page}`);
  if (typeof meta.results === "number") bits.push(`results: ${meta.results}`);
  if (typeof meta.sort === "string") bits.push(`sort: ${meta.sort}`);
  if (Array.isArray(meta.cats) && meta.cats.length) bits.push(`cats: ${meta.cats.join(",")}`);
  if (Array.isArray(meta.hosts) && meta.hosts.length) bits.push(`hosts: ${meta.hosts.join(",")}`);
  if (Array.isArray(meta.stock) && meta.stock.length) bits.push(`stock: ${meta.stock.join(",")}`);
  if (typeof meta.line_count === "number") bits.push(`lines: ${meta.line_count}`);
  if (typeof meta.source === "string") bits.push(`source: ${meta.source}`);

  if (bits.length > 0) return bits.join(" · ");

  try {
    const compact = JSON.stringify(meta);
    return compact.length > 140 ? `${compact.slice(0, 137)}…` : compact;
  } catch {
    return null;
  }
}

const ANALYTICS_ROW_LIMIT = 10_000;

function filterRowsByEvent<T extends { event_name: string }>(
  rows: T[],
  eventFilter: AnalyticsEventFilter,
): T[] {
  if (eventFilter === "all") return rows;
  if (eventFilter === "clicks") {
    return rows.filter(
      (r) =>
        r.event_name === "catalog_item_click" ||
        r.event_name === "whatsapp_click" ||
        r.event_name === "email_click",
    );
  }
  if (eventFilter === "searches") {
    return rows.filter((r) => r.event_name === "catalog_search" || r.event_name === "catalog_no_results");
  }
  return rows.filter((r) => r.event_name === "rfq_submitted" || r.event_name === "bulk_rfq_submitted");
}

export async function getAnalyticsOverview(options: AnalyticsOptions = {}): Promise<AnalyticsOverview> {
  const days = options.days ?? 30;
  const eventFilter = options.eventFilter ?? "all";
  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: events, error: eventsError }, { count: inquiriesCount, error: inquiriesError }] = await Promise.all([
    supabase
      .from("website_events")
      .select(
        "event_name, part_pn, query, page_path, channel, country_code, region, city, ip_hash, metadata, created_at",
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(ANALYTICS_ROW_LIMIT),
    supabase
      .from("inquiries")
      .select("id", { head: true, count: "exact" })
      .gte("created_at", since),
  ]);

  // During rollout, analytics routes may deploy before the DB migration is applied.
  // If website_events does not exist yet, return an empty analytics payload instead
  // of crashing the admin page.
  if (eventsError) {
    if (
      eventsError.message.includes("public.website_events") ||
      eventsError.message.includes("website_events")
    ) {
      return {
        sinceIso: since,
        days,
        appliedEventFilter: eventFilter,
        totalEvents: 0,
        productClicks: 0,
        whatsappClicks: 0,
        rfqSubmittedEvents: 0,
        catalogSearches: 0,
        inquiriesCreated: inquiriesCount ?? 0,
        rfqPerClickRate: 0,
        uniqueVisitors: 0,
        emailClicks: 0,
        scrollDepthEvents: 0,
        eventsTruncated: false,
        topPartsByClick: [],
        topConvertingParts: [],
        topQueries: [],
        topNoResultQueries: [],
        topCountries: [],
        topPages: [],
        topSurfaces: [],
        scrollDepthBreakdown: [],
        eventBreakdown: [],
        dailySeries: [],
        recentEvents: [],
      };
    }
    throw new Error(eventsError.message);
  }
  if (inquiriesError) throw new Error(inquiriesError.message);

  const allRows = events ?? [];
  const rows = filterRowsByEvent(allRows, eventFilter);
  const filteredPartClicks = new Map<string, number>();
  const allPartClicks = new Map<string, number>();
  const partRfqs = new Map<string, number>();
  const queryCounts = new Map<string, number>();
  const noResultQueryCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  const pageCounts = new Map<string, number>();
  const surfaceCounts = new Map<string, number>();
  const scrollDepthCounts = new Map<number, number>();
  const eventCounts = new Map<string, number>();
  const perDay = new Map<string, { total: number; clicks: number; searches: number; rfqs: number; whatsapp: number }>();

  for (const row of rows) {
    eventCounts.set(row.event_name, (eventCounts.get(row.event_name) ?? 0) + 1);

    const day = row.created_at.slice(0, 10);
    const bucket = perDay.get(day) ?? { total: 0, clicks: 0, searches: 0, rfqs: 0, whatsapp: 0 };
    bucket.total += 1;
    if (row.event_name === "catalog_item_click") bucket.clicks += 1;
    if (row.event_name === "catalog_search" || row.event_name === "catalog_no_results") bucket.searches += 1;
    if (row.event_name === "rfq_submitted" || row.event_name === "bulk_rfq_submitted") bucket.rfqs += 1;
    if (row.event_name === "whatsapp_click") bucket.whatsapp += 1;
    perDay.set(day, bucket);

    if (row.event_name === "catalog_item_click" && row.part_pn) {
      filteredPartClicks.set(row.part_pn, (filteredPartClicks.get(row.part_pn) ?? 0) + 1);
    }
    if (row.event_name === "catalog_search" && row.query) {
      const key = row.query.trim().toLowerCase();
      if (key) queryCounts.set(key, (queryCounts.get(key) ?? 0) + 1);
    }
    if (row.event_name === "catalog_no_results" && row.query) {
      const key = row.query.trim().toLowerCase();
      if (key) noResultQueryCounts.set(key, (noResultQueryCounts.get(key) ?? 0) + 1);
    }
    if (row.country_code) {
      const cc = row.country_code.toUpperCase();
      countryCounts.set(cc, (countryCounts.get(cc) ?? 0) + 1);
    }
    if (row.page_path) {
      pageCounts.set(row.page_path, (pageCounts.get(row.page_path) ?? 0) + 1);
    }

    const meta = asMetadata(row.metadata);
    if (meta && typeof meta.surface === "string") {
      surfaceCounts.set(meta.surface, (surfaceCounts.get(meta.surface) ?? 0) + 1);
    }
    if (row.event_name === "catalog_scroll_depth" && meta && typeof meta.depth === "number") {
      scrollDepthCounts.set(meta.depth, (scrollDepthCounts.get(meta.depth) ?? 0) + 1);
    }
  }

  for (const row of allRows) {
    if (row.event_name === "catalog_item_click" && row.part_pn) {
      allPartClicks.set(row.part_pn, (allPartClicks.get(row.part_pn) ?? 0) + 1);
    }
    if ((row.event_name === "rfq_submitted" || row.event_name === "bulk_rfq_submitted") && row.part_pn) {
      partRfqs.set(row.part_pn, (partRfqs.get(row.part_pn) ?? 0) + 1);
    }
  }

  const topPartsByClick = [...filteredPartClicks.entries()]
    .map(([partPn, clicks]) => ({ partPn, clicks }))
    .sort((a, b) => b.clicks - a.clicks);

  const topQueries = [...queryCounts.entries()]
    .map(([query, searches]) => ({ query, searches }))
    .sort((a, b) => b.searches - a.searches);

  const topNoResultQueries = [...noResultQueryCounts.entries()]
    .map(([query, searches]) => ({ query, searches }))
    .sort((a, b) => b.searches - a.searches);

  const topCountries = [...countryCounts.entries()]
    .map(([countryCode, count]) => ({ countryCode, count }))
    .sort((a, b) => b.count - a.count);

  const topPages = [...pageCounts.entries()]
    .map(([pagePath, count]) => ({ pagePath, count }))
    .sort((a, b) => b.count - a.count);

  const topSurfaces = [...surfaceCounts.entries()]
    .map(([surface, count]) => ({ surface, count }))
    .sort((a, b) => b.count - a.count);

  const scrollDepthBreakdown = [...scrollDepthCounts.entries()]
    .map(([depth, count]) => ({ depth, count }))
    .sort((a, b) => a.depth - b.depth);

  const topConvertingParts = [...allPartClicks.entries()]
    .map(([partPn, clicks]) => {
      const rfqs = partRfqs.get(partPn) ?? 0;
      return { partPn, clicks, rfqs, conversionRate: clicks > 0 ? rfqs / clicks : 0 };
    })
    .filter((row) => row.clicks >= 2)
    .sort((a, b) =>
      b.conversionRate - a.conversionRate ||
      b.rfqs - a.rfqs ||
      b.clicks - a.clicks,
    );

  const eventBreakdown = [...eventCounts.entries()]
    .map(([eventName, count]) => ({ eventName, count }))
    .sort((a, b) => b.count - a.count);

  const dailySeries = [...perDay.entries()]
    .map(([day, v]) => ({ day, ...v }))
    .sort((a, b) => (a.day < b.day ? -1 : 1))
    .slice(-14);

  const recentEvents = rows.slice(0, 200).map((row) => ({
    eventName: row.event_name,
    createdAt: row.created_at,
    partPn: row.part_pn,
    query: row.query,
    pagePath: row.page_path,
    channel: row.channel,
    countryCode: decodeMaybe(row.country_code),
    region: decodeMaybe(row.region),
    city: decodeMaybe(row.city),
    metadataSummary: summarizeEventMetadata(asMetadata(row.metadata)),
  }));

  const productClicks = allRows.filter((r) => r.event_name === "catalog_item_click").length;
  const rfqSubmittedEvents = allRows.filter(
    (r) => r.event_name === "rfq_submitted" || r.event_name === "bulk_rfq_submitted",
  ).length;
  const uniqueVisitors = new Set(allRows.map((r) => r.ip_hash).filter(Boolean)).size;

  return {
    sinceIso: since,
    days,
    appliedEventFilter: eventFilter,
    totalEvents: rows.length,
    productClicks: rows.filter((r) => r.event_name === "catalog_item_click").length,
    whatsappClicks: rows.filter((r) => r.event_name === "whatsapp_click").length,
    emailClicks: rows.filter((r) => r.event_name === "email_click").length,
    scrollDepthEvents: rows.filter((r) => r.event_name === "catalog_scroll_depth").length,
    rfqSubmittedEvents: rows.filter((r) => r.event_name === "rfq_submitted" || r.event_name === "bulk_rfq_submitted")
      .length,
    catalogSearches: rows.filter((r) => r.event_name === "catalog_search" || r.event_name === "catalog_no_results")
      .length,
    inquiriesCreated: inquiriesCount ?? 0,
    rfqPerClickRate: productClicks > 0 ? rfqSubmittedEvents / productClicks : 0,
    uniqueVisitors,
    eventsTruncated: allRows.length >= ANALYTICS_ROW_LIMIT,
    topPartsByClick,
    topConvertingParts,
    topQueries,
    topNoResultQueries,
    topCountries,
    topPages,
    topSurfaces,
    scrollDepthBreakdown,
    eventBreakdown,
    dailySeries,
    recentEvents,
  };
}
