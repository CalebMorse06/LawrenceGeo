import type { GameLocation } from "./types";

// Placeholder locations so the game is playable before Supabase is wired up.
// Replace with `fetchActiveLocations()` once the database is seeded.
//
// To add a real Street View location: open Google Street View in the browser,
// pull the `!1s<PANO_ID>!` segment out of the URL, and paste below.

export const DEMO_LOCATIONS: GameLocation[] = [
  {
    id: "demo-1",
    name: "Allen Fieldhouse (north entrance)",
    lat: 38.9542,
    lng: -95.2526,
    type: "photos",
    streetviewPanoId: null,
    panoStoragePath: null,
    photoStoragePaths: [
      "https://images.unsplash.com/photo-1518443855757-dfadac7101ae?w=1600",
    ],
    difficulty: 1,
    tags: ["campus", "ku"],
  },
  {
    id: "demo-2",
    name: "Massachusetts St (800 block)",
    lat: 38.9711,
    lng: -95.2353,
    type: "photos",
    streetviewPanoId: null,
    panoStoragePath: null,
    photoStoragePaths: [
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600",
    ],
    difficulty: 2,
    tags: ["downtown"],
  },
  {
    id: "demo-3",
    name: "Memorial Stadium",
    lat: 38.9633,
    lng: -95.2454,
    type: "photos",
    streetviewPanoId: null,
    panoStoragePath: null,
    photoStoragePaths: [
      "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=1600",
    ],
    difficulty: 2,
    tags: ["campus", "ku"],
  },
  {
    id: "demo-4",
    name: "South Park gazebo",
    lat: 38.9651,
    lng: -95.2356,
    type: "photos",
    streetviewPanoId: null,
    panoStoragePath: null,
    photoStoragePaths: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600",
    ],
    difficulty: 3,
    tags: ["downtown"],
  },
  {
    id: "demo-5",
    name: "The Oread (KU campus hotel)",
    lat: 38.9583,
    lng: -95.2436,
    type: "photos",
    streetviewPanoId: null,
    panoStoragePath: null,
    photoStoragePaths: [
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1600",
    ],
    difficulty: 2,
    tags: ["campus"],
  },
];
