/**
 * Publishes the KRD 2026-09-09 ABB spare list (상품/*.xlsx + 상품/media).
 *
 *   npx tsx scripts/import-krd-inventory.ts --dry-run
 *   npx tsx scripts/import-krd-inventory.ts
 *
 * New part numbers are inserted as active catalog rows (quote / lead time,
 * no public price). Part numbers already on the site only gain these photos;
 * name, stock, and the current primary image stay as they are.
 *
 * 3HAC044168-001 in this sheet is RMU101. The live catalog already uses that
 * part number for an SMB board, so that row is left unchanged.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const DRY_RUN = process.argv.includes("--dry-run");
const XLSX_PATH = resolve("상품/库存清单格式要求(KRD)26.09.09.xlsx");
const MEDIA_DIR = resolve("상품/media");
const MD_PATH = resolve("상품/库存清单格式要求(KRD)26.09.09.md");
const BUCKET = "product-images";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

/**
 * Same part number, different product: the sheet's RMU101 must not be
 * attached to the live SMB board that already uses 3HAC044168-001.
 */
const DO_NOT_MERGE = new Set(["3HAC044168001"]);

const SITE_CAT: Record<string, "controllers" | "hmi" | "motion" | "mechanical" | "consumables"> = {
  "平衡缸/机械部件": "mechanical",
  "减速机": "motion",
  "齿轮箱": "motion",
  "显示操作面板": "hmi",
  "线缆管线": "mechanical",
  "电机": "motion",
  "密封件": "consumables",
  "电路板卡": "controllers",
  "计算机电路板": "controllers",
  "示教器操作面板": "hmi",
  "驱动单元": "motion",
  "线缆": "mechanical",
  "安全机械部件": "mechanical",
  "单元模块": "controllers",
  "电路板": "controllers",
  "存储卡": "controllers",
  "示教器配件": "hmi",
  "气动组件": "mechanical",
  "阀门": "mechanical",
  "机械配件": "mechanical",
  "紧固件": "consumables",
  "连接器": "consumables",
  "机械部件": "mechanical",
  "传感器外壳": "mechanical",
  "泵配件": "mechanical",
  "齿轮泵": "mechanical",
  "维修包": "consumables",
};

