import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function AdminProblemsPage() {
  const { supabase } = await requireAdmin();
  const { data: problems } = await supabase.from("problems").select("id,slug,title,difficulty,time_limit_ms,memory_limit_mb").order("created_at", { ascending: false });
  return <main className="container"><div className="page-head"><div><p className="eyebrow">Admin</p><h1>Problems</h1></div><Link className="btn" href="/admin/problems/new">+ New problem</Link></div><div className="grid" style={{marginTop:20}}>{(problems ?? []).map(p => <Link href={`/admin/problems/${p.id}`} className="card row-card" key={p.id}><div><b>{p.title}</b><p className="muted">{p.slug} · {p.difficulty ?? "Unrated"}</p></div><div className="right-meta">{p.time_limit_ms} ms · {p.memory_limit_mb} MB</div></Link>)}{!problems?.length && <div className="card"><h2>No problems yet</h2><p className="muted">Create a problem with sample and hidden tests.</p></div>}</div></main>;
}
