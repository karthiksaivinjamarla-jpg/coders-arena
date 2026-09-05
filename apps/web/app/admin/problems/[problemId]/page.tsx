import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

async function addTestCase(problemId:string, formData:FormData){
  "use server";
  const {supabase}=await requireAdmin();
  const input_data=String(formData.get("input_data")??""); const expected_output=String(formData.get("expected_output")??"");
  if(!input_data||!expected_output) throw new Error("Input and expected output are required.");
  const {error}=await supabase.from("test_cases").insert({problem_id:problemId,input_data,expected_output,is_sample:formData.get("is_sample")==="on",points:Number(formData.get("points")??1),display_order:Number(formData.get("display_order")??0)});
  if(error) throw new Error(error.message);
}

export default async function ProblemAdminPage({params}:{params:Promise<{problemId:string}>}){
  const {problemId}=await params; const {supabase}=await requireAdmin();
  const {data:problem}=await supabase.from("problems").select("id,title,slug,statement,difficulty,time_limit_ms,memory_limit_mb").eq("id",problemId).maybeSingle(); if(!problem) notFound();
  const {data:tests}=await supabase.from("test_cases").select("id,is_sample,points,display_order,input_data,expected_output").eq("problem_id",problemId).order("display_order");
  return <main className="container"><div className="page-head"><div><p className="eyebrow">Problem editor</p><h1>{problem.title}</h1><p className="muted">{problem.slug} · {problem.difficulty} · {problem.time_limit_ms} ms / {problem.memory_limit_mb} MB</p></div><Link className="btn secondary" href="/admin/problems">Back</Link></div><div className="card" style={{marginTop:20}}><h2>Statement</h2><pre className="statement">{problem.statement}</pre></div><div className="grid grid-2" style={{marginTop:20}}><div className="card"><h2>Test cases ({tests?.length??0})</h2>{(tests??[]).map(t=><details key={t.id} className="test"><summary>#{t.display_order} · {t.is_sample?"Sample":"Hidden"} · {t.points} pt</summary><p><b>Input</b></p><pre>{t.input_data}</pre><p><b>Expected output</b></p><pre>{t.expected_output}</pre></details>)}</div><div className="card"><h2>Add test case</h2><form action={addTestCase.bind(null,problemId)} className="form-grid"><label className="full">Input<textarea name="input_data" rows={6} required/></label><label className="full">Expected output<textarea name="expected_output" rows={4} required/></label><label>Points<input name="points" type="number" min="1" defaultValue="1"/></label><label>Display order<input name="display_order" type="number" min="0" defaultValue={(tests?.length??0)+1}/></label><label className="check"><input name="is_sample" type="checkbox"/> Sample test</label><div className="full"><button className="btn" type="submit">Add test case</button></div></form></div></div></main>
}
