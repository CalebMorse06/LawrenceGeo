# Fork this for your town

The whole repo is set up so you can re-skin it for any town with reasonable
Street View coverage. The Lawrence-specific stuff is all in a handful of
files — change those, regenerate the location pipeline, and you have a
working game for somewhere else.

This doc is the full walkthrough. Budget 2–4 hours if you've shipped a
Next.js app before; longer if you haven't.

---

## Prerequisites

- Node 22+ (we use Node 25)
- Comfort editing TypeScript / running a few CLI commands
- Free accounts for: **Google Cloud** (Maps + Street View), **Mapbox**,
  **Supabase**, **Vercel** (optional but recommended for hosting)

**Cost expectations:** all four services have free tiers that cover a
hobby-scale town game indefinitely. Realistic monthly cost: **$0**.

---

## Step 0 — Fork & install

```bash
# On GitHub, click "Fork" on the LawrenceGeo repo, then:
git clone https://github.com/YOUR_HANDLE/YOUR_FORK.git my-town-geo
cd my-town-geo
npm install
cp .env.local.example .env.local
```

---

## Step 1 — Get the four API keys

### 1a. Mapbox

1. Sign up at <https://account.mapbox.com/>
2. **Tokens** → create a token (or use the default public token)
3. Under **URL restrictions**, add:
   - `http://localhost:3000/*`
   - your future production domain (e.g., `https://*.vercel.app/*`)
4. Copy the token into `.env.local` as `NEXT_PUBLIC_MAPBOX_TOKEN`

### 1b. Google Maps

1. Go to <https://console.cloud.google.com/>
2. Create a project (e.g., "my-town-geo")
3. **APIs & Services → Enable APIs** → enable:
   - Maps JavaScript API
   - Street View Static API (for the script that validates locations)
4. **Credentials → Create credentials → API key**
5. **Application restrictions → HTTP referrers** — add the same allowlist
   as Mapbox
6. **API restrictions** — restrict to the two APIs above
7. Copy into `.env.local` as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

Google gives you $200/mo of Maps credit free, which is way more than a
hobby game burns. But **restrict the key** — an unrestricted key in
client-side JS is a billing emergency waiting to happen.

### 1c. Supabase

1. Sign up at <https://supabase.com/>
2. Create a new project (anywhere; the $0 tier is fine)
3. Wait ~2 min for it to provision
4. **Project Settings → API** — copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **`anon` `public` key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Don't copy the `service_role` key into `.env.local`** unless you're
running the local seed scripts. Never deploy it anywhere public.

---

## Step 2 — Pick a bounding box for your town

The OSM fetch script grabs every tagged amenity inside a lat/lng box.
You need that box.

1. Go to <https://bboxfinder.com>
2. Search for your town
3. Draw a rectangle around the area you want to include
4. Note the four numbers in the format **south, west, north, east**

Lawrence's box for reference:
```
south: 38.91   west: -95.34   north: 39.03   east: -95.16
```

Open `scripts/fetch-osm-locations.ts` and update `BBOX` to your numbers:

```ts
const BBOX = { south: 40.79, west: -73.97, north: 40.85, east: -73.91 }; // Harlem
```

Keep the box tight — including a big metro area pulls thousands of POIs
you don't want.

---

## Step 3 — Tune the curation heuristic for your town

This is the **most important step.** The location pool quality is what
makes the game feel like it's *yours* instead of a generic OSM dump.

Open `scripts/curate-locations.ts`. Two lists to edit:

### 3a. Famous keywords (`FAMOUS_KEYWORDS`)

Regex matches against location names. Locations matching a famous keyword
get a big score bonus and become the iconic round picks.

For Lawrence, this is "allen fieldhouse", "memorial stadium", "free state
brewing", etc.

For YOUR town, replace these with the local equivalents — landmarks,
iconic bars, the main quad, the stadium, the historic hotel, every
dorm-name people know.

```ts
const FAMOUS_KEYWORDS: { re: RegExp; bonus: number }[] = [
  { re: /\bmemorial union\b/i, bonus: 12 }, // every state school has one
  { re: /\bstate street\b/i, bonus: 12 },   // Madison's Mass St
  { re: /\bcamp randall\b/i, bonus: 12 },   // UW football
  { re: /\bbabcock\b/i, bonus: 9 },         // UW ice cream
  // ... your town's icons
];
```

Bias high (`bonus: 10–12`) for things every alum/local knows. Bias
medium (`5–8`) for second-tier landmarks. Don't add things nobody
recognizes — that's what the bottom of the pool is for.

