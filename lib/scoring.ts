export type LatLng = { lat: number; lng: number };

export const LAWRENCE_CENTER: LatLng = { lat: 38.9717, lng: -95.2353 };

export const MAX_ROUND_SCORE = 5000;
export const SCORE_DECAY_METERS = 400;
export const ROUNDS_PER_GAME = 5;
export const MAX_GAME_SCORE = MAX_ROUND_SCORE * ROUNDS_PER_GAME;

const EARTH_RADIUS_METERS = 6_371_000;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(s));
}

export function roundScore(distanceMeters: number): number {
  if (distanceMeters < 0) return 0;
  return Math.round(MAX_ROUND_SCORE * Math.exp(-distanceMeters / SCORE_DECAY_METERS));
}

export function scoreGuess(guess: LatLng, actual: LatLng) {
  const distanceMeters = haversineMeters(guess, actual);
  return { distanceMeters, score: roundScore(distanceMeters) };
}
