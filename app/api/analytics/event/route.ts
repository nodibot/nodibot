import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getSupabase } from "@/app/_lib/supabase";

type EventName =
  | "catalog_item_click"
  | "catalog_search"
  | "catalog_filter_change"
  | "catalog_sort_change"
  | "rfq_submitted"
  | "whatsapp_click";

interface EventBody {
  event_name?: EventName;
  page_path?: string | null;
  part_pn?: string | null;
  query?: string | null;
  channel?: string | null;
  metadata?: Record<string, unknown>;
}

const ALLOWED: EventName[] = [
  "catalog_item_click",
  "catalog_search",
  "catalog_filter_change",
  "catalog_sort_change",
  "rfq_submitted",
  "whatsapp_click",
];

function firstForwardedIp(value: string | null): string | null {
  if (!value) return null;
  const ip = value.split(",")[0]?.trim();
  return ip || null;
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.ANALYTICS_IP_HASH_SALT ?? "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function POST(request: Request) {
  let body: EventBody;
  try {
    body = (await request.json()) as EventBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.event_name || !ALLOWED.includes(body.event_name)) {
    return NextResponse.json({ error: "Invalid event_name" }, { status: 400 });
  }

  try {
    const countryCode =
      request.headers.get("x-vercel-ip-country") ??
      request.headers.get("cf-ipcountry") ??
      null;
    const region = request.headers.get("x-vercel-ip-country-region");
    const city = request.headers.get("x-vercel-ip-city");
    const ipHash = hashIp(
      firstForwardedIp(
        request.headers.get("x-forwarded-for") ??
          request.headers.get("x-real-ip"),
      ),
    );

    const supabase = getSupabase();
    const { error } = await supabase.from("website_events").insert({
      event_name: body.event_name,
      page_path: body.page_path?.trim() || null,
      part_pn: body.part_pn?.trim() || null,
      query: body.query?.trim() || null,
      channel: body.channel?.trim() || null,
      country_code: countryCode,
      region: region || null,
      city: city || null,
      ip_hash: ipHash,
      metadata: body.metadata ?? {},
    });
    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("analytics event insert failed:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
