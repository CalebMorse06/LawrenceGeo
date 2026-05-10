import type { GameLocation } from "./types";
import { createSupabaseServerClient } from "./supabase/server";

interface LocationRow {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: GameLocation["type"];
  streetview_pano_id: string | null;
  pano_storage_path: string | null;
  photo_storage_paths: string[] | null;
  difficulty: number;
  tags: string[] | null;
  active: boolean;
}

function rowToLocation(r: LocationRow): GameLocation {
  return {
    id: r.id,
    name: r.name,
    lat: r.lat,
    lng: r.lng,
    type: r.type,
    streetviewPanoId: r.streetview_pano_id,
    panoStoragePath: r.pano_storage_path,
    photoStoragePaths: r.photo_storage_paths,
    difficulty: (r.difficulty as 1 | 2 | 3) ?? 2,
    tags: r.tags ?? [],
  };
}

export async function fetchActiveLocations(): Promise<GameLocation[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("active", true);
  if (error) throw error;
  return (data as LocationRow[]).map(rowToLocation);
}

export async function fetchLocationsByIds(ids: string[]): Promise<GameLocation[]> {
  if (ids.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .in("id", ids);
  if (error) throw error;
  const byId = new Map((data as LocationRow[]).map((r) => [r.id, rowToLocation(r)]));
  return ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
}
