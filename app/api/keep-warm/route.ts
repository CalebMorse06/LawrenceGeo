import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Pinged daily by a Vercel cron (see vercel.json) so the free-tier Supabase
// project never sits idle long enough to auto-pause — that pause is what took
// the leaderboard down before. A trivial read is enough to count as activity.
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ ok: false, error: "supabase env missing" }, { status: 500 });
  }
  const supabase = createClient(url, key);
  const { error } = await supabase.from("games").select("id").limit(1);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 502 });
  }
  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
