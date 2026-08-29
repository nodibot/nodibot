/**
 * Generator (run once, output reviewed by a human) that turns the supplier
 * document's 72 line-items — parsed into item-images.json — into a canonical,
 * de-duplicated, DB-aware dataset for the real ABB inventory.
 *
 *   npx tsx scripts/build-real-inventory.ts <item-images.json> > out.json
 *
 * It:
 *   1. classifies each item as a whole robot (IRB…) or a part,
 *   2. resolves a canonical part-number (reusing the existing DB pn for items
 *      that already exist as crawled/dummy rows, so we never duplicate),
 *   3. de-dupes by canonical pn, summing quantities and keeping a primary photo,
 *   4. derives an English name / category / series from the model number.
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY from .env.local.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

interface DocItem { n: number; name: string; images: string[] }
interface DbRow { pn: string; name: string; cat: string; image_status: string; alternative_pns: string[] | null }

type Cat = "robots" | "controllers" | "hmi" | "motion" | "mechanical" | "consumables";

export interface RealItem {
  pn: string;              // canonical part number (unique)
  brand: "ABB";
  name: string;            // English display name
  cat: Cat;
  series: string | null;
  equipment_type: string | null;
  qty: number;             // physical units in hand (from duplicate line-items)
  alternative_pns: string[];
  primaryImage: string | null;   // media filename inside the docx (image###.jpeg)
  docNames: string[];      // original doc line names (for traceability)
  existing: boolean;       // already a row in the DB (was crawled/dummy)
  existingImageStatus: string | null;
}

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

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

// --- part type dictionary: Chinese/EN prefix -> [English label, category] ---
const TYPE_MAP: { match: RegExp; label: string; cat: Cat }[] = [
  { match: /^电源模块/, label: "Power Supply", cat: "motion" },
  { match: /^传送带跟踪板/, label: "Conveyor Tracking Board", cat: "controllers" },
  { match: /^CC-?link板卡/i, label: "CC-Link Board", cat: "controllers" },
  { match: /^外部轴驱动/, label: "External Axis Drive Unit", cat: "motion" },
  { match: /^DeviceNet板/i, label: "DeviceNet Board", cat: "controllers" },
  { match: /^Profinet板卡/i, label: "ProfiNet Board", cat: "controllers" },
  { match: /^EtherNet板卡/i, label: "EtherNet Board", cat: "controllers" },
  { match: /^串口板/, label: "Serial Port Board", cat: "controllers" },
  { match: /^全新示教器摇杆/, label: "Teach Pendant Joystick", cat: "hmi" },
  { match: /^喷涂示教器/, label: "Paint Teach Pendant", cat: "hmi" },
  { match: /^示教器主板/, label: "Teach Pendant Mainboard", cat: "hmi" },
  { match: /^全新示教器/, label: "Teach Pendant", cat: "hmi" },
  { match: /^老款示教器/, label: "Teach Pendant (legacy)", cat: "hmi" },
  { match: /^示教器/, label: "Teach Pendant", cat: "hmi" },
  { match: /^档位开关/, label: "Mode Selector Switch", cat: "hmi" },
  { match: /^安全模块/, label: "Safety Module", cat: "controllers" },
  { match: /^安全板卡/, label: "Safety Board", cat: "controllers" },
  { match: /^轴计算机板卡/, label: "Axis Computer", cat: "controllers" },
  { match: /^SMB板卡/i, label: "Serial Measurement Board (SMB)", cat: "motion" },
  { match: /^IO模块/i, label: "I/O Unit", cat: "controllers" },
  { match: /^编码器线/, label: "Encoder Cable", cat: "motion" },
  { match: /^(ABB)?电池/, label: "Battery", cat: "consumables" },
  { match: /^(ABB)?电机/, label: "Servo Motor", cat: "motion" },
  { match: /^(ABB)?主机/, label: "Main Computer", cat: "controllers" },
  { match: /^主板/, label: "Main Computer", cat: "controllers" },
  { match: /^ABB小驱动/, label: "Drive Unit (compact)", cat: "motion" },
  { match: /^黑驱动/, label: "Drive Unit", cat: "motion" },
  { match: /^(ABB)?驱动/, label: "Drive Unit", cat: "motion" },
];

// Extract the ABB part code from a part line (DSQC####, 3HAC/3HNA…, JC…, TPU#).
function extractCode(name: string): { code: string | null; kind: "dsqc" | "hac" | "other" } {
  const dsqc = name.match(/DSQC\s?\d+[A-Z]?/i);
  if (dsqc) return { code: dsqc[0].replace(/\s+/g, "").toUpperCase(), kind: "dsqc" };
  const hac = name.match(/3H[A-Z]{2}\d[\d-]*(?:\/\d+)?[A-Z0-9-]*/i);
  if (hac) return { code: hac[0].toUpperCase().replace(/ABB$/, ""), kind: "hac" }; // strip trailing brand tag (e.g. …/01ABB)
  const jc = name.match(/JC\d+-\d+/i);
  if (jc) return { code: jc[0].toUpperCase(), kind: "other" };
  const tpu = name.match(/TPU\d+/i);
  if (tpu) return { code: tpu[0].toUpperCase(), kind: "other" };
  return { code: null, kind: "other" };
}

