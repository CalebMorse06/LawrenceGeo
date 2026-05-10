/**
 * Pulls Lawrence, KS POIs from OpenStreetMap via the Overpass API, validates
 * each one has Google Street View coverage, categorizes by tag, and writes
 * the verified set to `lib/generatedLocations.ts`.
 *
 * Run:
 *   npx tsx scripts/fetch-osm-locations.ts
 *
 * Reads `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` from .env.local for the Street
 * View metadata check. Overpass is unauthenticated.
 */
import fs from "node:fs";

// ── Load .env.local ─────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const raw = fs.readFileSync(".env.local", "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* no .env.local — fail later */
  }
}
loadEnv();

const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
if (!GMAPS_KEY) {
  console.error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY missing from .env.local");
  process.exit(1);
}

// ── Lawrence bounding box ───────────────────────────────────────────────────
const BBOX = { south: 38.91, west: -95.34, north: 39.03, east: -95.16 };

// ── Overpass query ──────────────────────────────────────────────────────────
const overpassQuery = `
[out:json][timeout:60];
(
  node["amenity"~"^(bar|pub|cafe|restaurant|fast_food|school|library|cinema|theatre|post_office|bank|place_of_worship|fire_station|hospital|university|college|community_centre|townhall|courthouse)$"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  node["shop"~"^(supermarket|department_store|books|music|bicycle|bakery|butcher|wine|alcohol)$"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  node["leisure"~"^(park|stadium|sports_centre|swimming_pool|fitness_centre|ice_rink)$"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  node["tourism"~"^(museum|hotel|attraction|artwork|gallery|viewpoint|theme_park)$"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  node["historic"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  node["building"="dormitory"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["leisure"~"^(park|stadium|sports_centre)$"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["building"~"^(dormitory|university)$"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["amenity"~"^(university|college|school|library|theatre|cinema|hospital|community_centre|townhall|courthouse|place_of_worship)$"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["tourism"~"^(museum|hotel|attraction|gallery)$"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["historic"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
);
out center;
`;

