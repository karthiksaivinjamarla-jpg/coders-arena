# Coders Arena — Stage 13 Infrastructure Checklist

This stage connects the application to real infrastructure. Credentials are intentionally not included in the repository.

## A. GitHub

1. Create the repository and push the Stage 13 tree.
2. Protect `main` and require the CI workflow to pass.
3. Do not commit `.env`, service credentials, database passwords, Redis tokens, or Supabase secret keys.
4. Add GitHub Actions secrets required by the Supabase migration workflow.

## B. Supabase production

1. Create a production project.
2. Create the publishable and secret API keys.
3. Enable SSL enforcement and review Network Restrictions.
4. Review Security Advisor and RLS policies.
5. Enable email confirmation if appropriate for the contest.
6. Apply the migrations through the GitHub workflow.
7. Run the RLS tests against staging before production.
8. Create an admin user and promote the profile role using a controlled migration/admin procedure.

## C. Redis

1. Create a managed Redis instance with REST access.
2. Use the same `JUDGE_QUEUE_NAME` on web and judge worker.
3. Keep the Redis token server-side only.
4. Configure monitoring and an appropriate retention/eviction policy.

## D. Vercel

1. Import the GitHub repository into the intended Vercel account.
2. Keep the repository root as the project root.
3. Set production variables from `infrastructure/production/.env.web.example`.
4. Never add `SUPABASE_SECRET_KEY` or `REDIS_REST_TOKEN` with a `NEXT_PUBLIC_` prefix.
5. Redeploy after environment-variable changes.
6. Open `/api/health` and verify HTTP 200.

## E. Judge host

1. Use a dedicated Linux VM.
2. Install Docker with a hardened configuration; rootless Docker is preferred where compatible.
3. Build/pull the four judge images.
4. Copy `infrastructure/production/.env.judge.example` to a host-only `.env.judge` and fill real values.
5. Start `docker compose -f infrastructure/production/docker-compose.judge.yml up -d`.
6. Verify worker logs show Redis polling and Supabase connectivity.
7. Do not expose Docker's daemon socket or a worker HTTP API to the public internet.

## F. First staging contest

Use a dedicated staging contest and test in this order:

1. Create participant.
2. Register.
3. Submit known-correct C++.
4. Verify `queued -> compiling -> running -> accepted`.
5. Verify Realtime status update.
6. Verify leaderboard score.
7. Test wrong answer, compile error, runtime error and timeout.
8. Repeat one successful submission in Python, Java and JavaScript.
9. Freeze leaderboard and verify public snapshot stays unchanged.
10. Finalize contest and verify audit record.

## G. Go / no-go

Go live only after all staging tests pass and backups/recovery, rate limits, monitoring and rollback procedures are documented.
