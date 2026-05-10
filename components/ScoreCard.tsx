"use client";

import { MAX_GAME_SCORE } from "@/lib/scoring";

interface Props {
  totalScore: number;
  rounds: { score: number; distanceM: number; locationName: string }[];
  onPlayAgain: () => void;
}

export default function ScoreCard({ totalScore, rounds, onPlayAgain }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 rounded-lg bg-zinc-900 p-6 text-white">
      <h2 className="text-xl font-semibold">Game complete</h2>
      <div className="text-5xl font-bold">{totalScore.toLocaleString()}</div>
      <div className="text-sm text-zinc-400">of {MAX_GAME_SCORE.toLocaleString()} possible</div>
      <ul className="mt-2 divide-y divide-zinc-800 border-t border-zinc-800">
        {rounds.map((r, i) => (
          <li key={i} className="flex items-center justify-between py-2 text-sm">
            <span className="text-zinc-300">
              {i + 1}. {r.locationName}
            </span>
            <span className="font-mono">{r.score.toLocaleString()}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onPlayAgain}
        className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
      >
        Play again
      </button>
    </div>
  );
}
