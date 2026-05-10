"use client";

import { useMemo, useState } from "react";
import GuessMap from "@/components/GuessMap";
import PanoramaViewer from "@/components/PanoramaViewer";
import RoundResult from "@/components/RoundResult";
import ScoreCard from "@/components/ScoreCard";
import { DEMO_LOCATIONS } from "@/lib/demoLocations";
import { ROUNDS_PER_GAME, scoreGuess, type LatLng } from "@/lib/scoring";
import type { GameLocation } from "@/lib/types";

interface CompletedRound {
  locationName: string;
  distanceM: number;
  score: number;
  guess: LatLng;
  actual: LatLng;
}

function pickRounds(pool: GameLocation[]): GameLocation[] {
  const copy = [...pool];
  const picked: GameLocation[] = [];
  for (let i = 0; i < ROUNDS_PER_GAME && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    picked.push(copy.splice(idx, 1)[0]);
  }
  return picked;
}

export default function PlayPage() {
  const [seed, setSeed] = useState(0);
  const rounds = useMemo(() => pickRounds(DEMO_LOCATIONS), [seed]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [guess, setGuess] = useState<LatLng | null>(null);
  const [committedRound, setCommittedRound] = useState<CompletedRound | null>(null);
  const [completed, setCompleted] = useState<CompletedRound[]>([]);

  if (rounds.length === 0) {
    return <p className="p-8">No locations available. Seed the database first.</p>;
  }

  const current = rounds[roundIdx];
  const isLastRound = roundIdx === rounds.length - 1;
  const isGameOver = completed.length === rounds.length;

  function submit() {
    if (!guess) return;
    const actual = { lat: current.lat, lng: current.lng };
    const { score, distanceMeters } = scoreGuess(guess, actual);
    setCommittedRound({
      locationName: current.name,
      distanceM: distanceMeters,
      score,
      guess,
      actual,
    });
  }

  function next() {
    if (!committedRound) return;
    const nextCompleted = [...completed, committedRound];
    setCompleted(nextCompleted);
    setCommittedRound(null);
    setGuess(null);
    if (!isLastRound) setRoundIdx(roundIdx + 1);
  }

  function playAgain() {
    setSeed((s) => s + 1);
    setRoundIdx(0);
    setGuess(null);
    setCommittedRound(null);
    setCompleted([]);
  }

  if (isGameOver) {
    const total = completed.reduce((s, r) => s + r.score, 0);
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <ScoreCard
          totalScore={total}
          rounds={completed.map((r) => ({
            score: r.score,
            distanceM: r.distanceM,
            locationName: r.locationName,
          }))}
          onPlayAgain={playAgain}
        />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 text-sm">
        <span>
          Round {roundIdx + 1} / {rounds.length}
        </span>
        <span className="font-mono text-zinc-400">
          Score so far: {completed.reduce((s, r) => s + r.score, 0).toLocaleString()}
        </span>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-2">
        <div className="aspect-video lg:aspect-auto lg:min-h-[60vh]">
          <PanoramaViewer location={current} />
        </div>
        <div className="flex flex-col gap-3 lg:min-h-[60vh]">
          <div className="flex-1">
            <GuessMap
              guess={guess}
              actual={committedRound?.actual ?? null}
              onGuess={setGuess}
              locked={!!committedRound}
            />
          </div>
          {!committedRound ? (
            <button
              onClick={submit}
              disabled={!guess}
              className="rounded-md bg-blue-600 px-4 py-3 text-base font-medium text-white disabled:bg-zinc-700"
            >
              {guess ? "Submit guess" : "Click the map to place a pin"}
            </button>
          ) : (
            <RoundResult
              locationName={committedRound.locationName}
              distanceM={committedRound.distanceM}
              score={committedRound.score}
              onNext={next}
              isLastRound={isLastRound}
            />
          )}
        </div>
      </div>
    </main>
  );
}
