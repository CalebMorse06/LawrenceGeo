import type { GameLocation } from "./types";

// Hand-curated "vibe" locations — conceptual spots that aren't OSM POIs:
// generic Mass St blocks, intersections, summits, the bridges. These live
// alongside the OSM-generated set in lib/generatedLocations.ts.

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

export const VIBE_LOCATIONS: GameLocation[] = [
  // ── Mass St — block by block ────────────────────────────────────────
  sv("vibe-mass-600", "Mass St, 600 block", 38.9692, -95.2353, 2, ["mass-st", "downtown"]),
  sv("vibe-mass-700", "Mass St, 700 block", 38.9704, -95.2353, 2, ["mass-st", "downtown"]),
  sv("vibe-mass-800", "Mass St, 800 block", 38.9712, -95.2353, 2, ["mass-st", "downtown"]),
  sv("vibe-mass-900", "Mass St, 900 block", 38.9720, -95.2353, 2, ["mass-st", "downtown"]),
  sv("vibe-mass-1000", "Mass St, 1000 block", 38.9728, -95.2353, 2, ["mass-st", "downtown"]),
  sv("vibe-mass-1100", "Mass St, 1100 block", 38.9736, -95.2353, 3, ["mass-st", "downtown"]),

  // ── Key intersections ───────────────────────────────────────────────
  sv("vibe-23rd-iowa", "23rd & Iowa", 38.9417, -95.2496, 2, ["23rd-st", "lawrence-staple"]),
  sv("vibe-23rd-louisiana", "23rd & Louisiana", 38.9420, -95.2438, 3, ["23rd-st"]),
  sv("vibe-23rd-naismith", "23rd & Naismith", 38.9418, -95.2526, 3, ["23rd-st"]),
  sv("vibe-23rd-mass", "23rd & Mass", 38.9418, -95.2357, 3, ["23rd-st"]),
  sv("vibe-6th-iowa", "6th & Iowa", 38.9712, -95.2496, 2, ["6th-st"]),
  sv("vibe-6th-wakarusa", "6th & Wakarusa", 38.9719, -95.3083, 3, ["6th-st", "west-lawrence"]),
  sv("vibe-6th-mass", "6th & Mass", 38.9696, -95.2353, 2, ["6th-st", "downtown"]),
  sv("vibe-9th-mass", "9th & Mass", 38.9720, -95.2353, 2, ["mass-st", "downtown"]),
  sv("vibe-11th-mass", "11th & Mass", 38.9736, -95.2353, 3, ["mass-st", "downtown"]),
  sv("vibe-bob-billings", "Bob Billings & Kasold roundabout", 38.9577, -95.2752, 3, ["west-lawrence"]),

  // ── Conceptual / non-POI ────────────────────────────────────────────
  sv("vibe-hill-summit", "Mt. Oread summit (The Hill)", 38.9577, -95.2487, 3, ["campus"]),
  sv("vibe-wescoe-beach", "Wescoe Beach", 38.9577, -95.2470, 2, ["campus"]),
  sv("vibe-jayhawk-blvd", "Jayhawk Blvd, mid-campus", 38.9582, -95.2470, 2, ["campus"]),
  sv("vibe-daisy-hill", "Daisy Hill (overlook)", 38.9618, -95.2519, 2, ["campus", "dorm"]),

  // ── Bridges ─────────────────────────────────────────────────────────
  sv("vibe-mass-bridge", "Mass St bridge over the Kaw", 38.9772, -95.2353, 2, ["downtown"]),
  sv("vibe-iowa-bridge", "Iowa St bridge over the Kaw", 38.9783, -95.2497, 3, ["north-lawrence"]),

  // ── Hand-typed real spots that OSM doesn't tag yet ─────────────────
  sv("vibe-bullwinkles", "Bullwinkle's (1344 Tennessee)", 38.9582, -95.2412, 1, ["bar", "campus", "lawrence-staple"]),
  sv("vibe-wagon-wheel", "The Wagon Wheel Cafe (507 W 14th)", 38.9555, -95.2480, 2, ["bar", "campus"]),
  sv("vibe-yacht-club", "The Yacht Club (530 Wisconsin)", 38.9695, -95.2393, 2, ["bar", "downtown"]),
  sv("vibe-slow-ride", "Slow Ride Roadhouse", 38.9420, -95.2493, 3, ["bar", "23rd-st"]),
  sv("vibe-wonder-fair", "Wonder Fair (803 1/2 Mass)", 38.9712, -95.2353, 2, ["mass-st", "niche"]),
  sv("vibe-wheatfields", "Wheatfields Bakery & Cafe (904 Vermont)", 38.9720, -95.2370, 2, ["downtown", "lawrence-staple"]),
  sv("vibe-bowersock", "Bowersock Dam", 38.9762, -95.2333, 1, ["downtown", "lawrence-staple"]),
  sv("vibe-hyvee-6th", "Hy-Vee (4000 W 6th)", 38.9719, -95.2792, 2, ["6th-st", "shopping"]),
  sv("vibe-hyvee-clinton", "Hy-Vee (3504 Clinton Pkwy)", 38.9450, -95.2640, 2, ["shopping"]),
  sv("vibe-dillons-23rd", "Dillons (23rd & Louisiana)", 38.9420, -95.2438, 3, ["23rd-st", "shopping"]),
  sv("vibe-dillons-6th", "Dillons (6th & Monterey Way)", 38.9714, -95.2615, 3, ["6th-st", "shopping"]),
  sv("vibe-lawrence-high", "Lawrence High School (1901 Louisiana)", 38.9494, -95.2437, 2, ["school", "lawrence-staple"]),
  sv("vibe-tellers", "Tellers Restaurant (746 Mass)", 38.9709, -95.2353, 2, ["mass-st"]),
  sv("vibe-quintons", "Quinton's Bar & Deli (615 Mass)", 38.9695, -95.2353, 2, ["mass-st", "bar"]),
  sv("vibe-23rd-brewery", "23rd Street Brewery (3512 Clinton Pkwy)", 38.9450, -95.2620, 2, ["bar", "23rd-st"]),
  sv("vibe-henrys", "Henry's Coffee Shop (downtown)", 38.9712, -95.2354, 2, ["downtown"]),
  sv("vibe-the-merc", "The Merc Co-op (downtown)", 38.9686, -95.2380, 2, ["downtown", "shopping"]),

  // ── The Hawk — KU's iconic dive bar ──────────────────────────────────
  sv("vibe-the-hawk", "The Hawk (1340 Ohio)", 38.9582, -95.2440, 1, ["bar", "campus", "lawrence-staple"]),

  // ── Logies (Mass St) — placeholder; confirm exact spot ──────────────
  // TODO: replace with the real address + name. SV will snap to the
  // nearest pano within 150m.
  sv("vibe-logies", "Logies (Mass St)", 38.9720, -95.2353, 2, ["mass-st", "bar"]),

  // ── Greek Row on Tennessee St ───────────────────────────────────────
  // Coords are approximate by block; SV will snap. Houses move/swap
  // chapters every few years so confirm whoever's there now.
  sv("vibe-frat-sae", "Sigma Alpha Epsilon (1301 Tennessee)", 38.9585, -95.2412, 3, ["greek", "campus", "tennessee-st"]),
  sv("vibe-frat-lambda-chi", "Lambda Chi Alpha (1340 Tennessee)", 38.9582, -95.2412, 3, ["greek", "campus", "tennessee-st"]),
  sv("vibe-frat-pike", "Pi Kappa Alpha (1414 Tennessee)", 38.9576, -95.2412, 3, ["greek", "campus", "tennessee-st"]),
  sv("vibe-frat-beta", "Beta Theta Pi (1425 Tennessee)", 38.9575, -95.2412, 3, ["greek", "campus", "tennessee-st"]),
  sv("vibe-frat-sigma-chi", "Sigma Chi (1439 Tennessee)", 38.9573, -95.2412, 3, ["greek", "campus", "tennessee-st"]),
  sv("vibe-frat-sigma-nu", "Sigma Nu (1501 Tennessee)", 38.9568, -95.2412, 3, ["greek", "campus", "tennessee-st"]),
  sv("vibe-frat-theta-chi", "Theta Chi (1502 Tennessee)", 38.9568, -95.2412, 3, ["greek", "campus", "tennessee-st"]),
  sv("vibe-frat-fiji", "Phi Gamma Delta — FIJI (1545 Tennessee)", 38.9564, -95.2412, 3, ["greek", "campus", "tennessee-st"]),
  sv("vibe-frat-sigep", "Sigma Phi Epsilon (1645 Tennessee)", 38.9555, -95.2412, 3, ["greek", "campus", "tennessee-st"]),
  sv("vibe-frat-phi-delt", "Phi Delta Theta (1621 Edgehill)", 38.9558, -95.2403, 3, ["greek", "campus"]),
  sv("vibe-frat-phi-psi", "Phi Kappa Psi (1100 Indiana)", 38.9602, -95.2454, 3, ["greek", "campus"]),
  sv("vibe-frat-du", "Delta Upsilon (1025 Mississippi)", 38.9608, -95.2418, 3, ["greek", "campus"]),
  sv("vibe-frat-delt", "Delta Tau Delta (1111 W 11th)", 38.9600, -95.2470, 3, ["greek", "campus"]),

  // ── Other staples OSM missed (in addition to ones above) ────────────
  sv("vibe-decade", "Decade Coffee (920 Mass)", 38.9720, -95.2353, 3, ["mass-st", "cafe"]),
  sv("vibe-cottins", "Cottin's Hardware (1832 Mass)", 38.9550, -95.2353, 3, ["mass-st", "lawrence-staple"]),
  sv("vibe-dempseys", "Dempsey's Burger Pub (623 Vermont)", 38.9697, -95.2370, 3, ["downtown", "bar"]),
  sv("vibe-mirth", "Mirth Cafe (745 New Hampshire)", 38.9708, -95.2342, 3, ["downtown", "cafe"]),
  sv("vibe-maceli", "Maceli's Banquet Hall (1031 New Hampshire)", 38.9724, -95.2342, 3, ["downtown"]),
  sv("vibe-pachamama", "Pachamama's (800 New Hampshire)", 38.9711, -95.2342, 3, ["downtown"]),
  sv("vibe-wakarusa-brewing", "Wakarusa Brewing Co (west Lawrence)", 38.9446, -95.2790, 3, ["west-lawrence", "bar"]),
  sv("vibe-aimees", "Aimee's Coffeehouse (1025 Mass)", 38.9728, -95.2353, 3, ["mass-st", "cafe"]),
];
