/**
 * DRY RUN — matches the image files in ./final against parts in the DB.
 *
 * Writes NOTHING: no bucket, no uploads, no DB changes. It only reports how
 * many of the image filenames map to an existing part row, so we can confirm
 * the matching logic before building the real upload+link script.
 *
 *   npx tsx scripts/match-product-images.ts
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY from .env.local.
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve, extname } from "node:path";
import { createClient } from "@supabase/supabase-js";

const IMAGE_DIR = "final";
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    // No .env.local; rely on process env.
  }
}

// Part number is the filename prefix before the first underscore.
function pnFromFilename(file: string): string {
  const stem = file.slice(0, file.length - extname(file).length);
  const underscore = stem.indexOf("_");
  return (underscore === -1 ? stem : stem.slice(0, underscore)).trim();
}

// Loose key for tolerant matching: uppercase, drop everything but A-Z0-9.
function norm(pn: string): string {
  return pn.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const secret =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !secret) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }
  const supabase = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Read image files.
  const files = readdirSync(resolve(process.cwd(), IMAGE_DIR)).filter((f) =>
    IMAGE_EXTS.has(extname(f).toLowerCase()),
  );

  // 2. Load every part's pn / alternative_pns / current image_status.
  const { data: parts, error } = await supabase
    .from("parts")
    .select("id, pn, alternative_pns, image_status");
  if (error) throw error;

  // 3. Build lookup tables (exact pn, plus normalized pn and alt pns).
  const byPn = new Map<string, { id: string; pn: string }>();
  const byNorm = new Map<string, { id: string; pn: string }>();
  for (const p of parts ?? []) {
    byPn.set(p.pn, { id: p.id, pn: p.pn });
    byNorm.set(norm(p.pn), { id: p.id, pn: p.pn });
    for (const alt of (p.alternative_pns as string[] | null) ?? []) {
      if (!byPn.has(alt)) byPn.set(alt, { id: p.id, pn: p.pn });
      const n = norm(alt);
      if (!byNorm.has(n)) byNorm.set(n, { id: p.id, pn: p.pn });
    }
  }

  // 4. Match each file.
  const exact: string[] = [];
  const fuzzy: { file: string; pn: string; matched: string }[] = [];
  const unmatched: string[] = [];
  const matchedPartIds = new Set<string>();

  for (const file of files) {
    const pn = pnFromFilename(file);
    const hit = byPn.get(pn);
    if (hit) {
      exact.push(file);
      matchedPartIds.add(hit.id);
      continue;
    }
    const fz = byNorm.get(norm(pn));
    if (fz) {
      fuzzy.push({ file, pn, matched: fz.pn });
      matchedPartIds.add(fz.id);
      continue;
    }
    unmatched.push(file);
  }

  const totalParts = parts?.length ?? 0;
  const partsWithImageAlready = (parts ?? []).filter(
    (p) => p.image_status && p.image_status !== "missing",
  ).length;

  // 5. Report.
  console.log("=== Image ↔ Part match dry run ===");
  console.log(`Image files in ./${IMAGE_DIR}:        ${files.length}`);
  console.log(`Parts in DB:                       ${totalParts}`);
  console.log(`Parts already flagged with image:  ${partsWithImageAlready}`);
  console.log("");
  console.log(`Exact pn matches:                  ${exact.length}`);
  console.log(`Fuzzy (normalized) matches:        ${fuzzy.length}`);
  console.log(`Unmatched files:                   ${unmatched.length}`);
  console.log(`Distinct parts that would get art: ${matchedPartIds.size}`);

  if (fuzzy.length) {
    console.log("\n-- Fuzzy matches (verify these are correct) --");
    for (const f of fuzzy) console.log(`  ${f.pn}  ->  ${f.matched}   [${f.file}]`);
  }
  if (unmatched.length) {
    console.log("\n-- Unmatched files (no part row found) --");
    for (const f of unmatched) console.log(`  ${pnFromFilename(f)}   [${f}]`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