/** English catalog name + equipment type, keyed by sheet row (1-based). */
const ENGLISH: Record<number, { name: string; type: string; series?: string; alts?: string[] }> = {
  1: { name: "Balance cylinder 3HAC032124-003", type: "Balance cylinder" },
  2: { name: "Reducer 3HAC026114-005", type: "Reducer" },
  3: { name: "Gearbox 3HAC049849-005", type: "Gearbox" },
  4: { name: "LCD and touchscreen assembly 3HAC028357-027", type: "Display panel" },
  5: { name: "Cable harness 3HAC022997-001", type: "Cable harness" },
  6: { name: "Axis 4 motor 3HAC057547-003", type: "Motor" },
  7: { name: "Sealing shaft 3HAC17212-1", type: "Sealing shaft" },
  8: { name: "Communication board 3HAC043383-001", type: "Communication board" },
  9: { name: "Axis computer DSQC668", type: "Axis computer", alts: ["DSQC668"] },
  10: { name: "DSQC1018 computer", type: "Main computer", alts: ["DSQC1018"] },
  11: { name: "Teach pendant 3HAC028357-001", type: "Teach pendant" },
  12: { name: "Drive unit DSQC663", type: "Drive unit", alts: ["DSQC663"] },
  13: { name: "Drive unit DSQC664", type: "Drive unit", alts: ["DSQC664"] },
  14: { name: "Robot body cable 3HAC065220-001", type: "Cable" },
  15: { name: "Teach pendant cable 3HAC031683-001", type: "Cable" },
  16: { name: "IRB 4600 axis 2 reducer 3HAC039109-002", type: "Reducer", series: "IRB 4600" },
  17: { name: "Cable 3HAC046531-001", type: "Cable" },
  18: { name: "Axis computer 3HAC029157-001", type: "Axis computer" },
  19: { name: "Robot arm safety belt 3HAC069663-001", type: "Safety belt" },
  20: { name: "Main computer 3HAC058366-001", type: "Main computer" },
  21: { name: "RMU101 3HAC044168-001", type: "Unit module", alts: ["RMU101"] },
  22: { name: "Panel 3HAC024488-001", type: "Panel" },
  23: { name: "Brake board 3HAC064474-001", type: "Brake board" },
  24: { name: "Robot arm safety belt 3HAC069656-001", type: "Safety belt" },
  25: { name: "SD card 3HAC061416-003", type: "Memory card" },
  26: { name: "Teach pendant joystick 3HAC028357-026", type: "Teach pendant accessory" },
  27: { name: "Profibus board 3HAC026840-001/00", type: "Communication board" },
  28: { name: "CF card 3HAC025465-011", type: "Memory card" },
  29: { name: "Teach pendant cable 3HAC064448-001", type: "Cable" },
  30: { name: "Brake relay board 3HAC064603-001", type: "Brake relay board" },
  31: { name: "Brake relay board 3HAC064944-001", type: "Brake relay board" },
  32: { name: "Robot SMB board 3HAC044168-001/07", type: "SMB board" },
  33: { name: "Air control assembly 3NA026034-001", type: "Air control assembly" },
  34: { name: "Main computer 3HAC025097-001", type: "Main computer" },
  35: { name: "Blind plug 3HNA014012-001", type: "Blind plug" },
  36: { name: "Small white valve 3HNA012770-001", type: "Valve" },
  37: { name: "Connecting fork 3HNA012852-001", type: "Mechanical accessory" },
  38: { name: "Assembly pin 3HNA014602-001", type: "Assembly pin" },
  39: { name: "Assembly pin 3HNA013252-001", type: "Assembly pin" },
  40: { name: "Steel color-change valve 3HNA022998-001", type: "Valve" },
  41: { name: "Valve block 3HNA021573-001", type: "Valve block" },
  42: { name: "Nut 3HNA012854-001", type: "Nut" },
  43: { name: "Connector 3HNA012853-001", type: "Connector" },
  44: { name: "Push-in connector 3HNA017268-001", type: "Connector" },
  45: { name: "Screw connector 3HNM14144-1", type: "Connector" },
  46: { name: "Valve block 3HNA021575-001", type: "Valve block" },
  47: { name: "Diaphragm valve 3HNA021676-001", type: "Valve" },
  48: { name: "Sealing plug 3HNA021721-001", type: "Sealing plug" },
  49: { name: "Mixer 3HNA027082-001", type: "Mixer" },
  50: { name: "Pressure sensor housing 3HNA027026-001", type: "Sensor housing" },
  51: { name: "Pump shaft assembly 3HNA029640-001", type: "Pump shaft" },
  52: { name: "Gear pump 3HNA034193-001", type: "Gear pump" },
  53: { name: "Hose nut 3HNP01400-1", type: "Hose nut" },
  54: { name: "Hose nut 3HNP01433-1", type: "Hose nut" },
  55: { name: "Hose nut 3HNP01232-1", type: "Hose nut" },
  56: { name: "Pressure control valve 3HNA015717-001", type: "Pressure control valve" },
  57: { name: "Pressure control valve 3HNA019608-001", type: "Pressure control valve" },
  58: { name: "6CC gear pump 3HNA034194-001", type: "Gear pump" },
  59: { name: "Motor 3HNA006493-001", type: "Motor" },
  60: { name: "Gear pump repair kit 3HNA012370-001", type: "Repair kit" },
  61: { name: "Gear pump repair kit 3HNA012371-001", type: "Repair kit" },
  62: { name: "Sealing ring 3HNP02911-1", type: "Sealing ring" },
  63: { name: "Sealing membrane 3HNP02912-1", type: "Sealing membrane" },
  64: { name: "Sealing kit 3HNA027104-001", type: "Sealing kit" },
  65: { name: "Sealing ring 3HNP02902-1", type: "Sealing ring" },
  66: { name: "Reducer 3HAC037835-001", type: "Reducer" },
  67: { name: "Wrist flange 3HAC055334-002", type: "Wrist flange" },
  68: { name: "Cable 3HAC084673-001", type: "Cable" },
  69: { name: "Brake board 3HAC065021-001", type: "Brake board" },
  70: { name: "Encoder cable 7 m 3HAC2493-1", type: "Encoder cable" },
  71: { name: "Motor 3HNA008031-001", type: "Motor" },
  72: { name: "Forming ring 3N3886", type: "Forming ring" },
  73: { name: "Motor 3HNM11221-1", type: "Motor" },
  74: { name: "Motor 3HNA026951-001", type: "Motor" },
  75: { name: "1.2CC gear pump 3HNA034190-001", type: "Gear pump" },
  76: { name: "Expansion board 3HAC046408-001", type: "Expansion board" },
  77: { name: "Nut 4N4786", type: "Nut" },
  78: { name: "Sealing cap 4N4785", type: "Sealing cap" },
  79: { name: "Distribution disc 2N2330", type: "Distribution disc" },
  80: { name: "1.2CC gear pump 3HNA034191-001", type: "Gear pump" },
};

type SheetItem = {
  row: number;
  pn: string;
  nameZh: string;
  categoryZh: string;
  qtyNote: string;
  price: string;
  warranty: string;
  hs: string;
  kg: string;
  size: string;
  imageFile: string;
  nameKo: string;
};

function loadEnvLocal() {
  const raw = readFileSync(resolve(".env.local"), "utf8");
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
}

