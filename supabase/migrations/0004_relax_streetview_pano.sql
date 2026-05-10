-- Relax the streetview branch of the type-payload check: lat/lng alone is
-- enough. The streetview_pano_id column stays as an optional override for
-- locations where the auto-picked nearest pano is wrong.
alter table public.locations
  drop constraint if exists locations_type_payload;

alter table public.locations
  add constraint locations_type_payload check (
    (type = 'streetview')
    or (type = 'pano360' and pano_storage_path is not null)
    or (type = 'photos' and photo_storage_paths is not null and array_length(photo_storage_paths, 1) >= 1)
  );
