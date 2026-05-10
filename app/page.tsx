import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-5xl font-bold tracking-tight">Lawrence GeoGuessr</h1>
        <p className="max-w-md text-zinc-400">
          5 rounds. Guess where in Lawrence you are — from Mass St storefronts to bar interiors and
          KU campus corners.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/play"
          className="rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-500"
        >
          Play freeplay
        </Link>
        <Link
          href="/play?mode=daily"
          className="rounded-md border border-zinc-700 px-6 py-3 text-base font-medium hover:border-zinc-500"
        >
          Daily challenge
        </Link>
        <Link
          href="/leaderboard"
          className="rounded-md border border-zinc-700 px-6 py-3 text-base font-medium hover:border-zinc-500"
        >
          Leaderboard
        </Link>
      </div>
    </main>
  );
}
