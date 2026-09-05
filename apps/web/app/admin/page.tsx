import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const [{ count: contestCount }, { count: problemCount }, { count: submissionCount }] = await Promise.all([
    supabase.from("contests").select("id", { count: "exact", head: true }),
    supabase.from("problems").select("id", { count: "exact", head: true }),
    supabase.from("submissions").select("id", { count: "exact", head: true })
  ]);

  return (
    <main className="container">
      <div className="page-head"><div><p className="eyebrow">Coders Club • Admin</p><h1>Admin Dashboard</h1><p className="muted">Build contests, problems and test cases from one place.</p></div></div>
      <div className="grid grid-3" style={{marginTop:20}}>
        <Link className="card link-card" href="/admin/contests"><b>Contests</b><strong>{contestCount ?? 0}</strong><span>Create, schedule and manage contests.</span></Link>
        <Link className="card link-card" href="/admin/problems"><b>Problems</b><strong>{problemCount ?? 0}</strong><span>Create statements and test cases.</span></Link>
        <div className="card stat-card"><b>Submissions</b><strong>{submissionCount ?? 0}</strong><span>Queue and judging pipeline is the next stage.</span></div>
      </div>
    </main>
  );
}
