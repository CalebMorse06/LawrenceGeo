create table if not exists public.games (
  id uuid primary key default uuid_generate_v4(),
  player_nickname text not null check (char_length(player_nickname) between 1 and 32),
  player_id uuid,
  mode text not null check (mode in ('daily', 'freeplay')),
  daily_date date,
  total_score integer not null check (total_score >= 0),
  rounds jsonb not null,
  created_at timestamptz not null default now(),
  constraint games_daily_date_required check (mode <> 'daily' or daily_date is not null)
);

create index if not exists games_daily_idx on public.games (daily_date, total_score desc) where mode = 'daily';
create index if not exists games_all_time_idx on public.games (total_score desc);
