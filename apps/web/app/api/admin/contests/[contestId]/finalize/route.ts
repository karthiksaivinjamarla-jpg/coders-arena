import { requireAdmin } from "@/lib/auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ contestId: string }> },
) {
  const { contestId } = await params;
  const { supabase, userId } = await requireAdmin();
  const { data: contest } = await supabase.from("contests").select("id,status").eq("id", contestId).maybeSingle();
  if (!contest) return Response.json({ error: "Contest not found" }, { status: 404 });
  if (contest.status !== "frozen") return Response.json({ error: "Freeze the contest before finalizing it" }, { status: 409 });

  const { error } = await supabase.from("contests").update({ status: "ended" }).eq("id", contestId);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  await supabase.from("admin_audit_logs").insert({
    admin_id: userId,
    action: "finalize_contest",
    entity_type: "contest",
    entity_id: contestId,
    new_data: { status: "ended" },
  });
  return Response.json({ ok: true });
}
