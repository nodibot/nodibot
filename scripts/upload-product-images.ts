/**
 * Uploads ./final/*.{png,jpg} to Supabase Storage and links each image to its
 * part row (matched by the part-number filename prefix).
 *
 *   npx tsx scripts/upload-product-images.ts            # real run
 *   npx tsx scripts/upload-product-images.ts --dry-run  # report only, no writes
 *
 * For every matched file it:
 *   1. uploads to the `product-images` bucket at <pn>.<ext> (upsert),
 *   2. sets parts.image_storage_path, parts.image_url (public URL),
 *      parts.image_status = 'approved'.
 *
 * Requires the service/secret key (bypasses RLS). Reads NEXT_PUBLIC_SUPABASE_URL
 * and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) from .env.local.
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve, extname } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const IMAGE_DIR = "final";
const BUCKET = "product-images";
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

const DRY_RUN = process.argv.includes("--dry-run");

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

function pnFromFilename(file: string): string {
  const stem = file.slice(0, file.length - extname(file).length);
  const underscore = stem.indexOf("_");
  return (underscore === -1 ? stem : stem.slice(0, underscore)).trim();
}

function norm(pn: string): string {
  return pn.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Storage object key for a part. Keep it stable & URL-safe, keyed on the
// canonical pn so re-runs overwrite the same object instead of duplicating.
function objectKey(pn: string, ext: string): string {
  return `${norm(pn)}${ext.toLowerCase()}`;
}

async function ensureBucket(supabase: SupabaseClient) {
  const { data, error } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
  if (error && !/not found/i.test(error.message)) throw error;
  console.log(`Creating public bucket "${BUCKET}"...`);
  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
  });
  if (createErr && !/already exists/i.test(createErr.message)) throw createErr;
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const secret =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !secret) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY in .env.local",
    );
  }
  const supabase = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const files = readdirSync(resolve(process.cwd(), IMAGE_DIR)).filter((f) =>
    IMAGE_EXTS.has(extname(f).toLowerCase()),
  );

  const { data: parts, error } = await supabase
    .from("parts")
    .select("id, pn, alternative_pns");
  if (error) throw error;

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

  if (!DRY_RUN) await ensureBucket(supabase);

  let uploaded = 0;
  let linked = 0;
  const skipped: string[] = [];

  for (const file of files) {
    const pn = pnFromFilename(file);
    const hit = byPn.get(pn) ?? byNorm.get(norm(pn));
    if (!hit) {
      skipped.push(file);
      continue;
    }

    const ext = extname(file).toLowerCase();
    const key = objectKey(hit.pn, ext);

    if (DRY_RUN) {
      console.log(`[dry] ${file}  ->  part ${hit.pn}  ->  ${BUCKET}/${key}`);
      uploaded++;
      linked++;
      continue;
    }

    // 1. Upload (upsert so re-runs replace cleanly).
    const bytes = readFileSync(resolve(process.cwd(), IMAGE_DIR, file));
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(key, bytes, {
      contentType: CONTENT_TYPES[ext] ?? "application/octet-stream",
      upsert: true,
    });
    if (upErr) {
      console.error(`  ✗ upload failed for ${file}: ${upErr.message}`);
      skipped.push(file);
      continue;
    }
    uploaded++;

    // 2. Link the row.
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(key);
    const { error: updErr } = await supabase
      .from("parts")
      .update({
        image_storage_path: `${BUCKET}/${key}`,
        image_url: pub.publicUrl,
        image_status: "approved",
      })
      .eq("id", hit.id);
    if (updErr) {
      console.error(`  ✗ link failed for ${hit.pn}: ${updErr.message}`);
      continue;
    }
    linked++;
    console.log(`  ✓ ${hit.pn}  ${key}`);
  }

  console.log("\n=== Done ===");
  console.log(`${DRY_RUN ? "[DRY RUN] " : ""}Uploaded: ${uploaded}   Linked: ${linked}   Skipped: ${skipped.length}`);
  if (skipped.length) {
    console.log("Skipped files:");
    for (const f of skipped) console.log(`  ${f}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
