import { ROUNDS_PER_GAME } from "./scoring";

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickDailyLocationIds(allIds: string[], date: string, count = ROUNDS_PER_GAME): string[] {
  if (allIds.length <= count) return [...allIds];
  const rng = mulberry32(hashString(`lawrence-geoguessr:${date}`));
  const pool = [...allIds];
  const picked: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

export function todayInLawrence(): string {
  const now = new Date();
  const local = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const d = String(local.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
