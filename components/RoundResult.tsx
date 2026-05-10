"use client";

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

export default function RoundResult({ locationName, distanceM, score, onNext, isLastRound }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg bg-zinc-900 p-6 text-white">
      <div className="text-sm uppercase tracking-wide text-zinc-400">{locationName}</div>
      <div className="text-4xl font-bold">{score.toLocaleString()}</div>
      <div className="text-sm text-zinc-300">{formatDistance(distanceM)} away</div>
      <button
        onClick={onNext}
        className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
      >
        {isLastRound ? "See final score" : "Next round"}
      </button>
    </div>
  );
}
