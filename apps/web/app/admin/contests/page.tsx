import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminContestsPage() {
  const { supabase } = await requireAdmin();
  const { data: contests } = await supabase.from("contests").select("id,slug,title,status,start_time,end_time,duration_minutes,max_participants").order("created_at", { ascending: false });
  return (
    <main className="container">
      <div className="page-head"><div><p className="eyebrow">Admin</p><h1>Contests</h1></div><Link className="btn" href="/admin/contests/new">+ New contest</Link></div>
      <div className="stack" style={{marginTop:20}}>
        {(contests ?? []).map((c) => <Link href={`/admin/contests/${c.id}`} className="card row-card" key={c.id}><div><b>{c.title}</b><p className="muted">{c.slug} · {c.status}</p></div><div className="right-meta">{c.start_time ? new Date(c.start_time).toLocaleString() : "No start time"}</div></Link>)}
        {!contests?.length && <div className="card"><h2>No contests yet</h2><p className="muted">Create your first contest.</p></div>}
      </div>
    </main>
  );
}
