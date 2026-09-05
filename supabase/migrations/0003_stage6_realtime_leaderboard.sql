-- Stage 6: live submission updates and leaderboard maintenance.
-- Supabase Realtime must be enabled for these tables in the project's publication.
alter publication supabase_realtime add table public.submissions;
alter publication supabase_realtime add table public.leaderboard_entries;

create or replace function public.refresh_leaderboard_for_user(p_contest_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.leaderboard_entries (contest_id, user_id)
  values (p_contest_id, p_user_id)
  on conflict (contest_id, user_id) do nothing;

  with per_problem as (
    select
      s.problem_id,
      max(s.score) as best_score
    from public.submissions s
    where s.contest_id = p_contest_id
      and s.user_id = p_user_id
      and s.status not in ('queued', 'compiling', 'running', 'system_error')
    group by s.problem_id
  ), totals as (
    select
      coalesce(sum(best_score), 0) as total_score,
      count(*) filter (where best_score > 0) as solved_count
    from per_problem
  )
  update public.leaderboard_entries l
  set total_score = totals.total_score,
      solved_count = totals.solved_count,
      updated_at = now()
  from totals
  where l.contest_id = p_contest_id
    and l.user_id = p_user_id;

  with ranked as (
    select
      id,
      dense_rank() over (
        order by total_score desc, solved_count desc, penalty_seconds asc, user_id asc
      ) as new_rank
    from public.leaderboard_entries
    where contest_id = p_contest_id
  )
  update public.leaderboard_entries l
  set rank = ranked.new_rank,
      updated_at = now()
  from ranked
  where l.id = ranked.id;
end;
$$;

create or replace function public.handle_registration_leaderboard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.leaderboard_entries (contest_id, user_id)
  values (new.contest_id, new.user_id)
  on conflict (contest_id, user_id) do nothing;
  perform public.refresh_leaderboard_for_user(new.contest_id, new.user_id);
  return new;
end;
$$;

drop trigger if exists contest_registration_leaderboard on public.contest_registrations;
create trigger contest_registration_leaderboard
after insert on public.contest_registrations
for each row execute function public.handle_registration_leaderboard();

create or replace function public.handle_submission_leaderboard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status or new.score is distinct from old.score then
    perform public.refresh_leaderboard_for_user(new.contest_id, new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists submissions_leaderboard on public.submissions;
create trigger submissions_leaderboard
after insert or update of status, score on public.submissions
for each row execute function public.handle_submission_leaderboard();

-- Seed leaderboard rows for registrations that existed before this migration.
insert into public.leaderboard_entries (contest_id, user_id)
select contest_id, user_id
from public.contest_registrations
on conflict (contest_id, user_id) do nothing;

-- Recalculate every existing participant and rank each contest.
do $$
declare
  r record;
begin
  for r in select contest_id, user_id from public.contest_registrations loop
    perform public.refresh_leaderboard_for_user(r.contest_id, r.user_id);
  end loop;
end $$;