### 3b. Chain penalties (`CHAIN_KEYWORDS`, `CHAIN_HOTEL_KEYWORDS`)

The defaults filter out McDonald's, Walgreens, Holiday Inn Express, etc.
Probably don't need to change these unless your town has a famous local
location of a chain (e.g., the first-ever Subway in Bridgeport, CT).

---

## Step 4 — Run the location pipeline

```bash
# Step 4a: pull every tagged POI inside your bbox from OpenStreetMap,
# validate each one has Google Street View coverage, write to lib/generatedLocations.ts
npm run fetch-locations

# Step 4b: score every entry, keep the top ~150, write the rest to extended
npx tsx scripts/curate-locations.ts
```

Watch the script output. You'll see:

```
→ scored 589 OSM entries  (positives: 240)
→ keeping top 128 + 22 vibe = 150
→ extended pool: 461

── Top 15 kept ──
  24    Liberty Hall
  23    Allen Fieldhouse
  ...
── Bottom 10 kept ──
  ...
── First 10 dropped ──
  ...
```

**Read the "top 15 kept" list.** If your local icons aren't at the top,
tune `FAMOUS_KEYWORDS` and re-run. This is the single most important
calibration step. Iterate until you'd be proud to ship that top-15 list.

**Read the "bottom 10 kept" list.** These are the borderline rounds —
make sure none of them are anonymous-feeling junk (random Holiday Inn,
unnamed church). If they are, add the matching pattern to chain
penalties or just delete the line from `lib/curatedLocations.ts`
manually.

---

## Step 5 — Add your "vibe" entries

OSM doesn't tag conceptual things — generic street blocks, intersections,
hill summits, the bridge over the river. Hand-type those in
`lib/vibeLocations.ts`.

