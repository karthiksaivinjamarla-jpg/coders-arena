-- Stage 3 hardening: constraints, indexes and timestamp maintenance.
alter table public.contests add constraint contests_valid_window check (end_time is null or start_time is null or end_time > start_time);
alter table public.contests add constraint contests_positive_duration check (duration_minutes is null or duration_minutes > 0);
alter table public.problems add constraint problems_positive_limits check (time_limit_ms > 0 and memory_limit_mb > 0);
alter table public.test_cases add constraint test_cases_positive_points check (points > 0);
alter table public.contest_problems add constraint contest_problems_positive_points check (points > 0);
create index if not exists idx_contests_status_start on public.contests(status,start_time);
create index if not exists idx_contest_problems_contest_order on public.contest_problems(contest_id,display_order);
create index if not exists idx_test_cases_problem_order on public.test_cases(problem_id,display_order);
create index if not exists idx_registrations_contest on public.contest_registrations(contest_id);
create index if not exists idx_submissions_submitted_at on public.submissions(submitted_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists contests_set_updated_at on public.contests;
create trigger contests_set_updated_at before update on public.contests for each row execute function public.set_updated_at();
drop trigger if exists problems_set_updated_at on public.problems;
create trigger problems_set_updated_at before update on public.problems for each row execute function public.set_updated_at();
