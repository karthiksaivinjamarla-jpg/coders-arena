-- Stage 9 RLS regression checklist.
-- Run with: supabase test db
-- Add project-specific authenticated fixtures before expanding these assertions.
select tablename from pg_tables where schemaname = 'public' and rowsecurity = true order by tablename;
