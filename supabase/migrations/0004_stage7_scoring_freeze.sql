-- Stage 7: scoring, penalties, and a frozen public scoreboard.

alter table public.contests
  add column if not exists penalty_minutes integer not null default 20;

alter table public.contests
  add constraint contests_nonnegative_penalty check (penalty_minutes >= 0);

alter table public.leaderboard_entries
  add column if not exists last_solved_at timestamptz;

create index if not exists idx_submissions_contest_problem_user_time
  on public.submissions(contest_id, problem_id, user_id, submitted_at);

create index if not exists idx_leaderboard_contest_score_rank
  on public.leaderboard_entries(contest_id, solved_count desc, penalty_seconds asc, last_solved_at asc);

create table if not exists public.leaderboard_public_entries (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  display_name text,
  roll_number text,
  total_score numeric not null default 0,
  penalty_seconds bigint not null default 0,
  solved_count integer not null default 0,
  rank integer,
  last_solved_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(contest_id, user_id)
);

create index if not exists idx_public_leaderboard_contest_rank
  on public.leaderboard_public_entries(contest_id, rank);

alter table public.leaderboard_public_entries enable row level security;
drop policy if exists "public_leaderboard_read" on public.leaderboard_public_entries;
create policy "public_leaderboard_read" on public.leaderboard_public_entries
  for select using (true);
drop policy if exists "public_leaderboard_admin_write" on public.leaderboard_public_entries;
create policy "public_leaderboard_admin_write" on public.leaderboard_public_entries
  for all using (public.is_admin()) with check (public.is_admin());

-- Keep public identity fields inside the public scoreboard snapshot itself.
-- This avoids exposing the profiles table (and private fields such as email).

alter table public.leaderboard_public_entries
  add column if not exists display_name text;
alter table public.leaderboard_public_entries
  add column if not exists roll_number text;

