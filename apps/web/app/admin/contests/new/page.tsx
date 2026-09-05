import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

async function createContest(formData: FormData) {
  "use server";
  const { supabase, userId } = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const description = String(formData.get("description") ?? "").trim();
  const start = String(formData.get("start_time") ?? "").trim();
  const end = String(formData.get("end_time") ?? "").trim();
  const duration = Number(formData.get("duration_minutes") ?? 120);
  const penalty = Number(formData.get("penalty_minutes") ?? 20);
  const leaderboardType = String(formData.get("leaderboard_type") ?? "standard");
  const freeze = String(formData.get("freeze_time") ?? "").trim();
  if (!title || !slug || !start || !end) throw new Error("Title, slug, start and end time are required.");
  if (!Number.isInteger(duration) || duration <= 0 || !Number.isInteger(penalty) || penalty < 0) throw new Error("Invalid scoring settings.");
  if (!["standard", "icpc"].includes(leaderboardType)) throw new Error("Invalid leaderboard type.");
  const startDate = new Date(start);
  const endDate = new Date(end);
  const freezeDate = freeze ? new Date(freeze) : null;
  if (!(endDate > startDate)) throw new Error("End time must be after start time.");
  if (freezeDate && (freezeDate <= startDate || freezeDate >= endDate)) throw new Error("Freeze time must be between start and end.");
  const { data, error } = await supabase.from("contests").insert({
    title, slug, description,
    start_time: startDate.toISOString(),
    end_time: endDate.toISOString(),
    duration_minutes: duration,
    penalty_minutes: penalty,
    leaderboard_type: leaderboardType,
    freeze_time: freezeDate?.toISOString() ?? null,
    status: "upcoming",
    created_by: userId,
  }).select("id").single();
  if (error) throw new Error(error.message);
  redirect(`/contests/${data.id}`);
}

export default function NewContestPage() {
  return <main className="container"><div className="card form-card"><p className="eyebrow">Admin • Contests</p><h1>Create contest</h1><p className="muted">Choose how the scoreboard should rank participants.</p><form action={createContest} className="form-grid">
    <label>Title<input name="title" placeholder="Coders Arena Championship" required /></label>
    <label>Slug<input name="slug" placeholder="coders-arena-championship" required /></label>
    <label className="full">Description<textarea name="description" rows={4} placeholder="Contest description" /></label>
    <label>Start time<input name="start_time" type="datetime-local" required /></label>
    <label>End time<input name="end_time" type="datetime-local" required /></label>
    <label>Duration (minutes)<input name="duration_minutes" type="number" min="1" defaultValue="120" required /></label>
    <label>Leaderboard mode<select name="leaderboard_type" defaultValue="standard"><option value="standard">Standard — points</option><option value="icpc">ICPC — solved + penalty</option></select></label>
    <label>Wrong-answer penalty (minutes)<input name="penalty_minutes" type="number" min="0" defaultValue="20" required /></label>
    <label>Freeze time (optional)<input name="freeze_time" type="datetime-local" /><span className="muted">Public standings stop updating after this time.</span></label>
    <div className="full"><button className="btn" type="submit">Create contest</button></div>
  </form></div></main>;
}
