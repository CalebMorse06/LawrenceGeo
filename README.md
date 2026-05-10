# Lawrence/Geo

A GeoGuessr-style guessing game scoped to one specific town — Lawrence, KS,
home of KU. Players see a Street View panorama from somewhere in town
(Mass St on a Saturday, a bar storefront, a Daisy Hill dorm), drop a pin
on a Lawrence map, and score on how close they got. Five rounds, share
the result, save your name to the leaderboard.

**Try the live version:** *(coming soon — Vercel URL goes here)*

---

## Why this exists

Two reasons:

1. **For the town.** It's a love letter — a thing you click during finals
   week and immediately spike "oh god, Bullwinkle's" / "wait, is that
   Daisy Hill?" Built so KU alums get transported back the second they
   open it.

2. **For other towns / schools.** This whole repo is intentionally
   structured so you can fork it and build the same thing for *your*
   town in a weekend. The README below + `docs/FORK_FOR_YOUR_TOWN.md`
   are the tutorial. ~2–4 hours if you've shipped a Next.js app before.

If you do build one, **send me the link** — I'll collect them and link
back from this repo so people can play each other's towns.

---

## Stack

- **Next.js 16** (App Router) + Tailwind CSS — UI + routing
- **Mapbox GL JS** — guess map with KU-tinted campus polygon + Mass St line
- **Google Street View JS API** — the panorama view, looked up by lat/lng
- **Pannellum** (CDN) — optional 360° interior panorama viewer (unused by
  default but supported in the schema for custom bar/restaurant interiors)
- **Supabase** — Postgres for locations + scores, anon-only RLS, a
  `SECURITY DEFINER` Postgres function (`submit_game`) that recomputes
  every score server-side so the leaderboard can't be cheated
- **OpenStreetMap Overpass API** — source for the bulk of the 167 location
  pool (every named bar, every KU building, every dorm — programmatically
  pulled and quality-scored, not hand-typed)
- **Vitest** — unit tests for the scoring math
- **Vercel** — hosting

Free tiers cover all of it for a single-town game.

---

## Quick start (run it locally)

```bash
git clone https://github.com/CalebMorse06/LawrenceGeo.git
cd LawrenceGeo
npm install
cp .env.local.example .env.local
# fill in the four NEXT_PUBLIC_* keys (see below)
npm run dev
```

Open <http://localhost:3000>.

### The four env keys you need

| Var | Where to get it | Free? |
| --- | --- | --- |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | <https://account.mapbox.com/access-tokens/> | Yes, ≤50k map loads/mo |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Cloud Console → Maps JavaScript API + Street View API | Yes, $200/mo credit |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same place | Yes |

**Before going to production**, restrict the Mapbox and Google keys by HTTP
referrer (just your dev + prod domains). Otherwise a leak is a real
problem. See `docs/FORK_FOR_YOUR_TOWN.md` for the exact restriction
patterns.

`SUPABASE_SERVICE_ROLE_KEY` is only used by local scripts (`seed-locations`)
that you probably won't run. Never deploy it anywhere public.

---

## Apply the database migrations

Five migrations in `supabase/migrations/` — apply them in order:

| # | What it does |
| --- | --- |
| `0001_locations.sql` | `locations` table + indexes |
| `0002_games.sql` | `games` table + leaderboard indexes |
| `0003_rls.sql` | RLS: public read, anonymous insert (later locked) |
| `0004_relax_streetview_pano.sql` | Lets streetview rows skip pano_id |
| `0005_lock_submissions.sql` | **Auto-generated.** Seeds every location, creates the `submit_game()` validator function, and revokes anonymous INSERT on games — only the function can write |

Apply them via Supabase Dashboard → SQL Editor (paste each in turn), or via
Supabase CLI (`supabase db push`), or via the Supabase MCP if you use
Claude Code (see `docs/FORK_FOR_YOUR_TOWN.md`).

Migration `0005` is regenerated whenever the location pool changes:

```bash
npx tsx scripts/build-lock-migration.ts
```

---

## Fork this for your town

The whole point. See **[`docs/FORK_FOR_YOUR_TOWN.md`](docs/FORK_FOR_YOUR_TOWN.md)**
for the full walkthrough. The short version:

1. **Pick a bounding box** for your town (find it on
   <https://bboxfinder.com> — draw a rectangle).
2. **Update `scripts/fetch-osm-locations.ts:BBOX`** to those coordinates.
3. **Update `scripts/curate-locations.ts:FAMOUS_KEYWORDS`** — the regex
   list of local landmarks that should rank high. This is the part that
   makes your version feel native instead of "OSM dump."
4. **Run the location pipeline:**
   ```bash
   npm run fetch-locations        # OSM → all amenities
   npx tsx scripts/curate-locations.ts  # score + keep top ~150
   npx tsx scripts/build-lock-migration.ts  # regenerate migration 0005
   ```
5. **Re-skin** — palette in `app/globals.css`, copy in `app/page.tsx`,
   wordmark in `components/Wordmark.tsx`, score-tier labels in
   `lib/scoring.ts`.
6. **Adjust the map** — `LAWRENCE_BOUNDS` and the KU campus anchor polygon
   in `components/GuessMap.tsx`.
7. **Apply migrations + deploy** to Vercel.

That's the whole thing. Detailed steps with code references in the docs.

---

## How it was built

Built in a single weekend, paired with [Claude Code](https://claude.com/claude-code)
as a coding partner. The interesting moves:

- Started in **plan mode** — wrote a one-page spec before any code.
- Used **OSM + Google Street View metadata** to pull locations
  programmatically (~600 verified) instead of hand-curating. Then a
  **quality scorer** kept the top 150 and dropped the noise (banks,
  generic fast-food, anonymous churches).
- Moved score validation **server-side** via a Postgres function so the
  leaderboard is tamper-proof — anyone can `curl` the public Supabase
  API but the function recomputes every score from the actual location
  coords and rejects discrepancies.

Full write-up in **[`docs/BUILDING_THIS.md`](docs/BUILDING_THIS.md)** —
the architectural moves and the dev-with-Claude workflow.

---

## Project layout

```
app/                       # Next.js App Router
  layout.tsx               # Fonts, metadata
  page.tsx                 # Landing
  play/page.tsx            # The game (corner mini-map UX)
  leaderboard/page.tsx     # Today / all-time, with score-tier reference
components/                # All client components
  GuessMap.tsx             # Mapbox with KU polygon + Mass St line
  PanoramaViewer.tsx       # Dispatcher: streetview / pano360 / photos
  StreetViewPane.tsx       # Google SV by lat/lng (no pano-ID hunting)
  Pano360Pane.tsx          # Pannellum, loaded from CDN
  PhotoCarousel.tsx        # Fallback for spots without SV
  ScoreCard.tsx            # End-of-game summary + share + save
  ShareCard.tsx            # Wordle-style emoji result
  LeaderboardSave.tsx      # Nickname input → submit_game RPC
  RoundResult.tsx          # Per-round reveal
  AnimatedNumber.tsx       # Score tick-up
  Wordmark.tsx             # The Lawrence/Geo type mark
lib/
  scoring.ts               # Haversine + score curve + SCORE_TIERS
  scoring.test.ts          # Vitest
  daily.ts                 # Date-seeded picker for daily mode
  types.ts                 # GameLocation, RoundResult, CompletedGame
  share.ts                 # Wordle string builder
  games.ts                 # submitGame() RPC client
  curatedLocations.ts      # ← Auto-generated: top ~150 from OSM
  generatedLocations.ts    # ← Auto-generated: raw 600 from OSM
  extendedLocations.ts     # ← Auto-generated: the rest, for a "hardcore" mode
  vibeLocations.ts         # ← Hand-typed: Mass St blocks, intersections, etc.
  demoLocations.ts         # Merges vibe + curated → DEMO_LOCATIONS
  supabase/{client,server}.ts
scripts/
  fetch-osm-locations.ts   # Overpass → generatedLocations.ts
  curate-locations.ts      # Score → curatedLocations + extendedLocations
  build-lock-migration.ts  # Locations → migration 0005
  seed-locations.ts        # CSV → Supabase (rarely used; migration 0005 seeds)
  validate-streetview.ts   # Sanity check pano IDs (rarely used)
supabase/migrations/       # SQL migrations 0001–0005
docs/                      # Tutorials + agent context
AGENTS.md                  # Working notes for AI coding agents
```

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm test` | Vitest unit tests |
| `npm run lint` | ESLint |
| `npm run fetch-locations` | Re-pull OSM + revalidate against Google Street View |
| `npx tsx scripts/curate-locations.ts` | Re-score + repartition curated/extended |
| `npx tsx scripts/build-lock-migration.ts` | Regenerate migration 0005 from current location pool |

---

## License

MIT — fork it, ship it, tag me when you do.

---

## Built by

[Caleb Morse](https://github.com/CalebMorse06) — KU