function norm(pn: string) {
  return pn.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function canonicalPn(raw: string) {
  return raw.trim().replace(/\s+/g, "");
}

function stableId(pn: string) {
  return `abb-${pn}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function zipEntry(entry: string) {
  const copy = join(tmpdir(), "krd-inventory.xlsx");
  copyFileSync(XLSX_PATH, copy);
  return execFileSync("tar", ["-xOf", copy, entry], { encoding: "utf8" });
}

function imageMap() {
  const rels = zipEntry("xl/_rels/cellimages.xml.rels");
  const cells = zipEntry("xl/cellimages.xml");
  const ridToFile = new Map<string, string>();
  for (const match of rels.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g)) {
    ridToFile.set(match[1], match[2].replace(/^media\//, ""));
  }
  const idToFile = new Map<string, string>();
  for (const match of cells.matchAll(/name="(ID_[A-F0-9]+)"[\s\S]*?r:embed="(rId\d+)"/g)) {
    const file = ridToFile.get(match[2]);
    if (!file || file === "NULL") throw new Error(`No media file for ${match[1]}`);
    idToFile.set(match[1], file);
  }
  return idToFile;
}

function koreanNames() {
  const md = readFileSync(MD_PATH, "utf8");
  const names = new Map<number, string>();
  for (const line of md.split(/\n/)) {
    const match = line.match(/^\|\s*(\d+)\s*\|[^|]*\|[^|]*\|\s*([^|]+?)\s*\|/);
    if (match) names.set(Number(match[1]), match[2].trim());
  }
  return names;
}

function loadItems(): SheetItem[] {
  const book = XLSX.read(readFileSync(XLSX_PATH), { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json(book.Sheets.Sheet1, { header: 1, defval: "", raw: false }) as string[][];
  const idToFile = imageMap();
  const ko = koreanNames();
  const items: SheetItem[] = [];
  for (const [index, cells] of rows.slice(1).entries()) {
    const mpn = canonicalPn(String(cells[2] ?? ""));
    if (!mpn) continue;
    const row = index + 1;
    const formula = String(cells[9] ?? "");
    const id = formula.match(/ID_[A-F0-9]+/i)?.[0];
    const imageFile = id ? idToFile.get(id) : undefined;
    if (!imageFile) throw new Error(`Row ${row} ${mpn} has no nameplate image`);
    const nameKo = ko.get(row);
    if (!nameKo) throw new Error(`Row ${row} has no Korean name`);
    if (!ENGLISH[row]) throw new Error(`Row ${row} has no English name`);
    items.push({
      row,
      pn: mpn,
      nameZh: String(cells[3] ?? "").trim(),
      categoryZh: String(cells[4] ?? "").trim(),
      qtyNote: String(cells[6] ?? "").trim(),
      price: String(cells[8] ?? "").trim(),
      warranty: String(cells[11] ?? "").trim(),
      hs: String(cells[0] ?? "").trim(),
      kg: String(cells[12] ?? "").trim(),
      size: [cells[13], cells[14], cells[15]].map((v) => String(v ?? "").trim()).filter(Boolean).join("×"),
      imageFile,
      nameKo,
    });
  }
  if (items.length !== 80) throw new Error(`Expected 80 rows, got ${items.length}`);
  return items;
}

function warrantyEn(value: string) {
  if (value === "一年") return "1 year";
  if (value === "无质保") return "No warranty";
  if (value === "损耗件无质保") return "Wear part, no warranty";
  throw new Error(`Unknown warranty: ${value}`);
}

function leadFor(qtyNote: string) {
  if (!qtyNote) return { lead: "Quote required", availability: "Quote required" };
  if (qtyNote === "需要货期") return { lead: "Lead time required", availability: "Lead time required" };
  throw new Error(`Unknown stock note: ${qtyNote}`);
}

function adminNotes(item: SheetItem) {
  return [
    "Source: KRD inventory 2026-09-09",
    `Chinese name: ${item.nameZh}`,
    `HS code: ${item.hs}`,
    `Wholesale (CNY, not public): ${item.price}`,
    `Warranty: ${warrantyEn(item.warranty)}`,
    `Weight: ${item.kg} kg`,
    `Size (cm): ${item.size}`,
    item.qtyNote ? `Stock note: ${item.qtyNote}` : "Stock note: quantity not listed",
  ].join("\n");
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function ensureBucket(supabase: SupabaseClient) {
  const { data, error } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
  if (error && !/not found/i.test(error.message)) throw error;
  const { error: createErr } = await supabase.storage.createBucket(BUCKET, { public: true });
  if (createErr && !/already exists/i.test(createErr.message)) throw createErr;
}

async function uploadImage(supabase: SupabaseClient, pn: string, file: string, index: number) {
  const ext = extname(file).toLowerCase();
  const key = index <= 1 ? `${norm(pn)}_krd${ext}` : `${norm(pn)}_krd_${index}${ext}`;
  if (DRY_RUN) return { key, url: `dry://${key}` };
  const bytes = readFileSync(join(MEDIA_DIR, file));
  const { error } = await supabase.storage.from(BUCKET).upload(key, bytes, {
    contentType: CONTENT_TYPES[ext] ?? "application/octet-stream",
    upsert: true,
  });
  if (error) throw new Error(`Upload ${file} for ${pn} failed: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
  return { key, url: data.publicUrl };
}

type Existing = {
  id: string;
  pn: string;
  name: string;
  image_url: string | null;
  image_urls: string[] | null;
  image_storage_path: string | null;
  image_status: string | null;
};

function mergeUrls(existing: Existing, added: string[]) {
  const out: string[] = [];
  const push = (url: string | null | undefined) => {
    if (!url || out.includes(url)) return;
    out.push(url);
  };
  push(existing.image_url);
  for (const url of existing.image_urls ?? []) push(url);
  for (const url of added) push(url);
  return out;
}

async function main() {
  loadEnvLocal();
  const items = loadItems();
  const supabase = getSupabase();

  const { data: parts, error } = await supabase
    .from("parts")
    .select("id, pn, name, image_url, image_urls, image_storage_path, image_status");
  if (error) throw new Error(error.message);
  const byNorm = new Map<string, Existing>();
  for (const part of (parts ?? []) as Existing[]) byNorm.set(norm(part.pn), part);

  const groups = new Map<string, SheetItem[]>();
  for (const item of items) {
    const list = groups.get(item.pn) ?? [];
    list.push(item);
    groups.set(item.pn, list);
  }

  if (!DRY_RUN) await ensureBucket(supabase);

  let inserted = 0;
  let photosAdded = 0;
  const skipped: string[] = [];

  for (const [pn, rows] of groups) {
    const key = norm(pn);
    const existing = byNorm.get(key);
    const english = ENGLISH[rows[0].row];
    const cat = SITE_CAT[rows[0].categoryZh];
    if (!cat) throw new Error(`No category for ${rows[0].categoryZh}`);

    if (existing && DO_NOT_MERGE.has(key)) {
      skipped.push(`${pn} already exists as "${existing.name}" — left unchanged (sheet: ${rows.map((r) => r.nameZh).join(" / ")})`);
      continue;
    }

    const uploaded: { key: string; url: string }[] = [];
    for (const [index, row] of rows.entries()) {
      uploaded.push(await uploadImage(supabase, pn, row.imageFile, index + 1));
    }

    if (existing) {
      const urls = mergeUrls(existing, uploaded.map((u) => u.url));
      console.log(`photo  ${existing.pn}  +${uploaded.length}  (${existing.name})`);
      if (!DRY_RUN) {
        const patch = {
          image_url: existing.image_url || urls[0],
          image_urls: urls,
          image_storage_path: existing.image_storage_path || `${BUCKET}/${uploaded[0].key}`,
          image_status: "approved",
        };
        const { error: updErr } = await supabase.from("parts").update(patch).eq("id", existing.id);
        if (updErr) throw new Error(`Photo update ${pn} failed: ${updErr.message}`);
      }
      photosAdded++;
      continue;
    }

    const { lead, availability } = leadFor(rows[0].qtyNote);
    const record = {
      id: stableId(pn),
      cat,
      brand: "ABB",
      pn,
      name: english.name,
      life: "Unknown",
      cond: "tested",
      stock: "request" as const,
      qty: null,
      lead,
      hosts: ["abb"],
      is_active: true,
      alternative_pns: english.alts ?? [],
      category_l1: cat,
      category_l2: english.type,
      series: english.series ?? null,
      equipment_type: english.type,
      availability_label: availability,
      description_kr: `${rows[0].nameKo}. ABB ${pn}. 중고(탈거), 통전 시험 완료.`,
      image_url: uploaded[0].url,
      image_urls: uploaded.map((u) => u.url),
      image_storage_path: `${BUCKET}/${uploaded[0].key}`,
      image_status: "approved",
      admin_notes: adminNotes(rows[0]),
    };
    console.log(`insert ${cat.padEnd(12)} ${pn.padEnd(22)} ${english.name}`);
    if (!DRY_RUN) {
      const { error: insErr } = await supabase.from("parts").insert(record);
      if (insErr) throw new Error(`Insert ${pn} failed: ${insErr.message}`);
    }
    inserted++;
  }

  console.log(`\n${DRY_RUN ? "[DRY RUN] " : ""}Inserted ${inserted}. Added photos to ${photosAdded} existing parts.`);
  if (skipped.length) {
    console.log("Skipped:");
    for (const line of skipped) console.log(`  ${line}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
