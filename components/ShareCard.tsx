"use client";

import { useState } from "react";
import { buildShareString, roundEmoji } from "@/lib/share";

interface Props {
  totalScore: number;
  rounds: { score: number; locationName: string; distanceM: number }[];
  mode: "daily" | "freeplay";
  dailyDate?: string;
  shareUrl?: string;
}

export default function ShareCard({ totalScore, rounds, mode, dailyDate, shareUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const shareText = buildShareString({ totalScore, rounds, mode, dailyDate, shareUrl });

  async function copy() {
    try {
      const canShare =
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      if (canShare) {
        await navigator.share({ text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* user cancelled or share failed */
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-ink/10 bg-paper p-4">
      <pre className="font-mono whitespace-pre-wrap text-sm leading-relaxed text-ink">
        {shareText}
      </pre>
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 text-2xl" aria-hidden="true">
          {rounds.map((r, i) => (
            <span key={i}>{roundEmoji(r.score)}</span>
          ))}
        </div>
        <button
          onClick={copy}
          className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-paper transition hover:bg-ink-soft"
        >
          {copied ? "Copied!" : "Share result"}
        </button>
      </div>
    </div>
  );
}
