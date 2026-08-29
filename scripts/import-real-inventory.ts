/**
 * Publishes the real ABB inventory (supabase/real-inventory.ts) and hides the
 * previous crawled/dummy rows — so the public catalog shows only what nodibot
 * actually stocks.
 *
 *   npx tsx scripts/import-real-inventory.ts --dry-run   # plan only, no writes
 *   npx tsx scripts/import-real-inventory.ts             # apply
 *
 * Order of operations (safe + reversible):
 *   1. UPSERT the real items as is_active = true.
 *        - overlap (row already exists by pn): keep its metadata/photo, only set
 *          is_active, qty, stock, and merge the DSQC alternate part number.
 *        - new: insert a full baseline row.
 *   2. HIDE every other currently-active row (is_active = false). Nothing is
 *      deleted, so this is fully reversible.
 *
 * Requires the service/secret key. Reads NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) from .env.local.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { REAL_ITEMS, type RealItem } from "../supabase/real-inventory";

const DRY_RUN = process.argv.includes("--dry-run");

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim(); if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("="); if (eq === -1) continue;
      const k = t.slice(0, eq).trim(); let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!(k in process.env)) process.env[k] = v;
    }
  } catch { /* rely on ambient env */ }
}

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

function stableId(brand: string, pn: string): string {
  return `${brand}-${pn}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Full baseline row for a brand-new item.
function newRow(item: RealItem) {
  return {
    id: stableId(item.brand, item.pn),
    cat: item.cat,
    brand: item.brand,
    pn: item.pn,
    name: item.name,
    life: "Unknown",
    cond: "tested",
    stock: "in" as const,
    qty: item.qty,
    lead: "Ships from stock",
    hosts: ["abb"],
    views: 0,
    is_active: true,
    alternative_pns: item.alternative_pns,
    series: item.series,
    equipment_type: item.equipment_type,
    availability_label: "In stock (used)",
    image_status: "missing",
  };
}

async function main() {
  loadEnvLocal();
  const sb = getSupabase();

  const realPnNorm = new Set(REAL_ITEMS.map((i) => norm(i.pn)));

  // Snapshot current state.
  const { data: allRows, error: readErr } = await sb
    .from("parts")
    .select("id, pn, name, is_active, qty, alternative_pns");
  if (readErr) throw new Error(readErr.message);
  const byPnNorm = new Map((allRows ?? []).map((r) => [norm(r.pn), r]));

  const toInsert: RealItem[] = [];
  const toActivate: { item: RealItem; row: (typeof allRows)[number] }[] = [];
  for (const item of REAL_ITEMS) {
    const row = byPnNorm.get(norm(item.pn));
    if (row) toActivate.push({ item, row });
    else toInsert.push(item);
  }

  const activeRows = (allRows ?? []).filter((r) => r.is_active);
  const toHide = activeRows.filter((r) => !realPnNorm.has(norm(r.pn)));

  // ---- Report the plan ----
  console.log(`\n=== Real inventory import ${DRY_RUN ? "(DRY RUN)" : ""} ===`);
  console.log(`Real items:            ${REAL_ITEMS.length}  (${REAL_ITEMS.filter((i) => i.cat === "robots").length} robots, ${REAL_ITEMS.filter((i) => i.cat !== "robots").length} parts)`);
  console.log(`  → insert new:        ${toInsert.length}`);
  console.log(`  → activate existing: ${toActivate.length}`);
  console.log(`Currently active rows: ${activeRows.length}`);
  console.log(`  → hide (dummy):      ${toHide.length}`);
  console.log(`Projected active after: ${toActivate.length + toInsert.length}`);
  console.log("");

  if (DRY_RUN) {
    console.log("-- would INSERT (new, active) --");
    for (const i of toInsert) console.log(`  + ${i.cat.padEnd(11)} ${i.pn.padEnd(20)} q${i.qty}  ${i.name}`);
    console.log("\n-- would ACTIVATE + set qty (keep existing metadata/photo) --");
    for (const { item, row } of toActivate) console.log(`  ~ ${item.pn.padEnd(20)} q${item.qty}  (row ${row.id})  ${row.name}`);
    console.log(`\n-- would HIDE ${toHide.length} dummy rows (is_active=false) --`);
    for (const r of toHide.slice(0, 12)) console.log(`  - ${r.pn.padEnd(22)} ${r.name}`);
    if (toHide.length > 12) console.log(`  … and ${toHide.length - 12} more`);
    console.log("\n(DRY RUN — no changes written.)");
    return;
  }

  // ---- 1. Insert new real items (active) ----
  let inserted = 0;
  for (const item of toInsert) {
    const { error } = await sb.from("parts").insert(newRow(item));
    if (error) throw new Error(`Insert ${item.pn} failed: ${error.message}`);
    inserted++;
  }
  console.log(`Inserted ${inserted} new real items.`);

  // ---- 2. Activate overlaps (preserve metadata; set qty, stock, merge alt pns) ----
  let activated = 0;
  for (const { item, row } of toActivate) {
    const mergedAlts = Array.from(new Set([...(row.alternative_pns ?? []), ...item.alternative_pns]));
    const { error } = await sb
      .from("parts")
      .update({ is_active: true, qty: item.qty, stock: "in", alternative_pns: mergedAlts })
      .eq("id", row.id);
    if (error) throw new Error(`Activate ${item.pn} failed: ${error.message}`);
    activated++;
  }
  console.log(`Activated ${activated} existing rows as real stock.`);

  // ---- 3. Hide dummy rows ----
  let hidden = 0;
  for (const r of toHide) {
    const { error } = await sb.from("parts").update({ is_active: false }).eq("id", r.id);
    if (error) throw new Error(`Hide ${r.pn} failed: ${error.message}`);
    hidden++;
  }
  console.log(`Hid ${hidden} dummy rows (is_active=false, reversible).`);

  const { count } = await sb.from("parts").select("id", { count: "exact", head: true }).eq("is_active", true);
  console.log(`\nDone. Active parts now: ${count}. Next: attach photos with the image pipeline.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
