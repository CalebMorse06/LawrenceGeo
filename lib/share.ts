import { MAX_GAME_SCORE, MAX_ROUND_SCORE } from "./scoring";

export function roundEmoji(score: number): string {
  const pct = score / MAX_ROUND_SCORE;
  if (pct >= 0.9) return "🟩";
  if (pct >= 0.6) return "🟨";
  if (pct >= 0.2) return "🟧";
  return "🟥";
}

interface BuildArgs {
  totalScore: number;
  rounds: { score: number }[];
  mode: "daily" | "freeplay";
  dailyDate?: string;
  shareUrl?: string;
}

export function buildShareString({ totalScore, rounds, mode, dailyDate, shareUrl }: BuildArgs): string {
  const header =
    mode === "daily"
      ? `Lawrence/Geo · daily ${dailyDate ?? ""}`.trim()
      : "Lawrence/Geo · freeplay";
  const score = `${totalScore.toLocaleString()} / ${MAX_GAME_SCORE.toLocaleString()}`;
  const dots = rounds.map((r) => roundEmoji(r.score)).join("");
  return [header, score, "", dots, shareUrl ? "" : "", shareUrl ?? ""]
    .filter((line, idx, arr) => !(line === "" && arr[idx - 1] === ""))
    .join("\n")
    .trim();
}
