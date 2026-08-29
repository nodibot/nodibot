/**
 * Copies each real item's primary photo out of the supplier document's media
 * folder into ./final, named so the existing images:upload script links it to
 * the right part (filename prefix normalizes to the part number).
 *
 *   # 1. unzip the .docx somewhere and point at its word/media dir:
 *   npx tsx scripts/extract-doc-images.ts --media-dir /path/to/unpacked/word/media
 *   npx tsx scripts/extract-doc-images.ts --media-dir <dir> --dry-run
 *
 * A photo is placed only where it fills a gap:
 *   - brand-new items, and
 *   - overlaps whose existing DB image is still 'missing'.
 * Items whose DB row already has a good photo are left untouched.
 *
 * After this, run:  npm run images:upload
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { REAL_ITEMS } from "../supabase/real-inventory";

const OUT_DIR = "final";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
const DRY_RUN = process.argv.includes("--dry-run");

// Make a filesystem-safe filename prefix whose normalized form still equals the
// part number (images:upload matches on the normalized prefix).
const safe = (s: string) => s.replace(/[\/\\:*?"<>|]+/g, "-").replace(/\s+/g, "_").trim();

function main() {
  const mediaDir = arg("--media-dir");
  if (!mediaDir) throw new Error("Pass --media-dir <unpacked>/word/media");
  if (!existsSync(mediaDir)) throw new Error(`media dir not found: ${mediaDir}`);

  const outAbs = resolve(process.cwd(), OUT_DIR);
  if (!DRY_RUN && !existsSync(outAbs)) mkdirSync(outAbs, { recursive: true });

  let placed = 0, skippedHasPhoto = 0, skippedNoImage = 0, missingSrc = 0;
  for (const item of REAL_ITEMS) {
    const needsPhoto = !item.existing || item.existingImageStatus === "missing";
    if (!needsPhoto) { skippedHasPhoto++; continue; }
    if (!item.primaryImage) { skippedNoImage++; console.log(`  (no image in doc)  ${item.pn}`); continue; }

    const src = join(mediaDir, item.primaryImage);
    if (!existsSync(src)) { missingSrc++; console.log(`  ⚠ source missing: ${item.primaryImage} for ${item.pn}`); continue; }

    const dest = join(outAbs, `${safe(item.pn)}_ABB_${safe(item.name)}.jpg`);
    if (DRY_RUN) {
      console.log(`  [dry] ${item.primaryImage}  ->  ${OUT_DIR}/${safe(item.pn)}_ABB_${safe(item.name)}.jpg`);
    } else {
      copyFileSync(src, dest);
    }
    placed++;
  }

  console.log(`\n${DRY_RUN ? "[DRY RUN] " : ""}Placed ${placed} photos into ./${OUT_DIR}.`);
  console.log(`Skipped: ${skippedHasPhoto} already have a photo, ${skippedNoImage} have no doc image, ${missingSrc} missing source.`);
  if (!DRY_RUN) console.log("Next: npm run images:upload");
}

main();
