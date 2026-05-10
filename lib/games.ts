import { createSupabaseBrowserClient } from "./supabase/client";
import type { RoundResult } from "./types";

const NICKNAME_KEY = "lawrence-geo-nickname";

export function normalizeNickname(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, 20);
}

export function loadStoredNickname(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NICKNAME_KEY) ?? "";
}

export function storeNickname(nickname: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NICKNAME_KEY, nickname);
}

interface SubmitArgs {
  nickname: string;
  mode: "daily" | "freeplay";
  dailyDate?: string;
  totalScore: number;
  rounds: RoundResult[];
}

export async function submitGame(args: SubmitArgs): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  // Server-side validator (Postgres function) recomputes every round score
  // from the actual location coords and rejects the insert if the client
  // is lying. See supabase/migrations/0005_lock_submissions.sql.
  const { error } = await supabase.rpc("submit_game", {
    p_nickname: args.nickname,
    p_mode: args.mode,
    p_daily_date: args.mode === "daily" ? args.dailyDate ?? null : null,
    p_total_score: args.totalScore,
    p_rounds: args.rounds,
  });
  if (error) throw new Error(error.message);
}

export interface LeaderboardRow {
  player_nickname: string;
  total_score: number;
  created_at: string;
  daily_date: string | null;
}
