# Coders Arena — Stage 14 Real Deployment Checklist

## Deployment order

1. Create the GitHub repository and push this monorepo.
2. Create separate Supabase staging and production projects.
3. Link the project with the Supabase CLI and apply migrations through CI.
4. Create a managed Redis instance for the submission queue.
5. Provision a dedicated Linux judge host with Docker.
6. Build/pull the four judge images on the judge host.
7. Configure the web environment in Vercel.
8. Deploy the Next.js app to Vercel.
9. Configure the judge worker with the production Supabase URL, secret key, and Redis settings.
10. Run the staging E2E test before opening the contest publicly.

## Required secrets

### Vercel

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `REDIS_URL`

### Judge host

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `REDIS_URL`

Never place `SUPABASE_SECRET_KEY` in browser-exposed variables, source control, client bundles, or public logs.

## Supabase

- Enable RLS on every exposed application table.
- Enable SSL enforcement.
- Review Network Restrictions.
- Enable email confirmation if required by the contest policy.
- Enable MFA for administrators.
- Run Security Advisor and Performance Advisor.
- Apply migrations through Git/CI, not ad-hoc production schema edits.
- Configure backups/PITR according to the required recovery point.

## Vercel

- Import the repository.
- Set the web app root according to the monorepo configuration.
- Add production environment variables.
- Deploy a preview first.
- Verify `/`, `/login`, `/contests`, `/dashboard`, and `/api/health`.
- Promote only after staging verification.

## Judge host

- Dedicated host; do not run arbitrary submissions on the web server.
- Docker daemon access restricted to the judge service account.
- Network disabled for submission containers.
- Non-root execution.
- Read-only root filesystem.
- Drop Linux capabilities.
- `no-new-privileges`.
- CPU, memory, PID, output, and execution-time limits.
- Keep compiler/runtime images updated.
- Do not expose Docker's API socket to the public internet.

## Staging E2E acceptance test

1. Create an admin account.
2. Create a contest.
3. Add one problem.
4. Add sample and hidden test cases.
5. Register a participant.
6. Open the arena.
7. Submit a known-correct C++ solution.
8. Confirm `queued -> compiling -> running -> accepted`.
9. Submit a known-wrong solution.
10. Confirm the expected rejection verdict.
11. Verify score and penalty.
12. Verify the participant appears on the leaderboard.
13. Freeze the leaderboard.
14. Confirm the public snapshot stops changing.
15. Finalize the contest as an administrator.

## Go-live gate

Do not announce the contest until the staging acceptance test passes on the actual production-like infrastructure.
