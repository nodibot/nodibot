/**
 * Uploads ./final/*.{png,jpg} to Supabase Storage and links each image to its
 * part row (matched by the part-number filename prefix).
 *
 *   npx tsx scripts/upload-product-images.ts            # real run
 *   npx tsx scripts/upload-product-images.ts --dry-run  # report only, no writes
 *
 * Files named `{pn}_{index}_…` are grouped per part. Index 1 becomes the
 * catalog primary (`image_url`); all URLs are stored primary-first in
 * `image_urls`. Storage keys: `<PN>.<ext>`, `<PN>_2.<ext>`, …
 *
 * Requires the service/secret key (bypasses RLS). Reads NEXT_PUBLIC_SUPABASE_URL
 * and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) from .env.local.
 */
import { readFileSync, readdirSync, rmSync } from "node:fs";
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

function norm(pn: string): string {
  return pn.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function parseImageFile(file: string): { pnPrefix: string; index: number } {
  const stem = file.slice(0, file.length - extname(file).length);
  const indexed = stem.match(/^(.+)_(\d+)_ABB(?:_|$)/);
  if (indexed) return { pnPrefix: indexed[1], index: Number(indexed[2]) };
  const underscore = stem.indexOf("_");
  return {
    pnPrefix: (underscore === -1 ? stem : stem.slice(0, underscore)).trim(),
    index: 1,
  };
}

function objectKey(pn: string, ext: string, index: number): string {
  const base = `${norm(pn)}${ext.toLowerCase()}`;
  return index <= 1 ? base : `${norm(pn)}_${index}${ext.toLowerCase()}`;
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

  type Pending = { file: string; index: number };
  const grouped = new Map<string, { hit: { id: string; pn: string }; files: Pending[] }>();
  const skipped: string[] = [];

  for (const file of files) {
    const { pnPrefix, index } = parseImageFile(file);
    const hit = byPn.get(pnPrefix) ?? byNorm.get(norm(pnPrefix));
    if (!hit) {
      skipped.push(file);
      continue;
    }
    const bucket = grouped.get(hit.id) ?? { hit, files: [] };
    bucket.files.push({ file, index });
    grouped.set(hit.id, bucket);
  }

  let uploaded = 0;
  let linked = 0;

  for (const { hit, files: partFiles } of grouped.values()) {
    partFiles.sort((a, b) => a.index - b.index || a.file.localeCompare(b.file));
    const urls: string[] = [];
    let primaryPath: string | null = null;

    for (const { file, index } of partFiles) {
      const ext = extname(file).toLowerCase();
      const key = objectKey(hit.pn, ext, index);

      if (DRY_RUN) {
        console.log(`[dry] ${file}  ->  part ${hit.pn}  ->  ${BUCKET}/${key}`);
        uploaded++;
        urls.push(`https://example.invalid/${key}`);
        if (!primaryPath) primaryPath = `${BUCKET}/${key}`;
        continue;
      }

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
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(key);
      urls.push(pub.publicUrl);
      if (!primaryPath) primaryPath = `${BUCKET}/${key}`;
      console.log(`  ✓ ${hit.pn}  ${key}`);
    }

    if (urls.length === 0) continue;

    if (DRY_RUN) {
      linked++;
      continue;
    }

    const { error: updErr } = await supabase
      .from("parts")
      .update({
        image_storage_path: primaryPath,
        image_url: urls[0],
        image_urls: urls,
        image_status: "approved",
      })
      .eq("id", hit.id);
    if (updErr && /image_urls/i.test(updErr.message)) {
      const { error: legacyErr } = await supabase
        .from("parts")
        .update({
          image_storage_path: primaryPath,
          image_url: urls[0],
          image_status: "approved",
        })
        .eq("id", hit.id);
      if (legacyErr) {
        console.error(`  ✗ link failed for ${hit.pn}: ${legacyErr.message}`);
        continue;
      }
      console.log(`  ⚠ ${hit.pn} linked without image_urls (run migration 0011)`);
    } else if (updErr) {
      console.error(`  ✗ link failed for ${hit.pn}: ${updErr.message}`);
      continue;
    }
    linked++;

    const maxIndex = Math.max(...partFiles.map((f) => f.index));
    const leftovers: string[] = [];
    for (let i = maxIndex + 1; i <= 8; i++) {
      for (const ext of [".jpg", ".jpeg", ".png", ".webp"]) {
        leftovers.push(objectKey(hit.pn, ext, i));
      }
    }
    if (leftovers.length) {
      const { error: rmErr } = await supabase.storage.from(BUCKET).remove(leftovers);
      if (rmErr) console.error(`  ⚠ could not prune extras for ${hit.pn}: ${rmErr.message}`);
      else console.log(`  pruned leftover extras for ${hit.pn} (indexes > ${maxIndex})`);
    }
  }

  console.log("\n=== Done ===");
  console.log(`${DRY_RUN ? "[DRY RUN] " : ""}Uploaded: ${uploaded}   Linked parts: ${linked}   Skipped: ${skipped.length}`);
  if (skipped.length) {
    console.log("Skipped files:");
    for (const f of skipped) console.log(`  ${f}`);
  }

  if (!DRY_RUN && uploaded > 0) {
    rmSync(resolve(process.cwd(), IMAGE_DIR), { recursive: true, force: true });
    console.log(`Removed local ./${IMAGE_DIR} (photos live in Supabase Storage).`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