// Robot model parsing: IRB<fam>[-|/]<payload>/<reach>, IRB<fam>/<variant>, IRB<fam>.
function parseRobot(name: string): { pn: string; name: string; series: string; equipment_type: string } | null {
  const m = name.match(/^IRB\s?([0-9]+[A-Z]*)(.*)$/i);
  if (!m) return null;
  const fam = m[1].toUpperCase();
  const rest = m[2].trim();
  const series = `IRB ${fam}`;
  const famNum = parseInt(fam, 10);

  let equipment = "6-axis articulated robot";
  if (fam.startsWith("14000")) equipment = "dual-arm collaborative robot";
  else if (famNum === 52 || famNum === 5510) equipment = "paint robot";
  else if (famNum === 660) equipment = "4-axis palletizing robot";
  if (/ID/i.test(fam) || /ID/i.test(rest)) equipment += " (integrated dressing)";

  // payload / reach
  const spec = rest.match(/[-/]?\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*([0-9]+(?:\.[0-9]+)?)/);
  const variant = rest.match(/^\/(\d+)/);
  let display: string;
  if (spec) display = `${series} — ${spec[1]} kg / ${spec[2]} m`;
  else if (variant) display = `${series}/${variant[1]}`;
  else display = series;
  const suffix = equipment.includes("paint") ? " Paint Robot"
    : equipment.includes("dual-arm") ? " (YuMi)"
    : equipment.includes("palletizing") ? " Palletizer" : "";

  return {
    pn: name.replace(/\s+/g, ""),           // canonical: exactly as supplied, IRB2600-20/1.65
    name: `${display}${suffix}`.trim(),
    series,
    equipment_type: equipment,
  };
}

function partEnglishName(docName: string, label: string, code: string | null): string {
  const spec = docName.match(/\(([^)]+)\)/); // rarely present in doc, keep if so
  const base = code ? `${label} ${code}` : label;
  return spec ? `${base} (${spec[1]})` : base;
}

