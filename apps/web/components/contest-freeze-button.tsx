"use client";

import { useState } from "react";

export function ContestFreezeButton({ contestId, status }: { contestId: string; status: string }) {
  const [busy, setBusy] = useState(false);

  if (!["running", "frozen"].includes(status)) return null;

  async function change(action: "freeze" | "finalize") {
    const question = action === "freeze"
      ? "Freeze the public leaderboard now?"
      : "Finalize this contest? The public scoreboard will remain on its frozen snapshot.";
    if (!window.confirm(question)) return;
    setBusy(true);
    const response = await fetch(`/api/admin/contests/${contestId}/${action}`, { method: "POST" });
    setBusy(false);
    if (response.ok) window.location.reload();
    else window.alert((await response.json().catch(() => ({}))).error ?? "Action failed.");
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button className="btn secondary" type="button" disabled={busy || status === "frozen"} onClick={() => change("freeze")}>
        {status === "frozen" ? "Leaderboard frozen" : busy ? "Working…" : "Freeze leaderboard"}
      </button>
      {status === "frozen" && (
        <button className="btn" type="button" disabled={busy} onClick={() => change("finalize")}>
          {busy ? "Finalizing…" : "Finalize contest"}
        </button>
      )}
    </div>
  );
}
