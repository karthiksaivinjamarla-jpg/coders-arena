"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Submission = {
  id: string;
  problem_id: string;
  status: string;
  score: number;
  execution_time_ms: number | null;
  memory_kb: number | null;
  submitted_at: string;
};

const labels: Record<string, string> = {
  queued: "Queued",
  compiling: "Compiling",
  running: "Running",
  accepted: "Accepted",
  wrong_answer: "Wrong Answer",
  runtime_error: "Runtime Error",
  time_limit: "Time Limit",
  memory_limit: "Memory Limit",
  compile_error: "Compile Error",
  system_error: "System Error",
};

export function SubmissionStatus({
  contestId,
  initialSubmissions,
}: {
  contestId: string;
  initialSubmissions: Submission[];
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;
    const channel = supabase
      .channel(`contest-submissions:${contestId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "submissions",
          filter: `contest_id=eq.${contestId}`,
        },
        (payload) => {
          if (!active) return;
          if (payload.eventType === "DELETE") {
            setSubmissions((current) => current.filter((item) => item.id !== payload.old.id));
            return;
          }
          const next = payload.new as Submission;
          setSubmissions((current) => {
            const without = current.filter((item) => item.id !== next.id);
            return [next, ...without].slice(0, 25);
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [contestId, supabase]);

  return (
    <section className="card" aria-live="polite">
      <div className="page-head">
        <div>
          <p className="eyebrow">Live</p>
          <h2>My submissions</h2>
        </div>
        <span className="pill">Realtime</span>
      </div>
      <div className="stack" style={{ marginTop: 14 }}>
        {!submissions.length && <p className="muted">Your submissions will appear here.</p>}
        {submissions.map((submission) => (
          <div className="row-card submission-row" key={submission.id}>
            <div>
              <strong>{labels[submission.status] ?? submission.status}</strong>
              <div className="muted">#{submission.id.slice(0, 8)} · {new Date(submission.submitted_at).toLocaleTimeString()}</div>
            </div>
            <div className="right-meta">
              <strong>{Number(submission.score ?? 0)} pts</strong>
              <div>{submission.execution_time_ms ?? "—"} ms · {submission.memory_kb ?? "—"} KB</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
