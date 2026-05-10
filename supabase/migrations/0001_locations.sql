create extension if not exists "uuid-ossp";

create table if not exists public.locations (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  lat double precision not null,
  lng double precision not null,
  type text not null check (type in ('streetview', 'pano360', 'photos')),
  streetview_pano_id text,
  pano_storage_path text,
  photo_storage_paths text[],
  difficulty smallint not null default 2 check (difficulty between 1 and 3),
  tags text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint locations_type_payload check (
    (type = 'streetview' and streetview_pano_id is not null)
    or (type = 'pano360' and pano_storage_path is not null)
    or (type = 'photos' and photo_storage_paths is not null and array_length(photo_storage_paths, 1) >= 1)
  )
);

create index if not exists locations_active_idx on public.locations (active);
create index if not exists locations_tags_idx on public.locations using gin (tags);
