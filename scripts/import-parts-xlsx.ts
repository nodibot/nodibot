import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

type SheetRow = Record<string, unknown>;

const REQUIRED_COLUMNS = ["Part Number", "Brand", "Part Name (EN)", "Category L1"] as const;

const CATEGORY_MAP: Record<string, string> = {
  Drive: "motion",
  Power: "motion",
  Feedback: "motion",
  Control: "controllers",
  HMI: "hmi",
  Consumable: "consumables",
  Mechanical: "mechanical",
};

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

function clean(value: unknown): string | null {
  const text = String(value ?? "").trim();
  if (!text || text.toUpperCase() === "N/V") return null;
  return text;
}

function splitList(value: unknown, separators: RegExp = /[;\n]/): string[] {
  const text = clean(value);
  if (!text) return [];
  return text
    .split(separators)
    .map((item) => item.trim())
    .filter(Boolean);
}

function intOrNull(value: unknown): number | null {
  const text = clean(value);
  if (!text) return null;
  const match = text.match(/-?\d+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapHosts(brand: string | null): string[] {
  const upper = brand?.toUpperCase() ?? "";
  if (upper.includes("FANUC")) return ["fanuc"];
  if (upper.includes("ABB")) return ["abb"];
  return [];
}

function stockFromAvailability(availability: string | null): "in" | "request" {
  if (!availability) return "request";
  return availability.toLowerCase().includes("new") ? "in" : "request";
}

function parseSalesPriority(value: string | null): { grade: string | null; score: number | null } {
  if (!value) return { grade: null, score: null };
  const grade = value.match(/[A-Z]/)?.[0] ?? null;
  const score = value.match(/\((\d+)\)/)?.[1] ?? null;
  return { grade, score: score ? Number(score) : null };
}

function stableId(brand: string, pn: string): string {
  return `${brand}-${pn}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeRow(row: SheetRow) {
  const partNumber = clean(row["Part Number"]);
  const brand = clean(row["Brand"]);
  const name = clean(row["Part Name (EN)"]);
  const categoryL1 = clean(row["Category L1"]);
  const category = categoryL1 ? CATEGORY_MAP[categoryL1] : undefined;
  const availability = clean(row["Availability"]);
  const salesPriority = parseSalesPriority(clean(row["Sales Priority"]));
  const errors: string[] = [];

  for (const column of REQUIRED_COLUMNS) {
    if (!clean(row[column])) errors.push(`Missing ${column}`);
  }
  if (categoryL1 && !category) errors.push(`Unsupported Category L1: ${categoryL1}`);

  const normalized = {
    id: brand && partNumber ? stableId(brand, partNumber) : null,
    cat: category ?? null,
    brand,
    pn: partNumber,
    name,
    life: clean(row["Lifecycle Status"]) ?? "Unknown",
    cond: "tested",
    stock: stockFromAvailability(availability),
    qty: null,
    lead: availability === "New" ? "Quote required" : "Sourcing required",
    hosts: mapHosts(brand),
    is_active: false,
    alternative_pns: splitList(row["Alternative P/N"], /[;\n,]/),
    category_l1: categoryL1,
    category_l2: clean(row["Category L2"]),
    series: clean(row["Series"]),
    equipment_type: clean(row["Equipment Type"]),
    compatible_controllers: splitList(row["Compatible Controller"], /[;\n,]/),
    compatible_robot_models: splitList(row["Compatible Robot Models"], /[;\n,]/),
    controller_generation: clean(row["Controller Generation"]),
    availability_label: availability,
    description_kr: clean(row["Description (KR)"]),
    failure_keywords: splitList(row["Failure Keywords"]),
    image_url: null,
    image_storage_path: null,
    image_status: "missing",
    demand_score: intOrNull(row["Demand Score"]),
    scarcity_score: intOrNull(row["Scarcity Score"]),
    sales_priority_grade: salesPriority.grade,
    sales_priority_score: salesPriority.score,
    source_urls: splitList(row["Source URLs"]),
    admin_notes: null,
  };

  return { normalized, errors };
}

type NormalizedPart = ReturnType<typeof normalizeRow>["normalized"];

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY before importing.");
  }
  return createClient(url, secretKey, { auth: { persistSession: false } });
}

function toPartRecord(normalized: NormalizedPart, isActive: boolean) {
  if (!normalized.id || !normalized.cat || !normalized.brand || !normalized.pn || !normalized.name) {
    throw new Error(`Incomplete normalized row for part ${normalized.pn ?? "unknown"}`);
  }

  return {
    id: normalized.id,
    cat: normalized.cat,
    brand: normalized.brand,
    pn: normalized.pn,
    name: normalized.name,
    life: normalized.life,
    cond: normalized.cond,
    stock: normalized.stock,
    qty: normalized.qty,
    lead: normalized.lead,
    hosts: normalized.hosts,
    is_active: isActive,
    alternative_pns: normalized.alternative_pns,
    category_l1: normalized.category_l1,
    category_l2: normalized.category_l2,
    series: normalized.series,
    equipment_type: normalized.equipment_type,
    compatible_controllers: normalized.compatible_controllers,
    compatible_robot_models: normalized.compatible_robot_models,
    controller_generation: normalized.controller_generation,
    availability_label: normalized.availability_label,
    description_kr: normalized.description_kr,
    failure_keywords: normalized.failure_keywords,
    image_url: normalized.image_url,
    image_storage_path: normalized.image_storage_path,
    image_status: normalized.image_status,
    demand_score: normalized.demand_score,
    scarcity_score: normalized.scarcity_score,
    sales_priority_grade: normalized.sales_priority_grade,
    sales_priority_score: normalized.sales_priority_score,
    source_urls: normalized.source_urls,
    admin_notes: normalized.admin_notes,
  };
}

async function publishBatch(batchId?: string, isActive = true) {
  const supabase = getSupabase();

  let targetBatchId = batchId;
  if (!targetBatchId) {
    const { data: latest, error } = await supabase
      .from("part_import_batches")
      .select("id, file_name, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!latest) throw new Error("No import batches found. Run import:parts with an Excel file first.");
    targetBatchId = latest.id;
    console.log(`Publishing latest batch ${latest.id} (${latest.file_name})`);
  }

  const { data: stagedRows, error: rowsError } = await supabase
    .from("part_import_rows")
    .select("id, normalized, status")
    .eq("batch_id", targetBatchId)
    .eq("status", "valid");
  if (rowsError) throw new Error(rowsError.message);
  if (!stagedRows?.length) {
    throw new Error(`No valid rows to publish for batch ${targetBatchId}.`);
  }

  let published = 0;
  for (const staged of stagedRows) {
    const normalized = staged.normalized as NormalizedPart;
    const record = toPartRecord(normalized, isActive);

    const { data: existing, error: existingError } = await supabase
      .from("parts")
      .select("id, views")
      .eq("pn", record.pn)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);

    if (existing) {
      const { error: updateError } = await supabase
        .from("parts")
        .update({ ...record, id: existing.id, views: existing.views })
        .eq("id", existing.id);
      if (updateError) throw new Error(`Failed to update ${record.pn}: ${updateError.message}`);
    } else {
      const { error: insertError } = await supabase.from("parts").insert({ ...record, views: 0 });
      if (insertError) throw new Error(`Failed to insert ${record.pn}: ${insertError.message}`);
    }

    const { error: stagedUpdateError } = await supabase
      .from("part_import_rows")
      .update({ status: "published", part_id: existing?.id ?? record.id })
      .eq("id", staged.id);
    if (stagedUpdateError) throw new Error(stagedUpdateError.message);

    published += 1;
  }

  const { error: batchUpdateError } = await supabase
    .from("part_import_batches")
    .update({ status: "published" })
    .eq("id", targetBatchId);
  if (batchUpdateError) throw new Error(batchUpdateError.message);

  console.log(`Published ${published} parts to the parts table (${isActive ? "active" : "hidden"}).`);
  if (isActive) {
    console.log("They should now appear on /catalog and in /admin-portal/products.");
  } else {
    console.log("Set is_active in admin when you are ready to show them publicly.");
  }
}

async function stageWorkbook(filePath: string) {
  const supabase = getSupabase();

  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const sheet = workbook.Sheets["Master DB"];
  if (!sheet) throw new Error('Workbook must include a "Master DB" sheet.');

  const rows = XLSX.utils.sheet_to_json<SheetRow>(sheet, { defval: "", raw: false });

  const { data: batch, error: batchError } = await supabase
    .from("part_import_batches")
    .insert({
      file_name: basename(filePath),
      source: "xlsx",
      total_rows: rows.length,
      status: "staged",
    })
    .select("id")
    .single();

  if (batchError || !batch) throw new Error(batchError?.message ?? "Failed to create import batch.");

  const stagedRows = rows.map((row, index) => {
    const { normalized, errors } = normalizeRow(row);
    return {
      batch_id: batch.id,
      row_number: index + 2,
      status: errors.length ? "invalid" : "valid",
      errors,
      normalized,
      raw: row,
    };
  });

  for (let i = 0; i < stagedRows.length; i += 100) {
    const chunk = stagedRows.slice(i, i + 100);
    const { error } = await supabase.from("part_import_rows").insert(chunk);
    if (error) throw new Error(`Failed to stage rows ${i + 1}-${i + chunk.length}: ${error.message}`);
  }

  const validRows = stagedRows.filter((row) => row.status === "valid").length;
  const invalidRows = stagedRows.length - validRows;
  const { error: updateError } = await supabase
    .from("part_import_batches")
    .update({ valid_rows: validRows, invalid_rows: invalidRows })
    .eq("id", batch.id);
  if (updateError) throw new Error(updateError.message);

  console.log(`Import batch ${batch.id}`);
  console.log(`Staged ${stagedRows.length} rows: ${validRows} valid, ${invalidRows} invalid.`);
  if (invalidRows > 0) {
    console.log("Review invalid rows in part_import_rows before publishing.");
  }

  console.log("Next step: npm run publish:parts");
}

async function main() {
  loadEnvLocal();

  const args = process.argv.slice(2);
  const publishIndex = args.indexOf("--publish");
  if (publishIndex !== -1) {
    const batchId = args[publishIndex + 1];
    const inactive = args.includes("--inactive");
    await publishBatch(batchId && !batchId.startsWith("--") ? batchId : undefined, !inactive);
    return;
  }

  const filePath = args.find((arg) => !arg.startsWith("--"));
  if (!filePath) {
    throw new Error(
      [
        "Usage:",
        '  npm run import:parts -- "C:\\path\\to\\file.xlsx"',
        "  npm run publish:parts",
        "  npm run publish:parts -- <batch-id>",
        "  npm run publish:parts -- --inactive",
      ].join("\n"),
    );
  }

  await stageWorkbook(filePath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
