import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

const schema = z.object({
  contestId: z.string().uuid(),
  problemId: z.string().uuid(),
  languageId: z.string().uuid(),
  sourceCode: z.string().min(1).max(200_000)
});

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 300_000) return Response.json({ error: "Request too large" }, { status: 413 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid submission" }, { status: 400 });

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub as string | undefined;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: contest } = await supabase
    .from("contests")
    .select("id,status,start_time,end_time")
    .eq("id", parsed.data.contestId)
    .maybeSingle();

  if (!contest || contest.status !== "running") {
    return Response.json({ error: "Contest is not accepting submissions" }, { status: 409 });
  }

  const { data: registration } = await supabase.from("contest_registrations").select("id").eq("contest_id", parsed.data.contestId).eq("user_id", userId).maybeSingle();
  if (!registration) return Response.json({ error: "Register for the contest first" }, { status: 403 });

  const { data: language } = await supabase.from("languages").select("id").eq("id", parsed.data.languageId).eq("is_active", true).maybeSingle();
  if (!language) return Response.json({ error: "Unsupported language" }, { status: 400 });

  const { data: contestProblem } = await supabase.from("contest_problems").select("id").eq("contest_id", parsed.data.contestId).eq("problem_id", parsed.data.problemId).eq("is_visible", true).maybeSingle();
  if (!contestProblem) return Response.json({ error: "Problem is not part of this contest" }, { status: 400 });

  const now = Date.now();
  if ((contest.start_time && now < Date.parse(contest.start_time)) ||
      (contest.end_time && now > Date.parse(contest.end_time))) {
    return Response.json({ error: "Contest is outside its submission window" }, { status: 409 });
  }

  const { data, error } = await supabase.from("submissions").insert({
    contest_id: parsed.data.contestId,
    problem_id: parsed.data.problemId,
    language_id: parsed.data.languageId,
    source_code: parsed.data.sourceCode,
    user_id: userId
  }).select("id,status,submitted_at").single();

  if (error) return Response.json({ error: "Submission could not be created" }, { status: 500 });

  const redisUrl = process.env.REDIS_REST_URL;
  const redisToken = process.env.REDIS_REST_TOKEN;
  const queueName = process.env.JUDGE_QUEUE_NAME ?? "coders-arena-submissions";
  if (!redisUrl || !redisToken) {
    await createServiceClient().from("submissions").update({ status: "system_error" }).eq("id", data.id).eq("status", "queued");
    return Response.json({ error: "Judge queue is not configured" }, { status: 503 });
  }

  const queueResponse = await fetch(redisUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      "LPUSH",
      queueName,
      JSON.stringify({ submissionId: data.id, contestId: parsed.data.contestId, problemId: parsed.data.problemId, languageId: parsed.data.languageId })
    ])
  });

  if (!queueResponse.ok) {
    await createServiceClient().from("submissions").update({ status: "system_error" }).eq("id", data.id).eq("status", "queued");
    return Response.json({ error: "Submission queue is unavailable" }, { status: 503 });
  }

  return Response.json(data, { status: 201 });
}
