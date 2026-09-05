# Deployment

## Web
Deploy `apps/web` to Vercel or another Node-compatible host. Required variables are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and server-only `SUPABASE_SECRET_KEY`. Add Redis variables when the submission queue is enabled.

## Database
Apply migrations in order: `0001_initial_schema.sql`, `0002_stage3_constraints.sql`, `0003_stage6_realtime_leaderboard.sql`, `0004_stage7_scoring_freeze.sql`, `0005_stage9_production_hardening.sql`. Use version-controlled migrations and CI rather than editing production schema manually.

## Judge
Run the judge worker on a dedicated Linux host. Prefer Docker Rootless mode where compatible. Keep secret keys only on controlled backend hosts. Build and test every language image before enabling contests.

## Production checklist
- RLS enabled and tested for every exposed table.
- Supabase Security Advisor reviewed.
- SSL enforcement and database network restrictions enabled.
- MFA enabled for administrators.
- Backups/PITR selected for the required recovery objective.
- Web `/api/health` returns 200.
- Each judge language passes isolated acceptance, wrong-answer, compile-error and timeout tests.
- No secret key appears in browser bundles, logs, URLs or Git.