For Lawrence we have:
- Mass St block by block (600–1100)
- Key intersections (23rd & Iowa, 6th & Mass)
- The Hill summit, Wescoe Beach, Daisy Hill overlook
- Both bridges over the Kaw
- A handful of bars OSM missed (Bullwinkle's, Wagon Wheel, Yacht Club)

For your town add the equivalents — main drag block-by-block, named
intersections people use as landmarks, scenic overlooks, anything your
locals navigate by.

Each entry is:

```ts
sv("vibe-state-street-300", "State St, 300 block", 43.0742, -89.3949, 2, ["state-st", "downtown"]),
```

Arguments: `id`, `name`, `lat`, `lng`, `difficulty (1|2|3)`, `tags`.

---

## Step 6 — Re-skin the visual identity

### 6a. Palette (`app/globals.css`)

Replace the KU crimson/blue with your school colors:

```css
:root {
  --crimson: #C5050C;          /* your school's primary */
  --crimson-deep: #9B0814;     /* darker shade for hover */
  --jayhawk-blue: #0079C1;     /* secondary accent */
  --jayhawk-blue-deep: #005A8F;
  /* leave the limestone/paper neutrals; they work for any town */
}
```

(You can keep the variable names `--crimson` etc. or rename them — the
Tailwind theme tokens at the top of the file reference them. Renaming
means updating every `text-crimson` / `bg-jayhawk` in the components.)

### 6b. Wordmark (`components/Wordmark.tsx`)

```tsx
<span className="text-ink">Madison</span>
<span className="text-crimson">/</span>
<span className="text-jayhawk-deep">Geo</span>
```

### 6c. Landing copy (`app/page.tsx`)

The tagline, the eyebrow, the footer, the FEATURED pill list — all
Lawrence-specific. Rewrite for your town. Keep it short.

### 6d. Score-tier labels (`lib/scoring.ts`)

The badge labels (`Townie`, `Bona fide alum`, etc.) and the tier
thresholds. Pick names that mean something to your audience:

```ts
export const SCORE_TIERS: ScoreTier[] = [
  { threshold: 21000, label: "Local",         blurb: "avg ~100m per round" },
  { threshold: 17000, label: "Real Madisonian", blurb: "avg ~200m per round" },
  { threshold: 12000, label: "Knows the Capitol Square", blurb: "avg ~350m per round" },
  { threshold:  7000, label: "Tourist",       blurb: "avg ~600m per round" },
  { threshold:     0, label: "From Milwaukee", blurb: "you got lost on the beltline" },
];
```

The thresholds work for any town since the score curve is geographic-
distance-based and your bbox dictates how spread-out plays can get.

### 6e. Map anchor polygon (`components/GuessMap.tsx`)

The KU campus crimson polygon + the Mass St line are orientation aids.
Replace with your town's anchors:

```ts
// Your campus / town center polygon coordinates (clockwise, [lng, lat])
coordinates: [
  [-89.4140, 43.0772],
  [-89.3960, 43.0772],
  // ... drag the polygon shape from bboxfinder.com or similar
],

// Main drag line endpoints
coordinates: [
  [-89.3957, 43.0738],  // State St south end (Capitol)
  [-89.4081, 43.0760],  // State St north end (campus)
],
```

### 6f. Daily challenge timezone (`lib/daily.ts`)

If your town isn't in Central Time, change `"America/Chicago"` to your
timezone (`"America/New_York"`, `"America/Los_Angeles"`, etc.). This
controls what "today" means for the daily challenge.

### 6g. Game map bounds (`components/GuessMap.tsx:LAWRENCE_BOUNDS`)

Update the bbox so users can only place pins inside your town:

```ts
const LAWRENCE_BOUNDS: [[number, number], [number, number]] = [
  [-89.50, 43.04],  // SW corner [lng, lat]
  [-89.32, 43.13],  // NE corner [lng, lat]
];
```

(Rename the constant too if you want — search-and-replace
`LAWRENCE_BOUNDS` → `MADISON_BOUNDS`.)

### 6h. Map center (`lib/scoring.ts:LAWRENCE_CENTER`)

Where the map opens by default. Pick your town's downtown:

```ts
export const LAWRENCE_CENTER: LatLng = { lat: 43.0742, lng: -89.3849 };
```

---

## Step 7 — Generate + apply migrations

The `submit_game()` Postgres function needs to know every valid location,
so we generate migration 0005 from your final location pool:

```bash
npx tsx scripts/build-lock-migration.ts
```

That writes `supabase/migrations/0005_lock_submissions.sql`. Apply all
five migrations in order:

### Option A — Supabase SQL Editor (simplest)

1. Open your project's dashboard → **SQL Editor**
2. Paste `supabase/migrations/0001_locations.sql`, run
3. Repeat for `0002`, `0003`, `0004`, `0005` in order
4. After 0005, verify with `select count(*) from public.locations;` — should
   be ≥ your curated count

### Option B — Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_REF
supabase db push
```

### Option C — Claude Code + Supabase MCP

If you're using Claude Code:

```bash
claude mcp add --scope project --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=YOUR_REF"
claude
# inside Claude Code:
/mcp   # pick supabase, authenticate
# then ask:
# "Apply the five migrations in supabase/migrations/ in order"
```

---

## Step 8 — Local smoke test

```bash
npm run dev
```

Open <http://localhost:3000>:

1. Landing renders with your colors + wordmark
2. Click **Today's daily**
3. Play five rounds — each should pull a Street View pano from your town
4. End screen: pick a nickname → Save → should succeed
5. Visit `/leaderboard` — your row should appear

If save throws an error, the migration didn't apply. If the Street View
pane shows "No Street View imagery near this point" repeatedly, your bbox
is too aggressive or your town's SV coverage is patchy.

---

## Step 9 — Deploy to Vercel

1. Push your fork to GitHub
2. Go to <https://vercel.com/new>
3. Import your repo
4. Add the four `NEXT_PUBLIC_*` env vars (Vercel accepts pasting the env
   file content directly)
5. **Apply to Production, Preview, and Development environments**
6. Click Deploy
7. Once it deploys, **go back and restrict your API keys** to include
   `https://YOUR-PROJECT.vercel.app/*`

---

## Step 10 — Make it sing

Things that take you from "works" to "people share it":

- **Post a screenshot** of your top-15 location list as a teaser
- **Set a target score** for a public bounty — 22,000 is the sweet spot
  (real challenge, doable for a local)
- **Tag a few specific friends** in your post so the leaderboard starts
  populating
- **Watch your daily leaderboard** in the first 24h and add anyone who
  hits an absurd score to a "hall of fame" pin

---

## Stuck?

- Check the Issues tab on the original repo — common questions
- The dev workflow is built around AI coding agents — see
  [`docs/BUILDING_THIS.md`](BUILDING_THIS.md) for how to use Claude Code
  to help you customize
- The `AGENTS.md` in the repo root is the working-notes file for AI
  agents working on this codebase; if you're using Claude Code or
  Cursor, it'll get picked up automatically
