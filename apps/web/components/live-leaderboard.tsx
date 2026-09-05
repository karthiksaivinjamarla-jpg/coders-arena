"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Entry = {
  id: string;
  user_id: string;
  display_name: string | null;
  roll_number: string | null;
  total_score: number;
  solved_count: number;
  penalty_seconds: number;
  rank: number | null;
};

function formatPenalty(seconds: number) {
  const totalMinutes = Math.floor(Number(seconds || 0) / 60);
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

export function LiveLeaderboard({
  contestId,
  initialEntries,
  frozen = false,
}: {
  contestId: string;
  initialEntries: Entry[];
  frozen?: boolean;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [connection, setConnection] = useState(frozen ? "Frozen" : "Connecting…");
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (frozen) return;
    let active = true;
    const channel = supabase
      .channel(`public-leaderboard:${contestId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leaderboard_public_entries", filter: `contest_id=eq.${contestId}` },
        async () => {
          if (!active) return;
          const { data } = await supabase
            .from("leaderboard_public_entries")
            .select("id,user_id,display_name,roll_number,total_score,solved_count,penalty_seconds,rank")
            .eq("contest_id", contestId)
            .order("rank", { ascending: true, nullsFirst: false });
          if (data) setEntries(data as Entry[]);
        },
      )
      .subscribe((status) => {
        if (active) setConnection(status === "SUBSCRIBED" ? "Live" : status);
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [contestId, frozen, supabase]);

  return (
    <div>
      <div className="page-head" style={{ marginBottom: 14 }}>
        <div><span className="pill">{frozen ? "Frozen" : connection}</span></div>
        <span className="muted">{frozen ? "Public standings are locked." : "Updates automatically."}</span>
      </div>
      <div className="table-wrap">
        <table className="leaderboard-table">
          <thead><tr><th>#</th><th>Participant</th><th>Solved</th><th>Score</th><th>Penalty</th></tr></thead>
          <tbody>
            {!entries.length && <tr><td colSpan={5} className="muted">No participants yet.</td></tr>}
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.rank ?? "—"}</td>
                <td><strong>{entry.display_name || entry.roll_number || entry.user_id.slice(0, 8)}</strong>{entry.roll_number && entry.display_name ? <div className="muted">{entry.roll_number}</div> : null}</td>
                <td>{entry.solved_count}</td>
                <td>{Number(entry.total_score)}</td>
                <td>{formatPenalty(Number(entry.penalty_seconds))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
