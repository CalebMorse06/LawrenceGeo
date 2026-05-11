import Link from "next/link";
import Wordmark from "@/components/Wordmark";

const FEATURED = [
  "Mass St",
  "Allen Fieldhouse",
  "The Hill",
  "Free State Brewing",
  "The Oread",
  "Daisy Hill",
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20">
      <div className="flex w-full max-w-3xl flex-col items-start gap-8 rise-in">
        <div className="flex flex-col gap-3">
          <span className="eyebrow">Five rounds · Lawrence, KS</span>
          <Wordmark size="xl" />
          <p className="display text-2xl text-ink-soft sm:text-3xl">
            The town you thought you knew.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/play?mode=daily"
            className="group inline-flex items-center justify-center gap-2 rounded-md bg-crimson px-6 py-3 text-base font-medium text-paper shadow-[0_1px_0_rgba(0,0,0,0.12)] transition hover:bg-crimson-deep"
          >
            <span className="h-2 w-2 rounded-full bg-paper ku-pulse" />
            Today&rsquo;s daily
          </Link>
          <Link
            href="/play"
            className="inline-flex items-center justify-center rounded-md border border-ink/20 bg-paper px-6 py-3 text-base font-medium text-ink transition hover:border-ink/50"
          >
            Freeplay
          </Link>
          <Link
            href="/leaderboard"
            className="inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-medium text-ink-soft transition hover:text-ink"
          >
            Leaderboard →
          </Link>
        </div>

        <ul className="flex flex-wrap gap-2 pt-2">
          {FEATURED.map((f) => (
            <li
              key={f}
              className="rounded-full border border-ink/15 bg-chalk/70 px-3 py-1 text-sm text-ink-soft"
            >
              {f}
            </li>
          ))}
          <li className="rounded-full border border-jayhawk/30 bg-jayhawk/5 px-3 py-1 text-sm text-jayhawk-deep">
            + 184 more
          </li>
        </ul>

        <footer className="pt-6 text-sm text-ink-soft/70">
          Rock chalk · made instead of studying
        </footer>
      </div>
    </main>
  );
}
