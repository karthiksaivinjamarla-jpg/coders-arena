import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LiveLeaderboard } from "@/components/live-leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({ params }: { params: Promise<{ contestId: string }> }) {
  const { contestId } = await params;
  const supabase = await createClient();
  const { data: contest } = await supabase
    .from("contests")
    .select("id,title,status,freeze_time,leaderboard_type,penalty_minutes")
    .eq("id", contestId)
    .maybeSingle();
  if (!contest) notFound();

  const frozen = contest.status === "frozen" || (!!contest.freeze_time && Date.now() >= Date.parse(contest.freeze_time));
  const { data: entries } = await supabase
    .from("leaderboard_public_entries")
    .select("id,user_id,display_name,roll_number,total_score,solved_count,penalty_seconds,rank")
    .eq("contest_id", contestId)
    .order("rank", { ascending: true, nullsFirst: false });

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <p className="eyebrow">{contest.leaderboard_type} · {frozen ? "Frozen" : "Live"}</p>
          <h1>{contest.title} Leaderboard</h1>
          <p className="muted">{contest.leaderboard_type === "icpc" ? `ICPC-style · ${contest.penalty_minutes} min penalty` : "Points-based scoring"}</p>
        </div>
        <Link className="btn secondary" href={`/contests/${contestId}/arena`}>Back to arena</Link>
      </div>
      <section className="card" style={{ marginTop: 20 }}>
        <LiveLeaderboard contestId={contestId} initialEntries={(entries ?? []) as never} frozen={frozen} />
      </section>
    </main>
  );
}
