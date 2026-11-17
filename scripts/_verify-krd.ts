import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const raw = readFileSync(resolve(".env.local"), "utf8");
for (const line of raw.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  const k = t.slice(0, eq).trim();
  let v = t.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!(k in process.env)) process.env[k] = v;
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});
const pns = [
  "3HAC032124-003",
  "3HAC029157-001",
  "3HAC044168-001",
  "3HAC044168-001/07",
  "3HAC058366-001",
  "3HAC024488-001",
  "3HNA034191-001",
];
async function main() {
const { data, error } = await sb
  .from("parts")
  .select("pn, name, is_active, stock, image_status, image_url, image_urls")
  .in("pn", pns);
if (error) throw new Error(error.message);
for (const row of data ?? []) {
  const urls = (row.image_urls as string[] | null)?.length ?? 0;
  console.log(
    `${row.pn} active=${row.is_active} stock=${row.stock} img=${row.image_status} urls=${urls} primary=${row.image_url ? "yes" : "no"} ${row.name}`,
  );
}
const sample = (data ?? []).find((r) => r.pn === "3HAC032124-003");
if (sample?.image_url) {
  const res = await fetch(sample.image_url as string, { method: "HEAD" });
  console.log("balance cylinder image", res.status);
}
}
main();
