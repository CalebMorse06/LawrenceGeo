alter table public.locations enable row level security;
alter table public.games enable row level security;

drop policy if exists locations_public_read on public.locations;
create policy locations_public_read on public.locations
  for select using (active = true);

drop policy if exists games_public_read on public.games;
create policy games_public_read on public.games
  for select using (true);

drop policy if exists games_insert_self on public.games;
create policy games_insert_self on public.games
  for insert with check (true);
