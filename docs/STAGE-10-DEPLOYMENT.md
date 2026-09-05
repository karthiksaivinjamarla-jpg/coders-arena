# Stage 10 — Real Deployment & End-to-End Test

## Target topology

- **Web:** Vercel, Next.js app under `apps/web`
- **Database/Auth/Realtime:** Supabase
- **Queue:** managed Redis/Upstash REST
- **Judge:** dedicated Linux host running Docker
- **Images:** GHCR or another private/public registry
- **DNS:** custom domain pointed at Vercel

## 1. GitHub

Push the repository to GitHub and protect `main`. Require CI before merging. Do not commit `.env` files or production credentials.

## 2. Supabase

Create a production project, enable SSL enforcement and network restrictions, review Security Advisor, and enable email confirmation. Apply migrations through CI rather than editing the production database directly. Supabase recommends version-controlled migrations and CI/CD for production deployment.

Required GitHub Actions secrets:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_DB_PASSWORD` (if required by the linked CLI workflow)

Run the migration workflow and verify the schema, RLS policies, Realtime publication and seeded languages.

## 3. Redis

Create a production Redis instance with REST access. Set the same queue name on both web and judge worker. Keep the REST token server-side only.

## 4. Vercel

Create a Vercel project with the repository root as the project source. The included `vercel.json` builds the `apps/web` workspace.

Set production environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `REDIS_REST_URL`
- `REDIS_REST_TOKEN`
- `JUDGE_QUEUE_NAME`

Never place `SUPABASE_SECRET_KEY` or Redis credentials in `NEXT_PUBLIC_*` variables.

## 5. Judge host

Use a dedicated Linux host. Install Docker with a security-conscious configuration. Build/pull the four language images and start the worker with `infrastructure/production/docker-compose.judge.yml`.

Recommended additional host controls:

- firewall: allow only required management traffic
- automatic security updates
- SSH keys instead of passwords
- no public Docker daemon API
- separate service account
- monitoring and log rotation
- resource quotas appropriate to expected contest load

## 6. End-to-end test

Use a staging contest first.

1. Create participant account.
2. Confirm email if enabled.
3. Register for contest.
4. Open Arena.
5. Submit a known-correct C++ solution.
6. Verify `queued -> compiling -> running -> accepted`.
7. Submit a known-wrong solution and verify `wrong_answer`.
8. Submit code that exceeds the configured time limit and verify `time_limit`.
9. Verify submission results and score.
10. Verify leaderboard update.
11. Freeze the leaderboard.
12. Verify the public snapshot remains frozen.
13. Finalize the contest as admin.
14. Verify final ranking and audit log.

## 7. Production go/no-go

Do not announce the platform until:

- CI is green
- migrations are applied from version control
- RLS tests pass
- judge images build successfully
- real Docker execution passes in staging
- Realtime updates work
- backup/recovery procedure is documented
- rate limits and abuse controls are reviewed
- monitoring/alerting is active
