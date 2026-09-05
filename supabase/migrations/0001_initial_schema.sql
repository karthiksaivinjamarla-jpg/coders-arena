create extension if not exists pgcrypto;

create type public.user_role as enum ('participant','moderator','admin','super_admin');
create type public.contest_status as enum ('draft','registration','upcoming','running','frozen','ended','archived');
create type public.submission_status as enum ('queued','compiling','running','accepted','wrong_answer','runtime_error','time_limit','memory_limit','compile_error','system_error');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  roll_number text unique,
  department text,
  year integer,
  avatar_url text,
  role public.user_role not null default 'participant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  status public.contest_status not null default 'draft',
  registration_start timestamptz,
  registration_end timestamptz,
  start_time timestamptz,
  end_time timestamptz,
  duration_minutes integer,
  max_participants integer,
  leaderboard_type text not null default 'standard',
  freeze_time timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.problems (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  statement text not null,
  difficulty text,
  time_limit_ms integer not null default 2000,
  memory_limit_mb integer not null default 256,
  input_format text,
  output_format text,
  constraints text,
  explanation text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contest_problems (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  display_order integer not null default 0,
  points integer not null default 100,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique(contest_id, problem_id)
);

create table public.contest_registrations (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  participant_no text not null,
  registered_at timestamptz not null default now(),
  status text not null default 'registered',
  unique(contest_id, user_id),
  unique(contest_id, participant_no)
);

create table public.languages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  compiler_image text not null,
  compile_command text,
  run_command text,
  is_active boolean not null default true
);

create table public.test_cases (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problems(id) on delete cascade,
  input_data text not null,
  expected_output text not null,
  is_sample boolean not null default false,
  points integer not null default 1,
  display_order integer not null default 0
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id),
  problem_id uuid not null references public.problems(id),
  user_id uuid not null references public.profiles(id),
  language_id uuid not null references public.languages(id),
  source_code text not null,
  status public.submission_status not null default 'queued',
  score numeric not null default 0,
  execution_time_ms integer,
  memory_kb integer,
  submitted_at timestamptz not null default now()
);

create table public.submission_results (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  test_case_id uuid not null references public.test_cases(id),
  verdict text not null,
  execution_time_ms integer,
  memory_kb integer,
  stdout text,
  stderr text,
  created_at timestamptz not null default now(),
  unique(submission_id, test_case_id)
);

create table public.contest_sessions (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  status text not null default 'active'
);

create table public.integrity_events (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  event_timestamp timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  client_session uuid
);

create table public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  total_score numeric not null default 0,
  penalty_seconds bigint not null default 0,
  solved_count integer not null default 0,
  rank integer,
  updated_at timestamptz not null default now(),
  unique(contest_id, user_id)
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index idx_submissions_contest_user on public.submissions(contest_id,user_id);
create index idx_submissions_status on public.submissions(status);
create index idx_integrity_events_contest_user on public.integrity_events(contest_id,user_id);
create index idx_leaderboard_contest_rank on public.leaderboard_entries(contest_id,rank);

insert into public.languages(name,slug,compiler_image,compile_command,run_command) values
('C++','cpp','coders-arena/cpp:1','g++ -std=c++20 -O2 main.cpp -o main','./main'),
('Python','python','coders-arena/python:1',null,'python3 main.py'),
('Java','java','coders-arena/java:1','javac Main.java','java Main'),
('JavaScript','javascript','coders-arena/javascript:1',null,'node main.js');

alter table public.profiles enable row level security;
alter table public.contests enable row level security;
alter table public.problems enable row level security;
alter table public.contest_problems enable row level security;
alter table public.contest_registrations enable row level security;
alter table public.languages enable row level security;
alter table public.test_cases enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_results enable row level security;
alter table public.contest_sessions enable row level security;
alter table public.integrity_events enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.admin_audit_logs enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin','super_admin')
  );
$$;

create policy "profiles_self_read" on public.profiles
for select using (id = auth.uid() or public.is_admin());

create policy "profiles_self_update" on public.profiles
for update using (id = auth.uid() or public.is_admin());

create policy "contests_read" on public.contests
for select using (status <> 'draft' or public.is_admin());

create policy "contests_admin_write" on public.contests
for all using (public.is_admin()) with check (public.is_admin());

create policy "problems_read" on public.problems
for select using (true);

create policy "problems_admin_write" on public.problems
for all using (public.is_admin()) with check (public.is_admin());

create policy "contest_problems_read" on public.contest_problems
for select using (true);

create policy "contest_problems_admin_write" on public.contest_problems
for all using (public.is_admin()) with check (public.is_admin());

create policy "registrations_self" on public.contest_registrations
for select using (user_id = auth.uid() or public.is_admin());

create policy "registrations_insert_self" on public.contest_registrations
for insert with check (user_id = auth.uid());

create policy "languages_read" on public.languages
for select using (is_active = true or public.is_admin());

create policy "test_cases_admin" on public.test_cases
for all using (public.is_admin()) with check (public.is_admin());

create policy "submissions_self_read" on public.submissions
for select using (user_id = auth.uid() or public.is_admin());

create policy "submissions_self_insert" on public.submissions
for insert with check (user_id = auth.uid());

create policy "submission_results_self_read" on public.submission_results
for select using (
  public.is_admin()
  or exists(select 1 from public.submissions s where s.id = submission_id and s.user_id = auth.uid())
);

create policy "sessions_self" on public.contest_sessions
for select using (user_id = auth.uid() or public.is_admin());

create policy "integrity_self_or_admin" on public.integrity_events
for select using (user_id = auth.uid() or public.is_admin());

create policy "integrity_insert_self" on public.integrity_events
for insert with check (user_id = auth.uid());

create policy "leaderboard_read" on public.leaderboard_entries
for select using (true);

create policy "leaderboard_admin_write" on public.leaderboard_entries
for all using (public.is_admin()) with check (public.is_admin());

create policy "audit_admin" on public.admin_audit_logs
for select using (public.is_admin());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id,email,full_name)
  values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
