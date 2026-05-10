import type { GameLocation } from "./types";
import { VIBE_LOCATIONS } from "./vibeLocations";
import { CURATED_LOCATIONS } from "./curatedLocations";

// The pool the game picks from. Curated = OSM-sourced, quality-scored, with
// noise (banks, chain hotels, anonymous churches) filtered out. Vibe = my
// hand-typed conceptual spots (Mass St blocks, intersections).
//
// The full 600+ OSM set lives in `extendedLocations.ts` for a future
// "hardcore" mode.
//
// Refresh:
//   npm run fetch-locations   (re-pull OSM + revalidate Street View)
//   npx tsx scripts/curate-locations.ts   (re-score + repartition)

const byId = new Map<string, GameLocation>();
for (const loc of [...VIBE_LOCATIONS, ...CURATED_LOCATIONS]) {
  if (!byId.has(loc.id)) byId.set(loc.id, loc);
}

export const DEMO_LOCATIONS: GameLocation[] = [...byId.values()];
