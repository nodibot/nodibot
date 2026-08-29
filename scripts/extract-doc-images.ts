/**
 * Copies each real item's photos out of the supplier document's media folder
 * into ./final, named so images:upload can match them to a part.
 *
 *   npx tsx scripts/extract-doc-images.ts --media-dir /path/to/unpacked/word/media
 *   npx tsx scripts/extract-doc-images.ts --media-dir <dir> --dry-run
 *
 * Filenames are `{pn}_{index}_ABB_{name}.jpg` — index 1 is the catalog primary
 * (product shot first, as in the Word file), 2+ are extra gallery photos.
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

// Filesystem-safe prefix whose normalized form still equals the part number.
const safe = (s: string) => s.replace(/[\/\\:*?"<>|]+/g, "-").replace(/\s+/g, "_").trim();

function itemImages(item: (typeof REAL_ITEMS)[number]): string[] {
  if (item.images?.length) return item.images;
  return item.primaryImage ? [item.primaryImage] : [];
}

function destName(pn: string, name: string, index: number): string {
  return `${safe(pn)}_${index}_ABB_${safe(name)}.jpg`;
}

function main() {
  const mediaDir = arg("--media-dir");
  if (!mediaDir) throw new Error("Pass --media-dir <unpacked>/word/media");
  if (!existsSync(mediaDir)) throw new Error(`media dir not found: ${mediaDir}`);

  const outAbs = resolve(process.cwd(), OUT_DIR);
  if (!DRY_RUN && !existsSync(outAbs)) mkdirSync(outAbs, { recursive: true });

  let placed = 0, skippedNoImage = 0, missingSrc = 0;
  for (const item of REAL_ITEMS) {
    const images = itemImages(item);
    if (images.length === 0) {
      skippedNoImage++;
      console.log(`  (no image in doc)  ${item.pn}`);
      continue;
    }

    images.forEach((file, i) => {
      const src = join(mediaDir, file);
      const dest = destName(item.pn, item.name, i + 1);
      if (!existsSync(src)) {
        missingSrc++;
        console.log(`  ⚠ source missing: ${file} for ${item.pn}`);
        return;
      }
      if (DRY_RUN) {
        console.log(`  [dry] ${file}  ->  ${OUT_DIR}/${dest}`);
      } else {
        copyFileSync(src, join(outAbs, dest));
      }
      placed++;
    });
  }

  console.log(`\n${DRY_RUN ? "[DRY RUN] " : ""}Placed ${placed} photos into ./${OUT_DIR}.`);
  console.log(`Skipped: ${skippedNoImage} have no doc image, ${missingSrc} missing source.`);
  if (!DRY_RUN) console.log("Next: npm run images:upload");
}

main();
