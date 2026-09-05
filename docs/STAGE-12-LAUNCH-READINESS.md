# Stage 12 — Launch Readiness

## Verified locally in this environment

- Stage 5–11 structural smoke tests pass.
- Stage 12 launch-readiness smoke test passes.
- Required application, judge, migration, CI, and deployment artifacts are present.
- The judge worker uses `SUPABASE_SECRET_KEY` only; the legacy `SUPABASE_SERVICE_ROLE_KEY` fallback was removed.
- CI no longer requests pnpm caching that depends on a missing lockfile.
- Security headers, environment validation, API routes, judge hardening, and supported language configuration are present.

## Not honestly testable here

A true end-to-end run still requires:

1. Installing workspace dependencies from the package registry.
2. A real Supabase project with migrations applied.
3. A real Redis/Upstash queue.
4. A Linux host with Docker for the judge worker and language images.
5. A connected GitHub repository and Vercel project.

Do not treat this package as production-deployed until those external checks pass.

## Required E2E acceptance test

1. Create an admin account and promote it using the controlled production process.
2. Create a contest and problem.
3. Add visible samples and hidden test cases.
4. Register a participant.
5. Submit a known-good C++ program and verify `queued -> compiling -> running -> accepted`.
6. Submit a wrong program and verify `wrong_answer` and penalty behavior.
7. Verify the participant leaderboard and admin final leaderboard.
8. Freeze the public leaderboard and confirm later judgments do not alter the frozen snapshot.
9. Finalize the contest and verify final ranking.
10. Test Python, Java, and JavaScript submissions.
11. Verify failed compilation, runtime failure, timeout, memory limit, and excessive output handling.
12. Run a small staging load test before a real contest.

Supabase recommends production migrations through CI/CD, RLS testing, suitable indexes, and staging load tests. Vercel recommends preview verification and deployment checks before production promotion.
