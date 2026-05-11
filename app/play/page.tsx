"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import GuessMap from "@/components/GuessMap";
import LogoMark from "@/components/LogoMark";
import PanoramaViewer from "@/components/PanoramaViewer";
import RoundResult from "@/components/RoundResult";
import ScoreCard from "@/components/ScoreCard";
import Wordmark from "@/components/Wordmark";
import { DEMO_LOCATIONS } from "@/lib/demoLocations";
import { pickDailyLocationIds, todayInLawrence } from "@/lib/daily";
import { ROUNDS_PER_GAME, scoreGuess, type LatLng } from "@/lib/scoring";
import type { GameLocation } from "@/lib/types";

type Mode = "daily" | "freeplay";

const ROUND_SECONDS = 60;

interface CompletedRound {
  locationName: string;
  distanceM: number;
  score: number;
  guess: LatLng | null;
  actual: LatLng;
}

function shuffleN(pool: GameLocation[], n: number): GameLocation[] {
  const copy = [...pool];
  const out: GameLocation[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function readMode(): Mode {
  if (typeof window === "undefined") return "freeplay";
  return new URLSearchParams(window.location.search).get("mode") === "daily" ? "daily" : "freeplay";
}

export default function PlayPage() {
  const [mode, setMode] = useState<Mode>("freeplay");
  const [seed, setSeed] = useState(0);
  const dailyDate = useMemo(() => todayInLawrence(), []);
  useEffect(() => {
    setMode(readMode());
  }, []);

  const rounds = useMemo(() => {
    if (mode === "daily") {
      const ids = pickDailyLocationIds(
        DEMO_LOCATIONS.map((l) => l.id),
        dailyDate,
        ROUNDS_PER_GAME,
      );
      return ids
        .map((id) => DEMO_LOCATIONS.find((l) => l.id === id))
        .filter((l): l is GameLocation => !!l);
    }
    return shuffleN(DEMO_LOCATIONS, ROUNDS_PER_GAME);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, dailyDate, seed]);

  const [roundIdx, setRoundIdx] = useState(0);
  const [guess, setGuess] = useState<LatLng | null>(null);
  const [committedRound, setCommittedRound] = useState<CompletedRound | null>(null);
  const [completed, setCompleted] = useState<CompletedRound[]>([]);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);

  // Auto-expand on commit so the reveal pins + line are visible.
  useEffect(() => {
    if (committedRound) setMapExpanded(true);
  }, [committedRound]);

  // Reset timer at the start of each round and on replay.
  useEffect(() => {
    setTimeLeft(ROUND_SECONDS);
  }, [roundIdx, seed]);

  // Tick down while the round is live.
  useEffect(() => {
    if (committedRound) return;
    const id = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [committedRound, roundIdx, seed]);

  if (rounds.length === 0) {
    return <p className="p-8">No locations available.</p>;
  }

  const current = rounds[roundIdx];
  const isLastRound = roundIdx === rounds.length - 1;
  const isGameOver = completed.length === rounds.length;

  // Auto-commit when the timer expires. If they had a pin down, score it;
  // otherwise it's a forfeit at 0 points.
  useEffect(() => {
    if (timeLeft > 0 || committedRound || isGameOver) return;
    const actual = { lat: current.lat, lng: current.lng };
    if (guess) {
      const { score, distanceMeters } = scoreGuess(guess, actual);
      setCommittedRound({
        locationName: current.name,
        distanceM: distanceMeters,
        score,
        guess,
        actual,
      });
    } else {
      setCommittedRound({
        locationName: current.name,
        distanceM: 0,
        score: 0,
        guess: null,
        actual,
      });
    }
  }, [timeLeft, committedRound, isGameOver, guess, current]);

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
    setCompleted([...completed, committedRound]);
    setCommittedRound(null);
    setGuess(null);
    setMapExpanded(false);
    if (!isLastRound) setRoundIdx(roundIdx + 1);
  }

  function playAgain() {
    setSeed((s) => s + 1);
    setRoundIdx(0);
    setGuess(null);
    setCommittedRound(null);
    setCompleted([]);
    setMapExpanded(false);
  }

  if (isGameOver) {
    const total = completed.reduce((s, r) => s + r.score, 0);
    const shareUrl =
      typeof window !== "undefined" ? `${window.location.origin}/play?mode=daily` : undefined;
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="mb-6">
          <Link href="/" className="hover:opacity-80">
            <Wordmark size="md" />
          </Link>
        </div>
        <ScoreCard
          totalScore={total}
          rounds={completed.map((r) => ({
            score: r.score,
            distanceM: r.distanceM,
            locationName: r.locationName,
          }))}
          fullRounds={completed.map((r, i) => ({
            locationId: rounds[i]?.id ?? "",
            guessLat: r.guess?.lat ?? 0,
            guessLng: r.guess?.lng ?? 0,
            distanceM: r.distanceM,
            score: r.score,
          }))}
          onPlayAgain={playAgain}
          mode={mode}
          dailyDate={mode === "daily" ? dailyDate : undefined}
          shareUrl={mode === "daily" ? shareUrl : undefined}
        />
      </main>
    );
  }

  const runningScore = completed.reduce((s, r) => s + r.score, 0);

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-dusk">
      {/* Panorama fills the viewport */}
      <div className="absolute inset-0">
        <PanoramaViewer location={current} />
      </div>

      {/* Top bar overlay */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3">
        <Link
          href="/"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-md bg-paper/95 px-3 py-2 text-sm font-medium text-ink backdrop-blur transition hover:bg-paper"
        >
          <LogoMark size={22} />
          <Wordmark size="sm" />
        </Link>
        <div className="pointer-events-auto flex gap-2">
          <div className="rounded-md bg-paper/95 px-3 py-2 text-xs font-mono text-ink backdrop-blur">
            <div className="eyebrow text-[0.6rem]">round</div>
            <div className="text-base font-semibold">
              {roundIdx + 1} / {rounds.length}
            </div>
          </div>
          <div className="rounded-md bg-paper/95 px-3 py-2 text-xs font-mono text-ink backdrop-blur">
            <div className="eyebrow text-[0.6rem]">time</div>
            <div
              className={`text-base font-semibold tabular-nums ${
                timeLeft <= 10 && !committedRound ? "text-crimson" : ""
              }`}
            >
              0:{String(timeLeft).padStart(2, "0")}
            </div>
          </div>
          <div className="rounded-md bg-paper/95 px-3 py-2 text-xs font-mono text-ink backdrop-blur">
            <div className="eyebrow text-[0.6rem]">score</div>
            <div className="text-base font-semibold">{runningScore.toLocaleString()}</div>
          </div>
        </div>
      </header>

      {/* Optional dim backdrop when expanded, click to collapse (mobile niceness) */}
      {mapExpanded && !committedRound && (
        <button
          aria-label="Close map"
          onClick={() => setMapExpanded(false)}
          className="absolute inset-0 z-15 bg-ink/30 backdrop-blur-[1px] md:bg-ink/0 md:backdrop-blur-0"
        />
      )}

      {/* Map container */}
      <div
        className={[
          "absolute z-20 transition-all duration-300 ease-out",
          mapExpanded
            ? // Expanded: nearly full screen on mobile, big side panel on desktop
              "inset-2 md:inset-auto md:bottom-4 md:right-4 md:h-[72vh] md:w-[520px]"
            : // Collapsed: chunky, obviously tappable preview in the corner
              "bottom-4 right-4 h-52 w-52 sm:h-60 sm:w-72",
        ].join(" ")}
      >
        <div
          className={[
            "group relative h-full w-full overflow-hidden rounded-xl border-2 shadow-2xl transition-colors",
            mapExpanded
              ? "border-paper bg-paper"
              : "cursor-pointer border-paper/95 hover:border-jayhawk",
          ].join(" ")}
          onClick={() => {
            if (!mapExpanded) setMapExpanded(true);
          }}
        >
          {/* Map column lays out as: map fills, submit/result anchored bottom */}
          <div className="flex h-full flex-col">
            <div className="relative flex-1">
              <GuessMap
                guess={guess}
                actual={committedRound?.actual ?? null}
                onGuess={(p) => {
                  if (!committedRound && mapExpanded) setGuess(p);
                }}
                locked={!!committedRound || !mapExpanded}
              />

              {/* Affordance overlay when collapsed — clearly says "tap me" */}
              {!mapExpanded && !committedRound && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-ink/40 backdrop-blur-[1px] transition-colors group-hover:bg-ink/30">
                  <div className="rounded-full bg-crimson px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-paper shadow-lg ku-pulse">
                    Make your guess
                  </div>
                  <div className="mt-2 text-xs font-medium text-paper/90">tap to expand</div>
                </div>
              )}

              {/* Hint inside expanded map before pin is placed */}
              {mapExpanded && !guess && !committedRound && (
                <div className="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-ink/85 px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-paper">
                  Tap the map to drop a pin
                </div>
              )}

              {/* Close button — only when expanded and no commit yet */}
              {mapExpanded && !committedRound && (
                <button
                  aria-label="Back to view"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMapExpanded(false);
                  }}
                  className="absolute right-2 top-2 rounded-full bg-paper/95 px-2.5 py-1 text-xs font-medium text-ink shadow"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Bottom slot: submit / result, only when expanded */}
            {mapExpanded && (
              <div className="border-t border-ink/10 bg-paper p-3">
                {!committedRound ? (
                  <button
                    onClick={submit}
                    disabled={!guess}
                    className="w-full rounded-lg bg-crimson px-6 py-3.5 text-base font-medium text-paper shadow-sm transition hover:bg-crimson-deep disabled:bg-ink/25 disabled:text-paper/80"
                  >
                    {guess ? "Submit guess" : "Drop a pin first"}
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
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
