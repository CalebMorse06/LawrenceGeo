# Building this

Lawrence/Geo was built in a single weekend (when I should have been
studying), paired with [Claude Code](https://claude.com/claude-code).
This doc is for two audiences:

1. **People forking the repo** who want to know how it works and what
   moves are worth copying
2. **People who want to build something similar with an AI coding
   agent** — the workflow patterns that made this tractable

---

## The architectural moves worth copying

### 1. Plan mode before code

The first thing was a one-page spec — what is this, who's it for, what's
in scope, what's deferred. Two paragraphs each on stack, schema, game
loop, content pipeline, verification.

Then we executed against the plan rather than wandering. The plan stayed
in the repo at `~/.claude/plans/` and got referenced when scope creeped.

**Why it matters:** the cost of writing a plan is small. The cost of
half-finished code in three directions is huge. AI agents will happily
implement whatever you ask — having a written spec means you ask for the
right thing.

### 2. Pull content programmatically, don't hand-curate

The original plan said "20 locations." We got to 96 hand-typed before
realizing OSM has the answers. The pipeline:

1. **OpenStreetMap Overpass API** — returns every tagged amenity in a
   bounding box. For Lawrence: 600+ places (every named bar, every
   campus building, every dorm, every park, every museum).
2. **Google Street View Metadata API** — free endpoint, confirms each
   point has viewable imagery within 150m. Drops the ~5% that don't.
3. **Quality scorer** — weighted heuristic over name keywords (`+10` for
   famous places, `-6` for chain restaurants) and OSM categories. Keeps
   the top ~150, dumps the rest into `extendedLocations.ts` for later.

For any town with Street View coverage, you replace one regex list and
re-run the pipeline. That's it. 600 verified locations → 150 curated
ones → playable game.

**Time saved:** ~10 hours of manual coordinate hunting. **Quality
improvement:** every coordinate is verified by OSM contributors who
actually live there.

### 3. Server-side score validation

The naive version: client computes score, sends total to Supabase, RLS
allows anonymous insert. Within an hour of going public, someone runs
`curl` and submits 25,000.

The fix: a `SECURITY DEFINER` Postgres function (`submit_game()`) that
**recomputes** every round score from the rounds payload + the actual
location coordinates stored in the database. The client never tells the
server what its score is — it tells the server *where it guessed* and
the server tells the client what that's worth.

The schema:

```sql
create function public.submit_game(
  p_nickname text,
  p_mode text,
  p_daily_date date,
  p_total_score integer,  -- ← used only for the consistency check
  p_rounds jsonb
) returns uuid
security definer
as $$
begin
  -- For each round:
  --   look up locations.lat, locations.lng by slug
  --   compute haversine(server_coords, client_guess)
  --   compute score = round(5000 * exp(-dist/500))
  --   reject if abs(server_score - claimed_score) > 2
  -- Sum server scores. Reject if abs(server_total - claimed_total) > 5.
  -- Else: insert with the *server-computed* total_score.
end;
$$;

revoke insert on public.games from anon;
grant execute on submit_game to anon;
```

The client uses `supabase.rpc('submit_game', ...)`. The game table is
write-only via the function — anonymous insert is revoked.

**Cost:** ~30 minutes of writing PL/pgSQL once. **Payoff:** the
leaderboard becomes credible enough to attach a real bounty to.

### 4. Auto-generate the migrations

`scripts/build-lock-migration.ts` reads `lib/curatedLocations.ts` +
`lib/vibeLocations.ts` and writes `supabase/migrations/0005_lock_submissions.sql`.
167 location upserts + the validator function, all in one SQL file.

When the location pool changes, regenerate. The migration is committed
to the repo so anyone forking can apply it as-is or regenerate after
re-running the pipeline for their town.

### 5. Map orientation anchors

Beginners can't read maps cold. A 100% blank map of your town is
intimidating. We added two anchors to `components/GuessMap.tsx`:

- A faint **crimson polygon** outlining KU campus with a "KU" label
- A **jayhawk-blue line** down Mass St (the main drag)

Both are broad enough not to leak specific answers — campus has 40+
possible round answers inside it; Mass St has another dozen — but they
give an instant orientation read. Friction drops massively for
first-time players.

### 6. Mobile-first corner mini-map

Standard GeoGuessr pattern: panorama fills the screen for immersion, a
collapsible map lives in the corner. We tried a split-screen layout
first; it killed the immersion. Went back to corner-pill but made it
**much** clearer:

- Bigger collapsed size (208×208 mobile)
- Pulsing crimson "Make your guess" pill on top of a dimmed mini-map —
  unmissable affordance
- Click-only, no hover (predictable on touch + desktop)
- Submit button **inside** the expanded map (your eyes don't have to
  jump to find it)
- Auto-expand when the round is submitted so the reveal pins + dashed
  line are immediately visible

Took two iterations of "play it, fix what felt wrong" to land it.

### 7. Score tier framing

Players don't know what's a "good" score. The score card shows a badge
(`Townie`, `Bona fide alum`, etc.) and the leaderboard has a "What's a
good score?" reference panel:

```
21,000+   Townie              avg ~100m per round
17,000+   Bona fide alum      avg ~200m per round
12,000+   Knows the bars      avg ~350m per round
 7,000+   Passing through     avg ~600m per round
```

Tells people what to aim for, frames the bounty target, makes the
leaderboard interpretable. Centralized in `SCORE_TIERS` in
`lib/scoring.ts` so the score card and leaderboard agree.

---

## The Claude Code workflow

If you want to build something similar with an AI coding agent, here's
the rough shape that worked.

### Use plan mode

`/plan` at the start. Spec out the whole thing. Then `/exit-plan` and
execute. Refer back to the plan when scope drifts.

### Use specialized subagents

Claude Code can spawn focused subagents for research vs implementation.
The `Explore` agent was great for "where is X handled in this
codebase" — kept the main context clean.

### MCP servers for external systems

The Supabase MCP server (`https://mcp.supabase.com/mcp?project_ref=...`)
lets the agent apply migrations, query schemas, and inspect data
directly. Once authenticated, you can say "apply the migrations in
order" and it just works.

For an agent to use the Supabase MCP scoped to your project:

```bash
claude mcp add --scope project --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=YOUR_REF"
```

Then `/mcp` inside Claude Code to authenticate.

### AGENTS.md as project context

The repo has an `AGENTS.md` that AI agents read on every session. It
flags the Next.js 16 caveats, the location-pool architecture, the
auto-generated files (don't hand-edit), and the migration workflow.
Stops the agent from re-discovering things every conversation.

### Concrete prompts that worked

- *"How hard would it be to make a geoguesser for Lawrence including
  bar interiors and campus locations?"* — produced the initial plan
- *"That feels off, can we do better than memory? Is there an OSM
  dataset?"* — produced the location pipeline
- *"600 is too many. Friends will click once. Curate."* — produced the
  scoring + filtering pass
- *"Lock the submissions. I want to post a bounty."* — produced the
  Postgres validator

Each was a clear product decision phrased as a constraint. The agent
took it from there.

---

## Stack decisions

A few of the smaller picks and why:

- **Next.js 16 App Router** over Pages Router — server components for the
  leaderboard, static-prerendered for the landing and game
- **Mapbox** over Leaflet — better Lawrence detail, free tier covers it
- **Pannellum from CDN** over the npm package — npm package has type
  issues; CDN script tag is simpler
- **Fraunces** display serif — collegiate without being stuffy; pairs
  with Geist sans for body
- **Tailwind v4 + CSS variables** for the palette — `--crimson`,
  `--paper`, etc. defined once, used via `bg-crimson` Tailwind classes
- **Vitest** over Jest — faster, no config gymnastics, same API
- **`tsx` for scripts** — runs TypeScript scripts directly, no compile
  step. Reads `.env.local` via inline loader (no `dotenv` dep)
- **Supabase RPC + RLS** over an API layer — no Next.js API routes
  needed for the game flow; the database is the API

---

## What I'd change with more time

- **Anti-spam beyond the score validator** — a player can still submit
  many daily runs from the same IP. Could add a unique constraint on
  `(player_nickname, daily_date)` or rate-limit by IP via an Edge
  Function.
- **A "hardcore" mode** that uses `extendedLocations.ts` for the 470
  weirder places. Already wired in the codebase, just not exposed.
- **Real-time multiplayer** — rooms where 2–4 friends play the same
  5-round set simultaneously and see each other's pins on reveal.
  Significant backend work (websockets, room state), explicitly
  deferred from the MVP.
- **Custom 360° interior captures** — the `pano360` location type is
  fully supported; we just haven't gone fieldworking yet to capture
  bar interiors. The plan was always to roll those in slowly.

---

## Recap

The shape of this kind of project:

1. Write a 1-page plan (with help from the agent)
2. Pull content programmatically, score it, keep the best
3. Make the game loop work end-to-end against fake data first
4. Lock down anything that touches money or competition (server-side
   validation, never trust the client)
5. Iterate UX based on actually playing it — the friction is never
   where you expect

Total dev time: ~12 hours over a weekend. Plus another ~3 hours of
content tuning (running the OSM pipeline, hand-fixing famous-keyword
matches, adding vibe entries OSM missed).

Cost to host: $0/mo on free tiers up to maybe 5k DAU.

Difficulty to fork for another town: ~2–4 hours. The whole point.
