# Coders Arena Architecture

Browser -> Next.js -> Supabase/Postgres.

Submissions are persisted first, then queued for the judge worker. The judge worker is a separate trust boundary and should execute code only in hardened sandboxes.

Integrity events are telemetry/signals. They do not automatically submit participant code.

Production topology:

- Vercel: Next.js web
- Supabase: Auth + Postgres + Realtime/Storage as needed
- Redis: submission queue
- VPS/cloud workers: judge orchestration and sandbox execution
