import { describe, expect, it } from "vitest";
import { haversineMeters, roundScore, scoreGuess } from "./scoring";

describe("haversineMeters", () => {
  it("returns 0 for identical points", () => {
    const p = { lat: 38.9717, lng: -95.2353 };
    expect(haversineMeters(p, p)).toBeCloseTo(0, 5);
  });

  it("approximates Allen Fieldhouse <-> Memorial Stadium (~700m)", () => {
    const allen = { lat: 38.9542, lng: -95.2526 };
    const stadium = { lat: 38.9633, lng: -95.2454 };
    const d = haversineMeters(allen, stadium);
    expect(d).toBeGreaterThan(900);
    expect(d).toBeLessThan(1300);
  });
});

describe("roundScore", () => {
  it("awards max at zero distance", () => {
    expect(roundScore(0)).toBe(5000);
  });
  it("drops off with distance", () => {
    // Curve: roundScore = round(5000 * exp(-d/500))
    // 200m  → ~3352
    // 500m  → ~1839
    // 1km   → ~677
    // 2km   → ~92
    // 5km+  → ~0
    expect(roundScore(200)).toBeGreaterThan(3000);
    expect(roundScore(200)).toBeLessThan(3500);
    expect(roundScore(1000)).toBeGreaterThan(600);
    expect(roundScore(1000)).toBeLessThan(750);
    expect(roundScore(5000)).toBeLessThan(5);
  });
  it("clamps negatives to 0", () => {
    expect(roundScore(-1)).toBe(0);
  });
});

describe("scoreGuess", () => {
  it("returns 5000 for an exact guess", () => {
    const p = { lat: 38.9717, lng: -95.2353 };
    const { score, distanceMeters } = scoreGuess(p, p);
    expect(score).toBe(5000);
    expect(distanceMeters).toBeCloseTo(0, 5);
  });
});
