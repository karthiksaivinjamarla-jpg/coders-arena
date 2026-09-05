# Stage 14 — Real Infrastructure Deployment

Stage 14 moves Coders Arena from a packaged codebase to a real environment. It does not claim deployment success without access to the actual services.

The recommended architecture is:

`Browser -> Vercel/Next.js -> Supabase`

`Submission API -> Redis -> Dedicated Judge Worker -> Docker sandbox -> Supabase`

Use separate staging and production environments. Supabase recommends a Git-based migration workflow and recommends applying production migrations through CI/CD rather than manually from a developer machine. See the official Supabase deployment documentation for the current workflow.

## Why deployment is staged

A coding judge executes untrusted participant programs. The judge host must therefore remain isolated from the public web application. The web tier should never execute submitted source code.

## Credentials

Use the current Supabase publishable key in browser-facing configuration and the secret key only on trusted server/worker infrastructure. Never expose the secret key through `NEXT_PUBLIC_*` variables.

## Current limitation

The repository can be validated locally, but actual production verification requires the project's real GitHub, Vercel, Supabase, Redis, and Docker infrastructure. This stage intentionally stops short of inventing a deployment result.
