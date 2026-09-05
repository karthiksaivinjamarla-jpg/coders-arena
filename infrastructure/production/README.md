# Production deployment

## Web
Deploy `apps/web` as a Next.js application. Configure only these browser/server variables on the web project:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (server-only)
- `REDIS_REST_URL` and `REDIS_REST_TOKEN` if the web API enqueues submissions.

Never prefix a secret with `NEXT_PUBLIC_` and never commit production `.env` files.

## Judge host
Run the judge worker on a dedicated Linux host. Prefer Docker Rootless mode where compatible. Keep the host private and expose no public worker API.

## Database
Apply migrations in version order using CI. Do not make schema changes directly in production Dashboard.

## Pre-launch
1. Apply all migrations 0001-0005.
2. Run `supabase test db`.
3. Run the web health endpoint.
4. Build all four judge images.
5. Execute isolated hello-world submissions for each language.
6. Execute compile-error, wrong-answer, runtime-error and timeout cases.
7. Verify hidden test cases are not readable by participant sessions.
8. Verify frozen leaderboards do not reveal post-freeze changes.
9. Review Supabase Security Advisor.
10. Enable SSL enforcement, network restrictions, backups/PITR as appropriate.