create or replace function public.refresh_leaderboard_for_user(p_contest_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start timestamptz;
  v_end timestamptz;
  v_penalty_minutes integer;
  v_type text;
begin
  select start_time, end_time, penalty_minutes, leaderboard_type
    into v_start, v_end, v_penalty_minutes, v_type
  from public.contests
  where id = p_contest_id;

  if v_start is null then v_start := now(); end if;

  insert into public.leaderboard_entries (contest_id, user_id)
  values (p_contest_id, p_user_id)
  on conflict (contest_id, user_id) do nothing;

  with ordered as (
    select s.id, s.problem_id, s.status, s.submitted_at
    from public.submissions s
    where s.contest_id = p_contest_id
      and s.user_id = p_user_id
      and s.submitted_at >= v_start
      and (v_end is null or s.submitted_at <= v_end)
  ), first_accepted as (
    select distinct on (problem_id) problem_id, submitted_at
    from ordered
    where status = 'accepted'
    order by problem_id, submitted_at, id
  ), per_problem as (
    select
      fa.problem_id,
      fa.submitted_at as accepted_at,
      greatest(0, floor(extract(epoch from (fa.submitted_at - v_start)) / 60)::bigint * 60) as elapsed_seconds,
      count(*) filter (
        where o.status in ('wrong_answer','runtime_error','time_limit','memory_limit')
          and o.submitted_at < fa.submitted_at
      ) as wrong_attempts,
      coalesce(cp.points, 0) as points
    from first_accepted fa
    join public.contest_problems cp
      on cp.contest_id = p_contest_id and cp.problem_id = fa.problem_id
    left join ordered o on o.problem_id = fa.problem_id
    group by fa.problem_id, fa.submitted_at, cp.points
  ), totals as (
    select
      case when v_type = 'icpc' then count(*)::numeric else coalesce(sum(points), 0)::numeric end as total_score,
      count(*)::integer as solved_count,
      coalesce(sum(elapsed_seconds + wrong_attempts * v_penalty_minutes * 60), 0)::bigint as penalty_seconds,
      max(accepted_at) as last_solved_at
    from per_problem
  )
  update public.leaderboard_entries l
  set total_score = totals.total_score,
      solved_count = totals.solved_count,
      penalty_seconds = totals.penalty_seconds,
      last_solved_at = totals.last_solved_at,
      updated_at = now()
  from totals
  where l.contest_id = p_contest_id and l.user_id = p_user_id;

  with ranked as (
    select id,
      row_number() over (
        order by
          case when v_type = 'icpc' then solved_count else total_score end desc,
          penalty_seconds asc,
          last_solved_at asc nulls last,
          user_id asc
      ) as new_rank
    from public.leaderboard_entries
    where contest_id = p_contest_id
  )
  update public.leaderboard_entries l
  set rank = ranked.new_rank, updated_at = now()
  from ranked where l.id = ranked.id;

  -- Public snapshot stops changing at freeze_time. The final/admin table continues updating.
  if not exists (
    select 1 from public.contests
    where id = p_contest_id and freeze_time is not null and now() >= freeze_time
  ) then
    insert into public.leaderboard_public_entries
      (contest_id, user_id, display_name, roll_number, total_score, penalty_seconds, solved_count, rank, last_solved_at, updated_at)
    select l.contest_id, l.user_id, p.full_name, p.roll_number, l.total_score, l.penalty_seconds, l.solved_count, l.rank, l.last_solved_at, now()
    from public.leaderboard_entries l
    left join public.profiles p on p.id = l.user_id
    where l.contest_id = p_contest_id
    on conflict (contest_id, user_id) do update
      set display_name = excluded.display_name,
          roll_number = excluded.roll_number,
          total_score = excluded.total_score,
          penalty_seconds = excluded.penalty_seconds,
          solved_count = excluded.solved_count,
          rank = excluded.rank,
          last_solved_at = excluded.last_solved_at,
          updated_at = now();
  end if;
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
  insert into public.leaderboard_public_entries (contest_id, user_id, display_name, roll_number)
  select new.contest_id, new.user_id, p.full_name, p.roll_number
  from public.profiles p where p.id = new.user_id
  on conflict (contest_id, user_id) do nothing;
  perform public.refresh_leaderboard_for_user(new.contest_id, new.user_id);
  return new;
end;
$$;

drop trigger if exists contest_registration_leaderboard on public.contest_registrations;
create trigger contest_registration_leaderboard
after insert on public.contest_registrations
for each row execute function public.handle_registration_leaderboard();

alter publication supabase_realtime drop table public.leaderboard_entries;
alter publication supabase_realtime add table public.leaderboard_public_entries;

insert into public.leaderboard_public_entries
  (contest_id, user_id, display_name, roll_number, total_score, penalty_seconds, solved_count, rank, last_solved_at)
select l.contest_id, l.user_id, p.full_name, p.roll_number, l.total_score, l.penalty_seconds, l.solved_count, l.rank, l.last_solved_at
from public.leaderboard_entries l
left join public.profiles p on p.id = l.user_id
where not exists (
  select 1 from public.contests c
  where c.id = l.contest_id
    and c.freeze_time is not null
    and now() >= c.freeze_time
)
on conflict (contest_id, user_id) do update
set display_name = excluded.display_name,
    roll_number = excluded.roll_number,
    total_score = excluded.total_score,
    penalty_seconds = excluded.penalty_seconds,
    solved_count = excluded.solved_count,
    rank = excluded.rank,
    last_solved_at = excluded.last_solved_at,
    updated_at = now();

-- Stage 6 refreshed on every submission status transition. Stage 7 narrows that trigger
-- to terminal judgments so queued/running transitions do not churn the scoreboard.
create or replace function public.handle_submission_leaderboard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT'
     or (new.status is distinct from old.status and new.status in ('accepted','wrong_answer','runtime_error','time_limit','memory_limit','compile_error','system_error'))
     or new.score is distinct from old.score then
    perform public.refresh_leaderboard_for_user(new.contest_id, new.user_id);
  end if;
  return new;
end;
$$;
