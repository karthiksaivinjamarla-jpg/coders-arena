# Stage 9 — Production Hardening

This stage prepares Coders Arena for a real deployment without claiming that external infrastructure is already provisioned.

## Architecture
- Web: Next.js on Vercel.
- Database/Auth/Realtime: Supabase.
- Queue: Redis REST.
- Judge: dedicated Linux host with hardened containers.

## Security controls added
- Server environment validation.
- Security response headers.
- Secret-key isolation.
- Request-size guard on submissions.
- Safer health endpoint.
- Production judge compose hardening.
- Versioned database hardening migration.
- RLS regression-test entry point.

Supabase recommends RLS on every exposed table, SSL enforcement, network restrictions, MFA and a version-controlled migration workflow before production. See the official production checklist. 

Docker Rootless mode can reduce daemon/runtime privilege exposure, and seccomp further restricts available syscalls.