async function main() {
  loadEnvLocal();
  const jsonPath = process.argv[2];
  if (!jsonPath) throw new Error("Usage: build-real-inventory.ts <item-images.json>");
  const docItems: DocItem[] = JSON.parse(readFileSync(jsonPath, "utf8"));

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
  const { data: rows } = await sb.from("parts").select("pn, name, cat, image_status, alternative_pns");
  const db = (rows ?? []) as DbRow[];

  // DB lookup: normalized token -> row (pn, name, cat). Tokens = pn, alt pns, and
  // every DSQC/code token appearing in the name.
  const dbByToken = new Map<string, DbRow>();
  for (const r of db) {
    for (const tok of [r.pn, ...(r.alternative_pns ?? [])]) if (tok) dbByToken.set(norm(tok), r);
    for (const dsqc of r.name.match(/DSQC\s?\d+[A-Z]?/gi) ?? []) {
      const k = norm(dsqc); if (!dbByToken.has(k)) dbByToken.set(k, r);
    }
  }

  const byPn = new Map<string, RealItem>();

  for (const item of docItems) {
    const robot = parseRobot(item.name);
    let resolved: RealItem;

    if (robot) {
      const existingRow = dbByToken.get(norm(robot.pn));
      resolved = {
        pn: robot.pn, brand: "ABB", name: robot.name, cat: "robots",
        series: robot.series, equipment_type: robot.equipment_type,
        qty: 1, alternative_pns: [], primaryImage: item.images[0] ?? null,
        docNames: [item.name], existing: !!existingRow,
        existingImageStatus: existingRow?.image_status ?? null,
      };
    } else {
      const { code } = extractCode(item.name);
      const typeEntry = TYPE_MAP.find((t) => t.match.test(item.name));
      const dbRow = code ? dbByToken.get(norm(code)) : undefined;
      // canonical pn: existing DB pn if matched; else the code; else the raw name
      const pn = dbRow ? dbRow.pn : (code ?? item.name);
      const label = typeEntry?.label ?? "ABB Part";
      const name = dbRow ? dbRow.name : partEnglishName(item.name, label, code);
      const cat = (dbRow?.cat as Cat) ?? typeEntry?.cat ?? "controllers";
      const altPns = code && dbRow && norm(dbRow.pn) !== norm(code) ? [code] : [];
      resolved = {
        pn, brand: "ABB", name, cat, series: null,
        equipment_type: typeEntry?.label ?? null,
        qty: 1, alternative_pns: altPns, primaryImage: item.images[0] ?? null,
        docNames: [item.name], existing: !!dbRow,
        existingImageStatus: dbRow?.image_status ?? null,
      };
    }

    // de-dupe by canonical pn
    const key = norm(resolved.pn);
    const prev = byPn.get(key);
    if (prev) {
      prev.qty += 1;
      prev.docNames.push(item.name);
      if (!prev.primaryImage && resolved.primaryImage) prev.primaryImage = resolved.primaryImage;
      for (const a of resolved.alternative_pns) if (!prev.alternative_pns.includes(a)) prev.alternative_pns.push(a);
    } else {
      byPn.set(key, resolved);
    }
  }

  const items = [...byPn.values()].sort((a, b) => {
    if (a.cat !== b.cat) return a.cat === "robots" ? -1 : b.cat === "robots" ? 1 : a.cat.localeCompare(b.cat);
    return a.pn.localeCompare(b.pn);
  });
  const summary = {
    docLineItems: docItems.length,
    uniqueItems: items.length,
    robots: items.filter((i) => i.cat === "robots").length,
    parts: items.filter((i) => i.cat !== "robots").length,
    existingOverlaps: items.filter((i) => i.existing).length,
    brandNew: items.filter((i) => !i.existing).length,
    withPrimaryImage: items.filter((i) => i.primaryImage).length,
    noImage: items.filter((i) => !i.primaryImage).map((i) => i.pn),
    overlapsMissingImage: items.filter((i) => i.existing && i.existingImageStatus === "missing").map((i) => i.pn),
  };

  const header = `// AUTO-GENERATED by scripts/build-real-inventory.ts from the supplier document.
// Real ABB inventory (robots + parts) that nodibot actually stocks. Reviewed by a
// human before import. Regenerate only when the source document changes.
//
// Summary: ${summary.uniqueItems} unique items (${summary.robots} robots, ${summary.parts} parts);
// ${summary.existingOverlaps} already existed as crawled rows, ${summary.brandNew} are new.
`;
  const body = `
export type RealCat = "robots" | "controllers" | "hmi" | "motion" | "mechanical" | "consumables";

export interface RealItem {
  pn: string;                    // canonical part number (unique)
  brand: "ABB";
  name: string;                  // English display name
  cat: RealCat;
  series: string | null;
  equipment_type: string | null;
  qty: number;                   // physical units in hand
  alternative_pns: string[];
  primaryImage: string | null;   // media filename inside the source docx
  docNames: string[];            // original doc line names (traceability)
  existing: boolean;             // already a row in the DB (was crawled/dummy)
  existingImageStatus: string | null;
}

export const REAL_ITEMS: RealItem[] = ${JSON.stringify(items, null, 2)};
`;
  writeFileSync(resolve(process.cwd(), "supabase/real-inventory.ts"), header + body);
  console.error(JSON.stringify(summary, null, 2));
  console.error(`\nWrote supabase/real-inventory.ts (${items.length} items).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
