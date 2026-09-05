# Coders Arena

Self-hosted online judge and contest platform for Coders Club GPREC.

## Monorepo

- `apps/web` — Next.js participant/admin web app
- `apps/judge-worker` — isolated judging worker skeleton
- `packages/database` — shared database types
- `packages/validation` — shared request validation
- `supabase/migrations` — PostgreSQL schema + RLS
- `infrastructure/docker` — judge execution images
- `.github/workflows` — CI/CD

## Local setup

Requirements: Node.js 22+, pnpm 10+, Docker, Supabase CLI.

```bash
pnpm install
cp .env.example apps/web/.env.local
pnpm dev
```

Set the Supabase URL and publishable key before using auth/database features.

## Security

The browser is not a security boundary. Integrity events are telemetry signals and do not automatically submit code. Never execute untrusted submissions in the web process. The judge must use a separately hardened sandbox.


## Stage 4 queue configuration

The web app enqueues submissions through Redis REST. The judge worker polls the same queue. Set `REDIS_REST_URL`, `REDIS_REST_TOKEN`, and `JUDGE_QUEUE_NAME` in both services. The Supabase secret key must be present only in server/worker environments. Stage 4 stops jobs at `compiling`; actual untrusted-code execution is deliberately deferred to Stage 5's hardened sandbox.


## Stage 6
Live submission status and realtime leaderboard are implemented. See `docs/STAGE-6-REALTIME.md`.


## Stage 7

Stage 7 adds configurable Standard/ICPC scoring, 20-minute default penalty, deterministic ranking, public leaderboard snapshots, contest freeze/finalize controls, and an admin final leaderboard. Run `pnpm stage7:smoke` for structural checks.


## Stage 8 — Multi-language judge

The judge worker now supports four language slugs: `cpp`, `python`, `java`, and `javascript`. Each language has its own container image and source filename. Build the four images on the dedicated judge host:

```bash
docker build -t coders-arena/cpp:1 infrastructure/docker/cpp
docker build -t coders-arena/python:1 infrastructure/docker/python
docker build -t coders-arena/java:1 infrastructure/docker/java
docker build -t coders-arena/javascript:1 infrastructure/docker/javascript
```

Set the corresponding `JUDGE_*_IMAGE` variables for the worker. The worker continues to run each submission with network disabled, a read-only root filesystem, dropped capabilities, no-new-privileges, CPU/memory/PID limits, and a non-root UID. Keep the judge host separate from the web server.

Docker recommends multi-stage builds for reducing final image size and attack surface; these language images intentionally remain focused on the compiler/runtime required by the judge. See `infrastructure/docker/*/README.md`.
