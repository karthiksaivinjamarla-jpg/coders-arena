# Stage 15 — Real Deployment & First Live Submission

Stage 15 is the handoff from a validated codebase to the user's real infrastructure. No credentials are stored in this repository and no deployment is claimed until the actual services are connected.

## 1. GitHub

Create a private repository and push the project root. Keep `.env*` files with real values out of Git.

```bash
git init
git add .
git commit -m "Coders Arena Stage 15"
git branch -M main
git remote add origin <YOUR_REPOSITORY>
git push -u origin main
```

## 2. Supabase

Create a production project and keep a separate staging project when possible. Link the repository with the Supabase CLI and preview pending migrations before applying them.

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_ID>
npx supabase db push --dry-run
npx supabase db push
```

Do not use `--include-seed` for production. Keep schema changes in migration files.

## 3. Vercel

Import the GitHub repository into Vercel. Configure the web app as the Next.js application and set the production environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `REDIS_REST_URL`
- `REDIS_REST_TOKEN`
- `JUDGE_QUEUE_NAME`

Only the first two are browser-facing. Never put `SUPABASE_SECRET_KEY` or Redis credentials in a `NEXT_PUBLIC_*` variable.

After saving environment variables, redeploy the project.

## 4. Redis

Provision a production Redis-compatible service. The public web application should enqueue work; the judge worker should be the only component that executes submissions.

## 5. Judge host

Use a dedicated Linux host for the worker. Build the four language images from `infrastructure/docker/` and run the worker with the production Compose configuration. Do not run participant code directly on the Vercel/Next.js server.

## 6. First staging test

Use a throwaway staging contest with one public sample test and at least one hidden test.

Test:

1. Create participant account.
2. Create contest.
3. Add problem.
4. Add C++ language.
5. Add sample + hidden test cases.
6. Register participant.
7. Submit a known-correct C++ solution.
8. Verify `queued -> compiling -> running -> accepted`.
9. Verify score and leaderboard.
10. Submit a deliberately incorrect solution and verify `wrong_answer`.
11. Verify frozen leaderboard behavior.

Then repeat with Python, Java, and JavaScript.

## 7. Production gate

Only promote after:

- Supabase migrations match the repository.
- RLS policies pass review.
- Web health endpoint responds successfully.
- Redis queue is reachable from the worker.
- Worker can read queued submissions.
- Docker sandbox blocks network access and applies resource limits.
- At least one successful and one failed submission have been observed.
- Leaderboard and contest freeze work as expected.
- No privileged secret is present in browser bundles.

## Important

Do not paste passwords, API tokens, Supabase secret keys, Redis tokens, or private GitHub credentials into ChatGPT. Enter them directly into the respective provider dashboards or secret stores.
