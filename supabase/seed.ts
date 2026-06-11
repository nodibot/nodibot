/**
 * Seeds the `parts` table from the prototype data.
 *
 * Requires the SERVICE ROLE key (RLS blocks anon writes to parts).
 * Run after applying supabase/migrations/0001_init.sql:
 *
 *   npx tsx supabase/seed.ts
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY from .env.local
 * (or the process environment).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { SEED_PARTS } from "./seed-data";

// Minimal .env.local loader so the script needs no extra dependency.
function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
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
    // No .env.local — rely on the ambient environment.
  }
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local before seeding.",
    );
  }

  const supabase = createClient(url, secretKey, { auth: { persistSession: false } });

  const { error } = await supabase
    .from("parts")
    .upsert(SEED_PARTS, { onConflict: "id" });

  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }

  console.log(`Seeded ${SEED_PARTS.length} parts.`);
}

main();