// ── Types ───────────────────────────────────────────────────────────────────
interface OverpassElement {
  type: "node" | "way";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface POI {
  name: string;
  lat: number;
  lng: number;
  primaryTag: string;
  tags: Record<string, string>;
  osmId: string;
}

// ── Categorization ──────────────────────────────────────────────────────────
const FAMOUS_KEYWORDS: { match: RegExp; tags: string[]; difficulty: 1 | 2 }[] = [
  { match: /\ballen fieldhouse\b/i, tags: ["campus", "sports", "lawrence-staple"], difficulty: 1 },
  { match: /\bmemorial stadium\b/i, tags: ["campus", "sports", "lawrence-staple"], difficulty: 1 },
  { match: /\bcampanile\b/i, tags: ["campus", "lawrence-staple"], difficulty: 1 },
  { match: /\bliberty hall\b/i, tags: ["mass-st", "venue", "lawrence-staple"], difficulty: 1 },
  { match: /\bfree state brewing/i, tags: ["mass-st", "bar", "lawrence-staple"], difficulty: 1 },
  { match: /\beldridge\b/i, tags: ["mass-st", "lawrence-staple"], difficulty: 2 },
  { match: /\bgranada\b/i, tags: ["mass-st", "venue", "lawrence-staple"], difficulty: 2 },
  { match: /\bbottleneck\b/i, tags: ["bar", "venue", "lawrence-staple"], difficulty: 2 },
  { match: /\bthe hawk\b/i, tags: ["bar", "campus", "lawrence-staple"], difficulty: 2 },
  { match: /\bbullwinkle/i, tags: ["bar", "campus"], difficulty: 2 },
  { match: /\bsandbar\b/i, tags: ["bar", "downtown"], difficulty: 2 },
  { match: /\bjohnny's tavern\b/i, tags: ["bar", "north-lawrence", "lawrence-staple"], difficulty: 2 },
  { match: /\breplay\b/i, tags: ["mass-st", "bar"], difficulty: 2 },
  { match: /\boread\b/i, tags: ["campus", "lawrence-staple"], difficulty: 1 },
  { match: /\bbowersock\b/i, tags: ["downtown", "lawrence-staple"], difficulty: 2 },
];

function categorize(tags: Record<string, string>, name: string): { tags: string[]; difficulty: 1 | 2 | 3 } {
  for (const f of FAMOUS_KEYWORDS) {
    if (f.match.test(name)) return { tags: f.tags, difficulty: f.difficulty };
  }
  const out = new Set<string>();
  if (tags.amenity === "bar" || tags.amenity === "pub") out.add("bar");
  if (tags.amenity === "cafe") out.add("cafe");
  if (tags.amenity === "restaurant" || tags.amenity === "fast_food") out.add("restaurant");
  if (tags.amenity === "school") out.add("school");
  if (tags.amenity === "library") out.add("library");
  if (tags.amenity === "cinema" || tags.amenity === "theatre") out.add("venue");
  if (tags.amenity === "place_of_worship") out.add("church");
  if (tags.amenity === "hospital") out.add("hospital");
  if (tags.amenity === "university" || tags.amenity === "college") out.add("campus");
  if (tags.shop === "supermarket" || tags.shop === "department_store") out.add("shopping");
  if (tags.leisure === "park") out.add("park");
  if (tags.leisure === "stadium" || tags.leisure === "sports_centre") out.add("sports");
  if (tags.tourism === "museum") out.add("museum");
  if (tags.tourism === "hotel") out.add("hotel");
  if (tags.tourism === "artwork") out.add("statue");
  if (tags.tourism === "viewpoint") out.add("viewpoint");
  if (tags.historic) out.add("historic");
  if (tags.building === "dormitory") {
    out.add("dorm");
    out.add("campus");
  }
  // Add "lawrence-staple" for anything in downtown area
  if (out.size === 0) out.add("misc");
  return { tags: [...out], difficulty: 3 };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

// ── Step 1: query Overpass ──────────────────────────────────────────────────
async function fetchOverpass(): Promise<POI[]> {
  console.log("→ Querying Overpass API for Lawrence amenities…");
  const r = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "lawrence-geoguessr/0.1 (github.com/CalebMorse06/LawrenceGeo)",
      Accept: "application/json",
    },
    body: `data=${encodeURIComponent(overpassQuery)}`,
  });
  if (!r.ok) throw new Error(`Overpass failed: ${r.status} ${await r.text()}`);
  const json = (await r.json()) as { elements: OverpassElement[] };
  console.log(`   got ${json.elements.length} raw elements`);
  const pois: POI[] = [];
  for (const el of json.elements) {
    const tags = el.tags ?? {};
    const name = tags.name;
    if (!name) continue;
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (typeof lat !== "number" || typeof lon !== "number") continue;
    const primaryTag =
      tags.amenity ?? tags.shop ?? tags.leisure ?? tags.tourism ?? tags.historic ?? tags.building ?? "misc";
    pois.push({
      name,
      lat,
      lng: lon,
      primaryTag,
      tags,
      osmId: `${el.type}/${el.id}`,
    });
  }
  console.log(`   ${pois.length} named with coords`);
  return pois;
}

// ── Step 2: dedupe (same name within 30m) ──────────────────────────────────
function metersBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function dedupe(pois: POI[]): POI[] {
  const out: POI[] = [];
  for (const p of pois) {
    // Same name within 250m is almost always the same place (e.g., the four
    // Jayhawker Towers buildings, a complex with multiple OSM nodes).
    const sameName = out.find(
      (q) => q.name.toLowerCase() === p.name.toLowerCase() && metersBetween(q, p) < 250,
    );
    if (sameName) continue;
    // Different name but the exact same coordinates are usually OSM
    // duplicates from node vs. way.
    const sameSpot = out.find((q) => metersBetween(q, p) < 5);
    if (sameSpot) continue;
    out.push(p);
  }
  console.log(`   ${out.length} after dedupe`);
  return out;
}

