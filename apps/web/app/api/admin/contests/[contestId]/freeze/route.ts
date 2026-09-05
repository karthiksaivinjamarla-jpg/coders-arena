import { requireAdmin } from "@/lib/auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ contestId: string }> },
) {
  const { contestId } = await params;
  const { supabase, userId } = await requireAdmin();
  const { data: contest, error: readError } = await supabase
    .from("contests")
    .select("id,status,freeze_time")
    .eq("id", contestId)
    .maybeSingle();

  if (readError || !contest) return Response.json({ error: "Contest not found" }, { status: 404 });
  if (contest.status === "frozen") return Response.json({ ok: true, alreadyFrozen: true });
  if (contest.status !== "running") return Response.json({ error: "Only a running contest can be frozen" }, { status: 409 });

  const freezeTime = contest.freeze_time ?? new Date().toISOString();
  const { error } = await supabase
    .from("contests")
    .update({ status: "frozen", freeze_time: freezeTime })
    .eq("id", contestId);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await supabase.from("admin_audit_logs").insert({
    admin_id: userId,
    action: "freeze_contest",
    entity_type: "contest",
    entity_id: contestId,
    new_data: { status: "frozen", freeze_time: freezeTime },
  });

  return Response.json({ ok: true, freezeTime });
}
