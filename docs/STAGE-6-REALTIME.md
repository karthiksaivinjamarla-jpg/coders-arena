# Stage 6 — Live Verdicts + Leaderboard

## What changed

- Submission status updates stream to the participant UI with Supabase Realtime.
- A live leaderboard is available at `/contests/:contestId/leaderboard`.
- Registrations create leaderboard rows.
- Submission verdict/score changes recalculate a participant's score and contest rank.
- Realtime publication is enabled for `submissions` and `leaderboard_entries` by migration `0003_stage6_realtime_leaderboard.sql`.

## Security

Participants can only read their own submissions/results through existing RLS policies. Leaderboard rows are publicly readable according to the existing leaderboard policy. Realtime Postgres Changes also respects RLS when records are delivered to clients.

Do not expose the Supabase service/secret key to browser code.

## Realtime setup

Apply the migration to the Supabase project. The migration adds the required tables to `supabase_realtime`.

For production at larger scale, consider Supabase Broadcast with private channels rather than a large number of Postgres Changes subscriptions.
