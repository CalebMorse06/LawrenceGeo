"use client";

import Link from "next/link";
import AnimatedNumber from "./AnimatedNumber";
import LeaderboardSave from "./LeaderboardSave";
import ShareCard from "./ShareCard";
import { MAX_GAME_SCORE, tierFor } from "@/lib/scoring";
import type { RoundResult } from "@/lib/types";

interface Round {
  score: number;
  distanceM: number;
  locationName: string;
}

interface Props {
  totalScore: number;
  rounds: Round[];
  fullRounds: RoundResult[];
  onPlayAgain: () => void;
  mode: "daily" | "freeplay";
  dailyDate?: string;
  shareUrl?: string;
}

// Tier function now lives in lib/scoring.ts so the leaderboard can show
// the same reference brackets.

export default function ScoreCard({
  totalScore,
  rounds,
  fullRounds,
  onPlayAgain,
  mode,
  dailyDate,
  shareUrl,
}: Props) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm rise-in">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="eyebrow">
          {mode === "daily" ? `Daily · ${dailyDate}` : "Freeplay"}
        </span>
        <AnimatedNumber
          value={totalScore}
          durationMs={1400}
          className="display-tight text-7xl text-crimson"
        />
        <span className="text-sm text-ink-soft">
          of {MAX_GAME_SCORE.toLocaleString()} possible
        </span>
        <span className="mt-2 rounded-full bg-jayhawk/10 px-3 py-1 text-sm font-medium text-jayhawk-deep">
          {tierFor(totalScore).label}
        </span>
      </div>

      <ol className="divide-y divide-ink/10 border-y border-ink/10">
        {rounds.map((r, i) => (
          <li key={i} className="flex items-center justify-between py-2 text-sm">
            <span className="truncate pr-2 text-ink-soft">
              {i + 1}. {r.locationName}
            </span>
            <span className="font-mono text-ink">{r.score.toLocaleString()}</span>
          </li>
        ))}
      </ol>

      <ShareCard
        totalScore={totalScore}
        rounds={rounds}
        mode={mode}
        dailyDate={dailyDate}
        shareUrl={shareUrl}
      />

      {mode === "daily" && (
        <LeaderboardSave
          totalScore={totalScore}
          rounds={fullRounds}
          mode={mode}
          dailyDate={dailyDate}
        />
      )}

      <div className="flex gap-2">
        <button
          onClick={onPlayAgain}
          className="flex-1 rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink-soft"
        >
          Play again
        </button>
        <Link
          href="/"
          className="flex-1 rounded-md border border-ink/20 px-4 py-2 text-center text-sm font-medium text-ink transition hover:border-ink/50"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
