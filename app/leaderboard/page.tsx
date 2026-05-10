export default function LeaderboardPage() {
  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16">
      <h1 className="text-3xl font-bold">Leaderboard</h1>
      <p className="max-w-md text-center text-zinc-400">
        Coming soon. Will read from the <code>games</code> table once Supabase is wired up. See{" "}
        <code>supabase/migrations/0002_games.sql</code>.
      </p>
    </main>
  );
}
