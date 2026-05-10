/**
 * Idempotently seed the `locations` table from a CSV.
 *
 * Expected columns (header row required):
 *   name,lat,lng,type,streetview_pano_id,pano_storage_path,photo_storage_paths,difficulty,tags
 *
 * Usage:
 *   npx tsx scripts/seed-locations.ts path/to/locations.csv
 *
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const [, , csvPath] = process.argv;
if (!csvPath) {
  console.error("usage: tsx scripts/seed-locations.ts <csv>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(url, key);

const raw = readFileSync(csvPath, "utf8").trim();
const [headerLine, ...rows] = raw.split(/\r?\n/);
const headers = headerLine.split(",").map((h) => h.trim());

function parseRow(line: string): Record<string, string> {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === "\"") inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) {
      cells.push(cur);
      cur = "";
    } else cur += ch;
  }
  cells.push(cur);
  return Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? "").trim()]));
}

async function main() {
  for (const line of rows) {
    if (!line.trim()) continue;
    const r = parseRow(line);
    const row = {
      name: r.name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      type: r.type,
      streetview_pano_id: r.streetview_pano_id || null,
      pano_storage_path: r.pano_storage_path || null,
      photo_storage_paths: r.photo_storage_paths ? r.photo_storage_paths.split("|") : null,
      difficulty: r.difficulty ? parseInt(r.difficulty, 10) : 2,
      tags: r.tags ? r.tags.split("|") : [],
    };
    const { error } = await supabase
      .from("locations")
      .upsert(row, { onConflict: "name" });
    if (error) {
      console.error("FAIL", row.name, error.message);
    } else {
      console.log("OK  ", row.name);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
