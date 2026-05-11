import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { todayInLawrence } from "@/lib/daily";
import { SCORE_TIERS } from "@/lib/scoring";
import type { LeaderboardRow } from "@/lib/games";

export const dynamic = "force-dynamic";

type Tab = "today" | "alltime" | "freeplay";

interface PageProps {
  searchParams: Promise<{ tab?: string; date?: string }>;
}

async function fetchDaily(date: string): Promise<LeaderboardRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("games")
    .select("player_nickname, total_score, created_at, daily_date")
    .eq("mode", "daily")
    .eq("daily_date", date)
    .order("total_score", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data as LeaderboardRow[]) ?? [];
}

async function fetchAllTimeDaily(): Promise<LeaderboardRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("games")
    .select("player_nickname, total_score, created_at, daily_date")
    .eq("mode", "daily")
    .order("total_score", { ascending: false })
    .limit(250);
  if (error) throw new Error(error.message);
  const byNick = new Map<string, LeaderboardRow>();
  for (const row of (data as LeaderboardRow[]) ?? []) {
    const key = row.player_nickname.trim().toLowerCase();
    if (!byNick.has(key)) byNick.set(key, row);
  }
  return [...byNick.values()].slice(0, 50);
}

async function fetchFreeplay(): Promise<LeaderboardRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("games")
    .select("player_nickname, total_score, created_at, daily_date")
    .eq("mode", "freeplay")
    .order("total_score", { ascending: false })
    .limit(250);
  if (error) throw new Error(error.message);
  const byNick = new Map<string, LeaderboardRow>();
  for (const row of (data as LeaderboardRow[]) ?? []) {
    const key = row.player_nickname.trim().toLowerCase();
    if (!byNick.has(key)) byNick.set(key, row);
  }
  return [...byNick.values()].slice(0, 50);
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const m = Math.floor((now - then) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const TAB_DESCRIPTIONS: Record<Tab, { eyebrow: (date: string) => string; empty: string; cta: string; ctaHref: string }> = {
  today: {
    eyebrow: (date) => date,
    empty: "Be the first to play today's daily.",
    cta: "Play today's daily →",
    ctaHref: "/play?mode=daily",
  },
  alltime: {
    eyebrow: () => "all-time best daily per player",
    empty: "Once people start saving their daily runs, the all-time board fills up here.",
    cta: "Play today's daily →",
    ctaHref: "/play?mode=daily",
  },
  freeplay: {
    eyebrow: () => "best freeplay run per player",
    empty: "No freeplay runs saved yet. Take a shot at the high score.",
    cta: "Start a freeplay run →",
    ctaHref: "/play",
  },
};

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab: Tab =
    params.tab === "alltime" ? "alltime" : params.tab === "freeplay" ? "freeplay" : "today";
  const today = todayInLawrence();
  const date = params.date ?? today;

  let rows: LeaderboardRow[] = [];
  let errorMsg: string | null = null;
  try {
    if (tab === "freeplay") rows = await fetchFreeplay();
    else if (tab === "alltime") rows = await fetchAllTimeDaily();
    else rows = await fetchDaily(date);
  } catch (err) {
    errorMsg = (err as Error).message;
  }

  const desc = TAB_DESCRIPTIONS[tab];

  function tabClass(t: Tab): string {
    return [
      "rounded-full px-4 py-1.5 text-sm font-medium transition",
      tab === t ? "bg-crimson text-paper" : "text-ink-soft hover:text-ink",
    ].join(" ");
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-8 px-4 py-12">
      <div className="flex flex-col items-center gap-2">
        <Link href="/" className="hover:opacity-80">
          <Wordmark size="md" />
        </Link>
        <span className="eyebrow">leaderboard</span>
      </div>

      <nav className="flex gap-2 rounded-full border border-ink/15 bg-paper p-1">
        <Link href="/leaderboard" className={tabClass("today")}>
          Today
        </Link>
        <Link href="/leaderboard?tab=alltime" className={tabClass("alltime")}>
          All-time daily
        </Link>
        <Link href="/leaderboard?tab=freeplay" className={tabClass("freeplay")}>
          Freeplay
        </Link>
      </nav>

      <div className="w-full max-w-xl rounded-2xl border border-ink/10 bg-paper p-4 shadow-sm sm:p-6">
        {errorMsg ? (
          <p className="text-sm text-crimson-deep">Couldn&rsquo;t load standings: {errorMsg}</p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="display text-2xl text-ink">No scores yet.</p>
            <p className="text-sm text-ink-soft">{desc.empty}</p>
            <Link
              href={desc.ctaHref}
              className="mt-2 rounded-md bg-crimson px-4 py-2 text-sm font-medium text-paper hover:bg-crimson-deep"
            >
              {desc.cta}
            </Link>
          </div>
        ) : (
          <>
            <header className="mb-3 flex items-baseline justify-between text-xs">
              <span className="eyebrow">{desc.eyebrow(date)}</span>
              <span className="font-mono text-ink-soft">{rows.length} entries</span>
            </header>
            <ol className="divide-y divide-ink/10">
              {rows.map((row, i) => (
                <li
                  key={`${row.player_nickname}-${row.created_at}`}
                  className="grid grid-cols-[2rem_1fr_auto_auto] items-center gap-3 py-2"
                >
                  <span
                    className={[
                      "font-mono text-sm",
                      i === 0
                        ? "text-crimson font-bold"
                        : i < 3
                          ? "text-jayhawk-deep font-semibold"
                          : "text-ink-soft",
                    ].join(" ")}
                  >
                    {i + 1}.
                  </span>
                  <span className="truncate font-medium text-ink">{row.player_nickname}</span>
                  <span className="font-mono text-sm tabular-nums text-ink">
                    {row.total_score.toLocaleString()}
                  </span>
                  <span className="font-mono text-xs text-ink-soft/70">
                    {formatRelative(row.created_at)}
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>

      <Link
        href={desc.ctaHref}
        className="text-sm font-medium text-jayhawk-deep underline-offset-4 hover:underline"
      >
        {desc.cta}
      </Link>

      <section className="w-full max-w-xl">
        <h2 className="eyebrow mb-2">What&rsquo;s a good score?</h2>
        <ul className="divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-paper text-sm">
          {SCORE_TIERS.filter((t) => t.threshold > 0).map((t) => (
            <li key={t.label} className="flex items-baseline justify-between gap-3 px-4 py-2">
              <span className="font-mono text-ink">{t.threshold.toLocaleString()}+</span>
              <span className="flex-1 font-medium text-ink">{t.label}</span>
              <span className="text-xs text-ink-soft/80">{t.blurb}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-soft/70">
          Max possible is 25,000. Anything above 22k is real Lawrence brain.
        </p>
      </section>
    </main>
  );
}
