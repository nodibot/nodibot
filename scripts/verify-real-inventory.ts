/**
 * Read-only verification of the real-inventory migration.
 *   npx tsx scripts/verify-real-inventory.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { REAL_ITEMS } from "../supabase/real-inventory";

function loadEnvLocal() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim(); if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("="); if (eq === -1) continue;
    const k = t.slice(0, eq).trim(); let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}
const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

async function main() {
  loadEnvLocal();
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });

  const { data: active } = await sb.from("parts").select("id, pn, name, cat, is_active, image_status, image_url").eq("is_active", true);
  const rows = active ?? [];
  const byCat: Record<string, number> = {};
  for (const r of rows) byCat[r.cat] = (byCat[r.cat] ?? 0) + 1;

  console.log("=== ACTIVE catalog after migration ===");
  console.log("active parts:", rows.length, "(expected 65)");
  console.log("by category:", byCat);
  const withImg = rows.filter((r) => r.image_status === "approved" && r.image_url).length;
  console.log("active with approved image:", withImg, "/", rows.length);

  // Every real item present & active?
  const activeNorm = new Set(rows.map((r) => norm(r.pn)));
  const missing = REAL_ITEMS.filter((i) => !activeNorm.has(norm(i.pn)));
  console.log("real items missing from active:", missing.length, missing.map((m) => m.pn).join(", ") || "(none)");

  // Active items WITHOUT image
  const noImg = rows.filter((r) => !(r.image_status === "approved" && r.image_url));
  console.log("\nactive items without an approved image:", noImg.length);
  for (const r of noImg) console.log(`  - ${r.cat.padEnd(11)} ${r.pn.padEnd(20)} ${r.name}`);

  // Sample robots
  console.log("\n-- sample robots (image linked?) --");
  for (const r of rows.filter((r) => r.cat === "robots").slice(0, 6)) {
    console.log(`  ${r.pn.padEnd(20)} img:${r.image_status.padEnd(9)} ${r.image_url ? "URL✓" : "no-url"}  ${r.name}`);
  }

  // Total rows & storage
  const { count: total } = await sb.from("parts").select("id", { count: "exact", head: true });
  const { count: hidden } = await sb.from("parts").select("id", { count: "exact", head: true }).eq("is_active", false);
  console.log(`\ntotal rows: ${total} | hidden (dummy, reversible): ${hidden} | active: ${rows.length}`);
  const { data: objs } = await sb.storage.from("product-images").list("", { limit: 1000 });
  console.log("product-images storage objects:", objs?.length ?? 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
