# Stage 7 — Scoring, Penalties and Freeze

## Modes

### ICPC mode
- Rank by solved problems (descending).
- Ties use total penalty time (ascending).
- A solved problem contributes the elapsed whole minutes from contest start to its first accepted submission.
- Each previous rejected run on a problem that is eventually solved adds the configured penalty, 20 minutes by default.
- Compile errors do not add penalty.
- Unsolved problems contribute no penalty.
- Remaining ties use the earliest last accepted solve, then user ID as a deterministic final key.

This follows the current ICPC scoring model. See the official ICPC rules for the 20-minute rejected-run rule and compile-error exception.

### Standard mode
- Rank by total problem points (descending).
- Ties use penalty time (ascending), then earliest last accepted solve.
- A solved problem contributes the configured contest-problem points.

## Freeze model

`leaderboard_entries` is the authoritative final/admin table.
`leaderboard_public_entries` is the contestant-facing snapshot.

Before `freeze_time`, the public snapshot follows the authoritative table. At or after `freeze_time`, the snapshot stops updating. This prevents later accepted runs from leaking into the public scoreboard. Admins can still inspect the authoritative table and finalize the contest.

The public scoreboard uses only `display_name` and `roll_number` copied into its snapshot; it does not expose profile email fields.
