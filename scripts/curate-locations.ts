/**
 * Reads lib/generatedLocations.ts + lib/vibeLocations.ts, scores every entry
 * with a Lawrence-aware quality heuristic, and writes:
 *   - lib/curatedLocations.ts   ← top ~150, the actual game pool
 *   - lib/extendedLocations.ts  ← the rest, kept around for a hardcore mode
 *
 * Re-run anytime to retune the heuristic.
 *
 * Run:
 *   npx tsx scripts/curate-locations.ts [--keep=N]
 */
import fs from "node:fs";
import { GENERATED_LOCATIONS } from "../lib/generatedLocations";
import { VIBE_LOCATIONS } from "../lib/vibeLocations";
import type { GameLocation } from "../lib/types";

const argKeep = process.argv.find((a) => a.startsWith("--keep="));
const TARGET_KEEP = argKeep ? parseInt(argKeep.split("=")[1], 10) : 150;

// ── Scoring heuristic ───────────────────────────────────────────────────────
// Tuned for: an alum or longtime Lawrence person should recognize the spot,
// or at minimum say "oh yeah, I know roughly where that is."

const FAMOUS_KEYWORDS: { re: RegExp; bonus: number }[] = [
  // Tier S — instant recognition
  { re: /\ballen fieldhouse\b/i, bonus: 12 },
  { re: /\bmemorial stadium\b/i, bonus: 12 },
  { re: /\bcampanile\b/i, bonus: 12 },
  { re: /\bliberty hall\b/i, bonus: 12 },
  { re: /\bfree state brewing\b/i, bonus: 12 },
  { re: /\bthe granada\b/i, bonus: 12 },
  { re: /\bbottleneck\b/i, bonus: 12 },
  { re: /\beldridge\b/i, bonus: 12 },
  { re: /\bthe oread\b/i, bonus: 12 },
  { re: /\bjohnny'?s tavern\b/i, bonus: 12 },
  { re: /\bbowersock\b/i, bonus: 12 },
  { re: /\bwatkins museum\b/i, bonus: 10 },
  { re: /\blawrence public library\b/i, bonus: 10 },
  { re: /\blied center\b/i, bonus: 10 },
  { re: /\bspencer (museum|research)\b/i, bonus: 10 },
  { re: /\bkansas (memorial )?union\b/i, bonus: 10 },
  { re: /\bwatson library\b/i, bonus: 10 },
  { re: /\banschutz library\b/i, bonus: 10 },

  // Tier A — well-known to anyone in town
  { re: /\bthe hawk\b/i, bonus: 10 },
  { re: /\bbullwinkle/i, bonus: 10 },
  { re: /\bsandbar\b/i, bonus: 10 },
  { re: /\breplay\b/i, bonus: 10 },
  { re: /\bbourgeois pig\b/i, bonus: 10 },
  { re: /\bburger stand\b/i, bonus: 10 },
  { re: /\bcasbah\b/i, bonus: 8 },
  { re: /\bwonder fair\b/i, bonus: 10 },
  { re: /\blove garden\b/i, bonus: 10 },
  { re: /\bwheatfields\b/i, bonus: 10 },
  { re: /\bmerchants pub\b/i, bonus: 10 },
  { re: /\bquinton'?s\b/i, bonus: 10 },
  { re: /\b715\b/i, bonus: 8 },
  { re: /\bla prima tazza\b/i, bonus: 8 },
  { re: /\bhenry'?s\b/i, bonus: 8 },
  { re: /\bjefferson'?s\b/i, bonus: 8 },
  { re: /\bpachamama'?s\b/i, bonus: 8 },
  { re: /\bdempsey'?s\b/i, bonus: 7 },
  { re: /\blocal burger\b/i, bonus: 7 },
  { re: /\blimestone\b/i, bonus: 7 },
  { re: /\bsalty iguana\b/i, bonus: 7 },
  { re: /\blawrence arts center\b/i, bonus: 9 },
  { re: /\bsanta fe depot\b/i, bonus: 9 },
  { re: /\bjayhawker towers\b/i, bonus: 9 },

  // Sports + recreation
  { re: /\bhoglund\b/i, bonus: 9 },
  { re: /\brock chalk park\b/i, bonus: 9 },
  { re: /\banderson family\b/i, bonus: 8 },
  { re: /\bambler/i, bonus: 8 },

  // Schools
  { re: /\blawrence high\b/i, bonus: 9 },
  { re: /\bfree state high\b/i, bonus: 9 },
  { re: /\bbishop seabury\b/i, bonus: 8 },

  // Grocery / shopping anchors
  { re: /\bhy-?vee\b/i, bonus: 7 },
  { re: /\bdillons\b/i, bonus: 7 },
  { re: /\bthe merc\b/i, bonus: 7 },
  { re: /\bcheckers\b/i, bonus: 7 },

  // KU named halls (alums spent semesters here)
  { re: /\bstrong hall\b/i, bonus: 9 },
  { re: /\bwescoe\b/i, bonus: 9 },
  { re: /\bsnow hall\b/i, bonus: 8 },
  { re: /\bmarvin hall\b/i, bonus: 8 },
  { re: /\blippincott\b/i, bonus: 7 },
  { re: /\bbudig\b/i, bonus: 8 },
  { re: /\bblake hall\b/i, bonus: 7 },
  { re: /\bbailey hall\b/i, bonus: 7 },
  { re: /\blindley\b/i, bonus: 7 },
  { re: /\beaton hall\b/i, bonus: 7 },
  { re: /\bsummerfield\b/i, bonus: 7 },
  { re: /\brobinson center\b/i, bonus: 8 },
  { re: /\bdole institute\b/i, bonus: 9 },
  { re: /\bself hall\b/i, bonus: 7 },
  { re: /\bcapitol federal hall\b/i, bonus: 8 },
  { re: /\badams alumni\b/i, bonus: 8 },
  { re: /\bburge union\b/i, bonus: 8 },

  // Dorms / scholarship halls
  { re: /\bnaismith hall\b/i, bonus: 8 },
  { re: /\bhashinger\b/i, bonus: 8 },
  { re: /\btemplin\b/i, bonus: 8 },
  { re: /\boliver hall\b/i, bonus: 8 },
  { re: /\bellsworth\b/i, bonus: 8 },
  { re: /\blewis hall\b/i, bonus: 8 },
  { re: /\bgsp\b|\bgertrude\b/i, bonus: 7 },
  { re: /\bcorbin\b/i, bonus: 7 },
  { re: /\bstouffer\b/i, bonus: 7 },
  { re: /\bdowns hall\b/i, bonus: 7 },
  { re: /\bbattenfeld\b/i, bonus: 7 },
  { re: /\bdouthart\b/i, bonus: 6 },
  { re: /\bsellards\b/i, bonus: 6 },
  { re: /\bmiller hall\b/i, bonus: 6 },
  { re: /\bpearson hall\b/i, bonus: 6 },
  { re: /\bstephenson\b/i, bonus: 6 },
];

const CHAIN_HOTEL_KEYWORDS: RegExp[] = [
  /\bholiday inn\b/i, /\bhampton inn\b/i, /\bcomfort inn\b/i,
  /\bbest western\b/i, /\bdays inn\b/i, /\bsuper 8\b/i,
  /\bquality inn\b/i, /\bhilton garden\b/i, /\bcourtyard\b/i,
  /\bla quinta\b/i, /\bbaymont\b/i, /\bramada\b/i,
  /\bspringhill suites\b/i, /\bextended stay\b/i, /\btownplace suites\b/i,
];

const CHAIN_KEYWORDS: RegExp[] = [
  /\bmcdonald'?s?\b/i, /\bburger king\b/i, /\bwendy'?s\b/i, /\btaco bell\b/i,
  /\bsubway\b/i, /\bkfc\b/i, /\bpizza hut\b/i, /\bdomino'?s\b/i,
  /\bchipotle\b/i, /\bchick-?fil-?a\b/i, /\bpanera\b/i, /\bstarbucks\b/i,
  /\bsonic\b/i, /\barby'?s\b/i, /\bhardee'?s\b/i, /\bdairy queen\b/i,
  /\bautozone\b/i, /\bo'reilly\b/i, /\bwalgreens\b/i, /\bcvs\b/i,
  /\brite aid\b/i, /\bdollar general\b/i, /\bdollar tree\b/i,
  /\bfamily dollar\b/i, /\bjiffy lube\b/i, /\bkwik shop\b/i,
  /\bcasey'?s\b/i, /\bphillips 66\b/i, /\bshell\b/i, /\bbp\b/i,
  /\bquiktrip\b/i, /\b7-eleven\b/i, /\bjimmy john'?s\b/i,
  /\bpapa john'?s\b/i, /\bsherwin/i, /\bjersey mike'?s\b/i,
  /\bfive guys\b/i, /\bblimpie\b/i, /\bpopeyes\b/i, /\bsmoothie king\b/i,
  /\bautozone\b/i,
];

function scoreFor(loc: GameLocation): number {
  const name = loc.name;
  let score = 0;

  // famous-name bonuses (largest signal)
  for (const f of FAMOUS_KEYWORDS) {
    if (f.re.test(name)) {
      score += f.bonus;
      break; // only the strongest match
    }
  }

  // chain penalty
  for (const c of CHAIN_KEYWORDS) {
    if (c.test(name)) {
      score -= 6;
      break;
    }
  }
  for (const c of CHAIN_HOTEL_KEYWORDS) {
    if (c.test(name)) {
      score -= 5;
      break;
    }
  }

  // Lawrence-specific name signals
  if (/\bscholarship hall\b/i.test(name)) score += 4;
  if (/\bresidence hall\b/i.test(name) || /\bhall$/i.test(name)) score += 1;
  if (/\bjayhawk/i.test(name)) score += 2;

  // category baseline (from tags we set in fetch script)
  const t = new Set(loc.tags);
  if (t.has("museum")) score += 4;
  if (t.has("statue")) score += 4;
  if (t.has("venue")) score += 4;
  if (t.has("sports") && t.has("campus")) score += 3;
  if (t.has("sports")) score += 2;
  if (t.has("hotel")) score += 2;
  if (t.has("bar")) score += 3;
  if (t.has("library")) score += 2;
  if (t.has("park")) score += 1;
  if (t.has("campus") && !t.has("dorm")) score += 1;
  if (t.has("dorm")) score += 2; // dorms are memorable to alums
  if (t.has("shopping")) score += 1;
  if (t.has("school")) score += 1;
  if (t.has("lawrence-staple")) score += 5;
  if (t.has("downtown") || t.has("mass-st")) score += 2;
  if (t.has("historic")) score += 2;

  // category penalty for noise
  if (t.has("church")) score -= 4;
  if (t.has("hospital")) score -= 2;

  // "The X" proper-noun heuristic — frequently Lawrence-specific
  if (/^the [A-Z]/.test(name)) score += 1;

  // restaurants/cafes are noisy unless famous; default to 0 contribution
  // but tiny boost for downtown spots
  if (t.has("restaurant") && (t.has("downtown") || t.has("mass-st"))) score += 1;
  if (t.has("cafe") && (t.has("downtown") || t.has("mass-st"))) score += 1;

  return score;
}

// ── Run ────────────────────────────────────────────────────────────────────
const allGenerated = GENERATED_LOCATIONS.slice();
const scored = allGenerated
  .map((loc) => ({ loc, score: scoreFor(loc) }))
  .sort((a, b) => b.score - a.score);

// keep all positives, then take top N until we hit TARGET_KEEP
const positiveCount = scored.filter((s) => s.score > 0).length;
const N = Math.min(TARGET_KEEP - VIBE_LOCATIONS.length, scored.length);
const keep = scored.slice(0, N);
const drop = scored.slice(N);

console.log(
  `→ scored ${scored.length} OSM entries  (positives: ${positiveCount})`,
);
console.log(`→ keeping top ${keep.length} + ${VIBE_LOCATIONS.length} vibe = ${keep.length + VIBE_LOCATIONS.length}`);
console.log(`→ extended pool: ${drop.length}`);

// ── Difficulty rebalance for curated pool ──────────────────────────────────
// The fetch script defaults difficulty to 3 for anything not famous. Now that
// we're keeping only the good stuff, redistribute: top 25% → 1, next 50% → 2,
// bottom 25% → 3.
const total = keep.length;
const easyEnd = Math.floor(total * 0.25);
const mediumEnd = Math.floor(total * 0.75);
function difficultyFor(rank: number): 1 | 2 | 3 {
  if (rank < easyEnd) return 1;
  if (rank < mediumEnd) return 2;
  return 3;
}

function serialize(name: string, list: GameLocation[]): string {
  const body = list
    .map((l) => {
      const tagsJson = JSON.stringify(l.tags);
      return `  sv(${JSON.stringify(l.id)}, ${JSON.stringify(l.name)}, ${l.lat}, ${l.lng}, ${l.difficulty}, ${tagsJson}),`;
    })
    .join("\n");
  return `// Auto-generated by scripts/curate-locations.ts on ${new Date().toISOString().slice(0, 10)}.
// ${list.length} locations.

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

export const ${name}: GameLocation[] = [
${body}
];
`;
}

const curated = keep.map(({ loc }, rank) => ({ ...loc, difficulty: difficultyFor(rank) }));
const extended = drop.map(({ loc }) => loc);

fs.writeFileSync("lib/curatedLocations.ts", serialize("CURATED_LOCATIONS", curated));
fs.writeFileSync("lib/extendedLocations.ts", serialize("EXTENDED_LOCATIONS", extended));

// print top + bottom of curated for inspection
console.log("\n── Top 15 kept ──");
for (const { loc, score } of keep.slice(0, 15)) console.log(`  ${score}\t${loc.name}`);
console.log("\n── Bottom 10 kept ──");
for (const { loc, score } of keep.slice(-10)) console.log(`  ${score}\t${loc.name}`);
console.log("\n── First 10 dropped ──");
for (const { loc, score } of drop.slice(0, 10)) console.log(`  ${score}\t${loc.name}`);

console.log("\n✓ wrote lib/curatedLocations.ts + lib/extendedLocations.ts");
