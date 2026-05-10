# Lawrence GeoGuessr

A GeoGuessr-style web game scoped to Lawrence, KS. Players see a panorama —
outdoor Street View, custom 360° interior, or photo carousel — and guess the
location on a Lawrence map. 5 rounds, distance-based scoring.

## Stack

- Next.js 16 (App Router) + Tailwind
- Mapbox GL JS — guess map (bounded to Lawrence)
- Google Street View JS API — outdoor panoramas
- Pannellum — custom 360° panoramas (loaded from CDN)
- Supabase — Postgres for locations + game scores, Storage for panoramas
- Vitest — unit tests for scoring math

## Setup

```bash
npm install
cp .env.local.example .env.local
# fill in the four NEXT_PUBLIC_* keys
npm run dev
```

The `.env.local` keys you need:

| Var | Where |
| --- | --- |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | account.mapbox.com → Access tokens |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Cloud Console → Maps JS + Street View |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (server-only, for seed script) |

Restrict the Mapbox and Google keys by HTTP referrer before going to prod.

## Supabase setup

Apply the migrations in order:

```
supabase/migrations/0001_locations.sql
supabase/migrations/0002_games.sql
supabase/migrations/0003_rls.sql
```

Then seed locations from a CSV:

```bash
npx tsx scripts/seed-locations.ts path/to/locations.csv
```

Expected CSV columns: `name,lat,lng,type,streetview_pano_id,pano_storage_path,photo_storage_paths,difficulty,tags`
(use `|` to delimit array values for `photo_storage_paths` and `tags`).

## Scripts

- `npm run dev` — Next.js dev server (turbopack)
- `npm run build` — production build
- `npm test` — vitest unit tests for scoring
- `npx tsx scripts/seed-locations.ts <csv>` — seed locations
- `npx tsx scripts/validate-streetview.ts` — ping Google to check every `streetview` row's pano id still resolves

## Status

Pre-MVP. A playable demo runs out of `lib/demoLocations.ts` (5 photo-type
rounds) so the game loop is verifiable without Supabase. Switching `app/play`
to `fetchActiveLocations()` from `lib/locations.ts` once the database is seeded
is the next step.
