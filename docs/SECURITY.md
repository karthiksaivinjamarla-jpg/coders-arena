# Security

1. Never execute participant code inside the Next.js/Vercel runtime.
2. Never expose Supabase secret/service-role credentials to the browser.
3. Keep private test cases inaccessible to participants.
4. Validate contest state and ownership server-side.
5. Use RLS for participant data boundaries.
6. Judge containers must run non-root, with network disabled, CPU/memory/PID/time/output limits and ephemeral workspaces.
7. Pin execution images by digest in production.
8. Treat browser visibility/focus events as signals, not proof of misconduct.
9. Add rate limits to auth, submissions and integrity-event endpoints.
10. Audit all administrative actions.
