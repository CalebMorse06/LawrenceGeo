"use client";

import AnimatedNumber from "./AnimatedNumber";

interface Props {
  locationName: string;
  distanceM: number;
  score: number;
  onNext: () => void;
  isLastRound: boolean;
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

function flavor(score: number): string {
  if (score >= 4500) return "Rock chalk.";
  if (score >= 3500) return "Hometown read.";
  if (score >= 2000) return "Close enough for jazz.";
  if (score >= 800) return "You know the neighborhood, kinda.";
  return "Were you even here?";
}

export default function RoundResult({ locationName, distanceM, score, onNext, isLastRound }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-ink/10 bg-paper px-6 py-5 text-center rise-in">
      <div className="eyebrow">{locationName}</div>
      <AnimatedNumber
        value={score}
        className="display text-5xl text-crimson"
      />
      <div className="text-sm text-ink-soft">
        {formatDistance(distanceM)} away · <span className="italic">{flavor(score)}</span>
      </div>
      <button
        onClick={onNext}
        className="mt-3 rounded-md bg-ink px-5 py-2 text-sm font-medium text-paper transition hover:bg-ink-soft"
      >
        {isLastRound ? "See final score →" : "Next round →"}
      </button>
    </div>
  );
}
