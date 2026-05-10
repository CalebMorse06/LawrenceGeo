"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  loadStoredNickname,
  normalizeNickname,
  storeNickname,
  submitGame,
} from "@/lib/games";
import type { RoundResult } from "@/lib/types";

interface Props {
  totalScore: number;
  rounds: RoundResult[];
  mode: "daily" | "freeplay";
  dailyDate?: string;
}

type Status = "idle" | "saving" | "saved" | "error";

export default function LeaderboardSave({ totalScore, rounds, mode, dailyDate }: Props) {
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setNickname(loadStoredNickname());
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = normalizeNickname(nickname);
    if (!name) return;
    setStatus("saving");
    setErrorMsg(null);
    try {
      await submitGame({ nickname: name, mode, dailyDate, totalScore, rounds });
      storeNickname(name);
      setStatus("saved");
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus("error");
    }
  }

  if (status === "saved") {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-jayhawk/30 bg-jayhawk/5 p-4 text-sm">
        <div className="text-ink">
          Saved as <span className="font-semibold text-jayhawk-deep">{normalizeNickname(nickname)}</span>.
        </div>
        <Link
          href="/leaderboard"
          className="text-sm font-medium text-jayhawk-deep underline-offset-4 hover:underline"
        >
          See the standings →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="nickname" className="eyebrow">
        Save to today&rsquo;s leaderboard
      </label>
      <div className="flex gap-2">
        <input
          id="nickname"
          type="text"
          inputMode="text"
          autoComplete="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Your name"
          maxLength={20}
          className="flex-1 rounded-md border border-ink/20 bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-jayhawk focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "saving" || !normalizeNickname(nickname)}
          className="rounded-md bg-crimson px-4 py-2 text-sm font-medium text-paper transition hover:bg-crimson-deep disabled:bg-ink/25"
        >
          {status === "saving" ? "…" : "Save"}
        </button>
      </div>
      {errorMsg && (
        <p className="text-xs text-crimson-deep">
          Couldn&rsquo;t save: {errorMsg}. Your score is still in the share card above.
        </p>
      )}
    </form>
  );
}
