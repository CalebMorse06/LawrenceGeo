export type LocationType = "streetview" | "pano360" | "photos";

export interface GameLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: LocationType;
  streetviewPanoId: string | null;
  panoStoragePath: string | null;
  photoStoragePaths: string[] | null;
  difficulty: 1 | 2 | 3;
  tags: string[];
}

export interface RoundResult {
  locationId: string;
  guessLat: number;
  guessLng: number;
  distanceM: number;
  score: number;
}

export interface CompletedGame {
  id: string;
  playerNickname: string;
  mode: "daily" | "freeplay";
  dailyDate: string | null;
  totalScore: number;
  rounds: RoundResult[];
  createdAt: string;
}
