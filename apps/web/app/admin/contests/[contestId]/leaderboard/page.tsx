import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function penalty(seconds: number) {
  const minutes = Math.floor(Number(seconds || 0) / 60);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default async function AdminLeaderboardPage({ params }: { params: Promise<{ contestId: string }> }) {
  const { contestId } = await params;
  const { supabase } = await requireAdmin();
  const { data: contest } = await supabase.from("contests").select("id,title,status,leaderboard_type,penalty_minutes").eq("id", contestId).maybeSingle();
  if (!contest) notFound();
  const { data: entries } = await supabase
    .from("leaderboard_entries")
    .select("id,user_id,total_score,solved_count,penalty_seconds,rank,last_solved_at")
    .eq("contest_id", contestId)
    .order("rank", { ascending: true, nullsFirst: false });

  return <main className="container"><div className="page-head"><div><p className="eyebrow">Admin • Final standings</p><h1>{contest.title}</h1><p className="muted">{contest.status} · {contest.leaderboard_type}</p></div><Link className="btn secondary" href={`/admin/contests/${contestId}`}>Back</Link></div><section className="card" style={{ marginTop: 20 }}><div className="table-wrap"><table className="leaderboard-table"><thead><tr><th>#</th><th>User</th><th>Solved</th><th>Score</th><th>Penalty</th><th>Last solve</th></tr></thead><tbody>{(entries ?? []).map((e) => <tr key={e.id}><td>{e.rank ?? "—"}</td><td>{e.user_id.slice(0, 8)}</td><td>{e.solved_count}</td><td>{Number(e.total_score)}</td><td>{penalty(Number(e.penalty_seconds))}</td><td>{e.last_solved_at ? new Date(e.last_solved_at).toLocaleTimeString() : "—"}</td></tr>)}{!entries?.length && <tr><td colSpan={6} className="muted">No standings yet.</td></tr>}</tbody></table></div></section></main>;
}
