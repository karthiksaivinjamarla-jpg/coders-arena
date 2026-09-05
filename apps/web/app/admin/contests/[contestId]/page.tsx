import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ContestFreezeButton } from "@/components/contest-freeze-button";

export const dynamic = "force-dynamic";

export default async function AdminContestPage({ params }: { params: Promise<{ contestId: string }> }) {
  const { contestId } = await params;
  const { supabase } = await requireAdmin();
  const { data: contest } = await supabase
    .from("contests")
    .select("id,title,slug,status,start_time,end_time,freeze_time,duration_minutes,leaderboard_type,penalty_minutes")
    .eq("id", contestId)
    .maybeSingle();
  if (!contest) notFound();

  const [{ count: registrationCount }, { count: submissionCount }] = await Promise.all([
    supabase.from("contest_registrations").select("id", { count: "exact", head: true }).eq("contest_id", contestId),
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("contest_id", contestId),
  ]);

  return (
    <main className="container">
      <div className="page-head">
        <div><p className="eyebrow">Admin • Contest</p><h1>{contest.title}</h1><p className="muted">{contest.slug} · {contest.status}</p></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn secondary" href={`/contests/${contestId}/leaderboard`}>Public leaderboard</Link>
          <Link className="btn secondary" href="/admin/contests">All contests</Link>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginTop: 20 }}>
        <div className="card stat-card"><b>Registrations</b><strong>{registrationCount ?? 0}</strong></div>
        <div className="card stat-card"><b>Submissions</b><strong>{submissionCount ?? 0}</strong></div>
        <div className="card stat-card"><b>Scoring</b><strong>{contest.leaderboard_type === "icpc" ? "ICPC" : "Points"}</strong><span>{contest.penalty_minutes} min penalty</span></div>
      </div>

      <section className="card" style={{ marginTop: 20 }}>
        <p className="eyebrow">Contest control</p>
        <h2>Leaderboard state</h2>
        <p className="muted">Freeze stops the public snapshot from revealing later solves. Admins retain access to the final standings.</p>
        <div style={{ marginTop: 14 }}><ContestFreezeButton contestId={contestId} status={contest.status} /></div>
        <div className="stack" style={{ marginTop: 18 }}>
          <div>Start: <strong>{contest.start_time ? new Date(contest.start_time).toLocaleString() : "—"}</strong></div>
          <div>End: <strong>{contest.end_time ? new Date(contest.end_time).toLocaleString() : "—"}</strong></div>
          <div>Configured freeze: <strong>{contest.freeze_time ? new Date(contest.freeze_time).toLocaleString() : "Not configured"}</strong></div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <p className="eyebrow">Final standings</p>
        <h2>Admin leaderboard</h2>
        <p className="muted">Use the private final table for post-contest verification and awards.</p>
        <Link className="btn" style={{ marginTop: 12 }} href={`/admin/contests/${contestId}/leaderboard`}>Open final leaderboard</Link>
      </section>
    </main>
  );
}