// ── Step 3: validate Street View coverage ──────────────────────────────────
interface SVMeta {
  status: string;
  location?: { lat: number; lng: number };
  pano_id?: string;
}

async function streetViewMeta(lat: number, lng: number): Promise<SVMeta> {
  const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&radius=150&source=outdoor&key=${GMAPS_KEY}`;
  const r = await fetch(url);
  return (await r.json()) as SVMeta;
}

async function validate(pois: POI[]): Promise<(POI & { snappedLat: number; snappedLng: number })[]> {
  console.log("→ Validating Street View coverage…");
  const out: (POI & { snappedLat: number; snappedLng: number })[] = [];
  let i = 0;
  for (const p of pois) {
    i += 1;
    if (i % 25 === 0) console.log(`   …${i}/${pois.length}`);
    try {
      const meta = await streetViewMeta(p.lat, p.lng);
      if (meta.status === "OK" && meta.location) {
        out.push({ ...p, snappedLat: meta.location.lat, snappedLng: meta.location.lng });
      }
    } catch {
      /* skip */
    }
    // Be polite to the API even though metadata is free.
    if (i % 50 === 0) await new Promise((r) => setTimeout(r, 250));
  }
  console.log(`   ${out.length} have Street View coverage`);
  return out;
}

// ── Step 4: write TS module ─────────────────────────────────────────────────
function writeTS(items: (POI & { snappedLat: number; snappedLng: number })[]) {
  const usedIds = new Set<string>();
  const entries = items.map((p) => {
    let id = slugify(p.name);
    if (!id) id = `osm-${p.osmId.replace(/\//g, "-")}`;
    let base = id;
    let n = 1;
    while (usedIds.has(id)) {
      n += 1;
      id = `${base}-${n}`;
    }
    usedIds.add(id);
    const { tags, difficulty } = categorize(p.tags, p.name);
    return {
      id,
      name: p.name,
      lat: Number(p.snappedLat.toFixed(6)),
      lng: Number(p.snappedLng.toFixed(6)),
      difficulty,
      tags,
      primaryTag: p.primaryTag,
      osmId: p.osmId,
    };
  });

  entries.sort((a, b) => a.id.localeCompare(b.id));

  const body = entries
    .map(
      (e) =>
        `  // ${e.primaryTag} · osm:${e.osmId}\n  sv(${JSON.stringify(e.id)}, ${JSON.stringify(
          e.name,
        )}, ${e.lat}, ${e.lng}, ${e.difficulty}, ${JSON.stringify(e.tags)}),`,
    )
    .join("\n");

  const ts = `// Auto-generated by scripts/fetch-osm-locations.ts on ${new Date().toISOString().slice(0, 10)}.
// ${entries.length} locations pulled from OpenStreetMap and verified against
// Google Street View. Do not hand-edit — re-run the script to refresh.

import type { GameLocation } from "./types";

function sv(
  id: string,
  name: string,
  lat: number,
  lng: number,
  difficulty: 1 | 2 | 3,
  tags: string[],
): GameLocation {
  return {
    id,
    name,
    lat,
    lng,
    type: "streetview",
    streetviewPanoId: null,
    panoStoragePath: null,
    photoStoragePaths: null,
    difficulty,
    tags,
  };
}

export const GENERATED_LOCATIONS: GameLocation[] = [
${body}
];
`;
  fs.writeFileSync("lib/generatedLocations.ts", ts);
  console.log(`→ wrote lib/generatedLocations.ts (${entries.length} entries)`);
}

// ── Run ─────────────────────────────────────────────────────────────────────
async function main() {
  const raw = await fetchOverpass();
  const deduped = dedupe(raw);
  const validated = await validate(deduped);
  writeTS(validated);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
