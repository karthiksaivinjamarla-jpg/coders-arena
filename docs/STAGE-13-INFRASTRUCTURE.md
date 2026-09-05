# Stage 13 — Real Infrastructure Setup

Coders Arena is now packaged for a real four-part deployment:

- Next.js web application → Vercel
- Database/Auth/Realtime → Supabase
- Submission queue → managed Redis/REST
- Untrusted-code judge → dedicated Linux + Docker host

No production credentials are stored in this repository.

## Environment boundaries

Browser-safe:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server-only:
- `SUPABASE_SECRET_KEY`
- `REDIS_REST_URL`
- `REDIS_REST_TOKEN`

Judge-host-only:
- Supabase secret key
- Redis token
- judge image names

Supabase's current key migration guidance uses publishable keys for public clients and secret keys for servers/workers; the older `anon` and `service_role` names are being deprecated by the end of 2026. See the official migration guide before production setup.

## Deployment order

1. GitHub repository
2. Supabase project + migrations
3. Redis
4. Judge images + judge host
5. Vercel environment variables
6. Vercel deployment
7. Staging contest
8. End-to-end submission test
9. Production contest

## Why the order matters

The web API can accept a submission only when the database, queue and judge worker are all available. A deployment that only makes the frontend live is not a functioning online judge.

## Stage 13 boundary

This stage does not invent credentials, create a production Supabase project, or expose a public judge service. Those actions require the owner's infrastructure accounts and explicit credentials.
