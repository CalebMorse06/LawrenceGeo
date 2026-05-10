/**
 * Pings the Street View Image Metadata API for every `streetview` row in
 * `locations` and reports any pano IDs that have been retired or are invalid.
 *
 * Usage: tsx scripts/validate-streetview.ts
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *               NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const gKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
if (!url || !key || !gKey) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase
    .from("locations")
    .select("name, streetview_pano_id")
    .eq("type", "streetview");
  if (error) throw error;

  for (const row of data ?? []) {
    if (!row.streetview_pano_id) continue;
    const r = await fetch(
      `https://maps.googleapis.com/maps/api/streetview/metadata?pano=${row.streetview_pano_id}&key=${gKey}`,
    );
    const j = (await r.json()) as { status: string };
    const ok = j.status === "OK";
    console.log(`${ok ? "OK  " : "FAIL"} ${row.name}: ${j.status}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
