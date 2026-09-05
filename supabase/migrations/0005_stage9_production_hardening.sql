-- Stage 9 production hardening.
-- Keep schema changes version-controlled and deploy through CI.

create index if not exists idx_submissions_contest_user_problem_time
  on public.submissions(contest_id, user_id, problem_id, submitted_at desc);

create index if not exists idx_integrity_events_contest_user_time
  on public.integrity_events(contest_id, user_id, event_timestamp desc);

alter table public.contests
  add constraint contests_valid_window
  check (end_time is null or start_time is null or end_time > start_time);

alter table public.problems
  add constraint problems_valid_limits
  check (time_limit_ms > 0 and memory_limit_mb > 0 and points >= 0);
