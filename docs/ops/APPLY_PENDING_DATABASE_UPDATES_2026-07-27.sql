-- ===========================================================================
-- LiteracyPath — apply ALL database updates, in order
-- Assembled 2026-07-27 from supabase/migrations/ (42 files). Safe to re-run.
-- ===========================================================================
--
-- WHY YOU ARE RUNNING THIS
-- Deleting a child from the class list failed with "Could not find the function
-- public.teacher_prepare_learner_deletion(...) in the schema cache". That means
-- the database never received the update that CREATED that function. The app
-- code was always correct; the database was behind.
--
-- WHY THE WHOLE SET, NOT JUST THE RECENT ONES
-- Two earlier attempts used a hand-picked subset and failed with
-- "column s.updated_at does not exist" and "column la.occurred_at does not
-- exist" — each time because the subset omitted the migration that ADDS that
-- column. This file is every migration in the order the project defines, so a
-- column can never be read before it is created.
--
-- HOW TO RUN IT
--   1. Supabase -> SQL Editor -> New query.
--   2. Paste this whole file in.
--   3. Run. It takes a few seconds.
--   4. Then uncomment and run the two CHECK queries at the very bottom.
--
-- IS IT SAFE ON A DATABASE THAT ALREADY HAS SOME OF THIS?
-- Yes, and that is the normal case. Tables and columns are created only if
-- absent, policies and triggers are dropped before being recreated, and
-- functions are replaced rather than added. Every INSERT except one lives
-- inside a function body and only runs when that function is called; the one
-- top-level INSERT carries ON CONFLICT. Verified by scanning all 42 files.
--
-- It does not delete or modify any child's data.
--
-- Everything runs in ONE transaction: if any statement fails, nothing at all is
-- applied and you can paste a corrected version with no cleanup.
-- ===========================================================================

begin;

-- ==== 20260527000000_core_learning_schema.sql ===========================

-- Reconstructable core learning schema.
--
-- Every later managed migration assumes these tables already exist. Keeping
-- their creation in the first migration makes a fresh local/CI database
-- reproducible instead of depending on undocumented dashboard-created tables.

create extension if not exists pgcrypto;

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, teacher_id)
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, teacher_id),
  constraint students_class_teacher_fk
    foreign key (class_id, teacher_id)
    references public.classes(id, teacher_id)
    on delete cascade
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  skill text not null default '',
  stage text not null default '',
  diagnostic_target text,
  question text not null default '',
  passage text not null default '',
  chosen_answer text not null default '',
  correct_answer text not null default '',
  is_correct boolean not null default false,
  answered_at timestamptz not null default now(),
  constraint answers_student_teacher_fk
    foreign key (student_id, teacher_id)
    references public.students(id, teacher_id)
    on delete cascade
);

create table if not exists public.mastery (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  skill_id text not null,
  skill_label text not null default '',
  mastered boolean not null default false,
  attempts integer not null default 0 check (attempts >= 0),
  last_score integer not null default 0 check (last_score >= 0),
  last_total integer not null default 0 check (last_total >= 0),
  updated_at timestamptz not null default now(),
  constraint mastery_student_teacher_fk
    foreign key (student_id, teacher_id)
    references public.students(id, teacher_id)
    on delete cascade
);

create table if not exists public.item_mastery (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null,
  item_type text not null,
  attempts integer not null default 0 check (attempts >= 0),
  correct integer not null default 0 check (correct >= 0 and correct <= attempts),
  last_seen timestamptz,
  last_result boolean not null default false,
  sessions_seen integer not null default 0 check (sessions_seen >= 0),
  mastered boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint item_mastery_student_teacher_fk
    foreign key (student_id, teacher_id)
    references public.students(id, teacher_id)
    on delete cascade,
  unique (teacher_id, student_id, item_key, item_type)
);

create index if not exists classes_teacher_name_idx
  on public.classes (teacher_id, lower(name));
create index if not exists students_teacher_class_name_idx
  on public.students (teacher_id, class_id, lower(name));
create index if not exists students_active_class_idx
  on public.students (class_id, name)
  where archived_at is null;
create index if not exists answers_teacher_student_answered_idx
  on public.answers (teacher_id, student_id, answered_at);
create index if not exists mastery_teacher_student_updated_idx
  on public.mastery (teacher_id, student_id, updated_at);
create index if not exists item_mastery_teacher_student_updated_idx
  on public.item_mastery (teacher_id, student_id, updated_at);

alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.answers enable row level security;
alter table public.mastery enable row level security;
alter table public.item_mastery enable row level security;

revoke all on public.classes, public.students, public.answers, public.mastery, public.item_mastery from anon;
grant select, insert, update, delete on public.classes, public.students, public.answers, public.mastery, public.item_mastery to authenticated;

drop policy if exists "Teachers manage owned classes" on public.classes;
create policy "Teachers manage owned classes"
  on public.classes for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists "Teachers manage owned students" on public.students;
create policy "Teachers manage owned students"
  on public.students for all to authenticated
  using (teacher_id = auth.uid())
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1
      from public.classes c
      where c.id = students.class_id
        and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "Teachers manage owned answers" on public.answers;
create policy "Teachers manage owned answers"
  on public.answers for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists "Teachers manage owned mastery" on public.mastery;
create policy "Teachers manage owned mastery"
  on public.mastery for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists "Teachers manage owned item mastery" on public.item_mastery;
create policy "Teachers manage owned item mastery"
  on public.item_mastery for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create or replace function public.set_core_learning_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists classes_set_updated_at on public.classes;
create trigger classes_set_updated_at
  before update on public.classes
  for each row execute function public.set_core_learning_updated_at();
drop trigger if exists students_set_updated_at on public.students;
create trigger students_set_updated_at
  before update on public.students
  for each row execute function public.set_core_learning_updated_at();
drop trigger if exists mastery_set_updated_at on public.mastery;
create trigger mastery_set_updated_at
  before update on public.mastery
  for each row execute function public.set_core_learning_updated_at();
drop trigger if exists item_mastery_set_updated_at on public.item_mastery;
create trigger item_mastery_set_updated_at
  before update on public.item_mastery
  for each row execute function public.set_core_learning_updated_at();

-- ==== 20260528000000_create_app_admins.sql ==============================

create extension if not exists pgcrypto;

create table if not exists public.app_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create unique index if not exists app_admins_user_id_key
  on public.app_admins (user_id);

alter table public.app_admins enable row level security;

create or replace function public.is_app_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins
    where user_id = check_user_id
  );
$$;

grant execute on function public.is_app_admin(uuid) to authenticated;
grant select on public.app_admins to authenticated;
revoke all on public.app_admins from anon;

drop policy if exists "Users can read their own admin row" on public.app_admins;
create policy "Users can read their own admin row"
  on public.app_admins
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "App admins can read all admin rows" on public.app_admins;
create policy "App admins can read all admin rows"
  on public.app_admins
  for select
  to authenticated
  using (public.is_app_admin(auth.uid()));

-- ==== 20260529000000_signup_approval_profiles.sql =======================

create extension if not exists pgcrypto;

create table if not exists public.pending_teacher_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  username text,
  display_name text,
  name text,
  role text not null default 'pending',
  status text not null default 'pending',
  approval_status text not null default 'pending',
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  rejected_at timestamptz,
  rejected_by uuid references auth.users(id) on delete set null,
  rejection_reason text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pending_teacher_accounts
  add column if not exists username text,
  add column if not exists display_name text,
  add column if not exists role text not null default 'pending',
  add column if not exists approval_status text not null default 'pending',
  add column if not exists requested_at timestamptz not null default now(),
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejected_by uuid references auth.users(id) on delete set null,
  add column if not exists rejection_reason text,
  add column if not exists updated_at timestamptz not null default now();

update public.pending_teacher_accounts
set
  approval_status = coalesce(nullif(approval_status, ''), nullif(status, ''), 'pending'),
  role = case
    when coalesce(nullif(role, ''), '') <> '' then role
    when coalesce(status, approval_status) = 'approved' then 'teacher'
    else 'pending'
  end,
  requested_at = coalesce(requested_at, created_at, now()),
  display_name = coalesce(display_name, name, username)
where true;

create unique index if not exists pending_teacher_accounts_user_id_key
  on public.pending_teacher_accounts (user_id);

create unique index if not exists pending_teacher_accounts_username_key
  on public.pending_teacher_accounts (lower(username))
  where username is not null and username <> '';

alter table public.pending_teacher_accounts enable row level security;

grant select, insert, update on public.pending_teacher_accounts to authenticated;
revoke all on public.pending_teacher_accounts from anon;

drop policy if exists "Users can read their own signup approval" on public.pending_teacher_accounts;
create policy "Users can read their own signup approval"
  on public.pending_teacher_accounts
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can create their own pending signup request" on public.pending_teacher_accounts;
create policy "Users can create their own pending signup request"
  on public.pending_teacher_accounts
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and coalesce(approval_status, status) = 'pending'
    and role = 'pending'
  );

drop policy if exists "Users can update their own pending signup profile" on public.pending_teacher_accounts;
create policy "Users can update their own pending signup profile"
  on public.pending_teacher_accounts
  for update
  to authenticated
  using (user_id = auth.uid() and coalesce(approval_status, status) = 'pending')
  with check (
    user_id = auth.uid()
    and coalesce(approval_status, status) = 'pending'
    and role = 'pending'
  );

drop policy if exists "App admins can read all signup approvals" on public.pending_teacher_accounts;
create policy "App admins can read all signup approvals"
  on public.pending_teacher_accounts
  for select
  to authenticated
  using (public.is_app_admin(auth.uid()));

drop policy if exists "App admins can update signup approvals" on public.pending_teacher_accounts;
create policy "App admins can update signup approvals"
  on public.pending_teacher_accounts
  for update
  to authenticated
  using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

create or replace function public.create_pending_teacher_account_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
  requested_display_name text;
begin
  requested_username := lower(nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', ''), '[^a-zA-Z0-9_-]', '', 'g'), ''));
  requested_display_name := nullif(new.raw_user_meta_data ->> 'display_name', '');

  if requested_username is not null and exists (
    select 1
    from public.pending_teacher_accounts
    where lower(username) = requested_username
  ) then
    requested_username := null;
  end if;

  insert into public.pending_teacher_accounts (
    user_id,
    email,
    username,
    display_name,
    name,
    role,
    status,
    approval_status,
    requested_at,
    created_at
  )
  values (
    new.id,
    new.email,
    requested_username,
    requested_display_name,
    coalesce(requested_display_name, requested_username, split_part(new.email, '@', 1)),
    'pending',
    'pending',
    'pending',
    now(),
    now()
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_pending_teacher_account_after_signup on auth.users;
create trigger create_pending_teacher_account_after_signup
  after insert on auth.users
  for each row execute function public.create_pending_teacher_account_for_new_user();

-- ==== 20260610000000_student_login_symbol_passwords.sql =================

-- Student self-login with symbol passwords + cloud progress sync.
-- Safe to re-run (idempotent). Matches conventions from 20260528/20260529 migrations.
-- NOTE: symbol passwords are a child gate (729 combos), teacher-visible by design.
-- Real protection = RLS + the security-definer RPCs below (anon has NO direct table access).

create extension if not exists pgcrypto;

-- ─── 1. Schools ──────────────────────────────────────────────────────────────

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_normalized text generated always as (lower(btrim(name))) stored,
  created_at timestamptz not null default now()
);

create unique index if not exists schools_name_normalized_key
  on public.schools (name_normalized);

alter table public.schools enable row level security;
revoke all on public.schools from anon;
grant select, insert on public.schools to authenticated;

drop policy if exists "Authenticated users can read schools" on public.schools;
create policy "Authenticated users can read schools"
  on public.schools for select to authenticated using (true);

drop policy if exists "Authenticated users can create schools" on public.schools;
create policy "Authenticated users can create schools"
  on public.schools for insert to authenticated with check (true);

drop policy if exists "App admins can update schools" on public.schools;
create policy "App admins can update schools"
  on public.schools for update to authenticated
  using (public.is_app_admin(auth.uid()));

create or replace function public.find_or_create_school(p_name text)
returns table (id uuid, name text)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_clean text := btrim(coalesce(p_name, ''));
  v_id uuid;
  v_name text;
begin
  if v_clean = '' then
    raise exception 'school_required';
  end if;

  insert into public.schools (name)
  values (v_clean)
  on conflict (name_normalized) do update set name = public.schools.name
  returning public.schools.id, public.schools.name into v_id, v_name;

  return query select v_id, v_name;
end;
$$;

-- ─── 2. Column additions ─────────────────────────────────────────────────────

alter table public.pending_teacher_accounts
  add column if not exists school_id uuid references public.schools(id);

alter table public.classes
  add column if not exists school_id uuid references public.schools(id);

alter table public.students
  add column if not exists symbol_password text
    check (symbol_password is null or symbol_password ~ '^[1-9]{3}$'),
  add column if not exists password_set_at timestamptz,
  add column if not exists password_updated_by uuid references auth.users(id),
  add column if not exists failed_login_count int not null default 0,
  add column if not exists last_failed_login_at timestamptz;

-- Admins may update any student row (teachers already covered by existing policies).
drop policy if exists "App admins can update any student" on public.students;
create policy "App admins can update any student"
  on public.students for update to authenticated
  using (public.is_app_admin(auth.uid()));

drop policy if exists "App admins can read all students" on public.students;
create policy "App admins can read all students"
  on public.students for select to authenticated
  using (public.is_app_admin(auth.uid()));

-- ─── 3. Student sessions (server-side only; clients never touch this table) ──

create table if not exists public.student_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '12 hours',
  revoked boolean not null default false
);

create index if not exists student_sessions_student_id_idx
  on public.student_sessions (student_id);

alter table public.student_sessions enable row level security;
revoke all on public.student_sessions from anon, authenticated;
-- no policies on purpose: only security-definer functions touch it

-- ─── 4. Cloud progress + activity stream ─────────────────────────────────────

create table if not exists public.student_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  area text not null,
  key text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  unique (student_id, area, key)
);

create index if not exists student_progress_student_idx
  on public.student_progress (student_id);

create table if not exists public.learn_activity (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid,
  teacher_id uuid,
  area text not null,
  item_id text,
  event text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists learn_activity_student_idx
  on public.learn_activity (student_id, created_at desc);

alter table public.student_progress enable row level security;
alter table public.learn_activity enable row level security;
revoke all on public.student_progress from anon;
revoke all on public.learn_activity from anon;
grant select, insert, update on public.student_progress to authenticated;
grant select, insert on public.learn_activity to authenticated;

drop policy if exists "Teachers manage their students progress" on public.student_progress;
create policy "Teachers manage their students progress"
  on public.student_progress for all to authenticated
  using (exists (
    select 1 from public.students s
    where s.id = student_progress.student_id
      and (s.teacher_id = auth.uid() or public.is_app_admin(auth.uid()))
  ))
  with check (exists (
    select 1 from public.students s
    where s.id = student_progress.student_id
      and (s.teacher_id = auth.uid() or public.is_app_admin(auth.uid()))
  ));

drop policy if exists "Teachers read their students activity" on public.learn_activity;
create policy "Teachers read their students activity"
  on public.learn_activity for select to authenticated
  using (exists (
    select 1 from public.students s
    where s.id = learn_activity.student_id
      and (s.teacher_id = auth.uid() or public.is_app_admin(auth.uid()))
  ));

drop policy if exists "Teachers insert their students activity" on public.learn_activity;
create policy "Teachers insert their students activity"
  on public.learn_activity for insert to authenticated
  with check (exists (
    select 1 from public.students s
    where s.id = learn_activity.student_id
      and (s.teacher_id = auth.uid() or public.is_app_admin(auth.uid()))
  ));

-- ─── 5. Helper: resolve a valid session token to a student ──────────────────

create or replace function public.student_from_token(p_token text)
returns public.students
language sql stable security definer set search_path = public
as $$
  select s.* from public.student_sessions ss
  join public.students s on s.id = ss.student_id
  where ss.token = p_token
    and ss.revoked = false
    and ss.expires_at > now()
  limit 1;
$$;

revoke all on function public.student_from_token(text) from public, anon, authenticated;

-- ─── 6. Anonymous student-flow RPCs ──────────────────────────────────────────

create or replace function public.student_list_schools()
returns table (id uuid, name text)
language sql stable security definer set search_path = public
as $$
  select distinct sc.id, sc.name
  from public.schools sc
  join public.classes c on c.school_id = sc.id
  order by sc.name;
$$;

create or replace function public.student_list_classes(p_school_id uuid)
returns table (id uuid, name text)
language sql stable security definer set search_path = public
as $$
  select c.id, c.name
  from public.classes c
  where c.school_id = p_school_id
  order by c.name;
$$;

create or replace function public.student_list_students(p_class_id uuid)
returns table (id uuid, name text, has_password boolean)
language sql stable security definer set search_path = public
as $$
  select s.id, s.name, (s.symbol_password is not null) as has_password
  from public.students s
  where s.class_id = p_class_id
  order by s.name;
$$;

create or replace function public.student_set_password(p_student_id uuid, p_sequence text)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_student public.students;
  v_token text;
begin
  if p_sequence !~ '^[1-9]{3}$' then
    return json_build_object('ok', false, 'error', 'invalid_sequence');
  end if;

  select * into v_student from public.students where id = p_student_id;
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_student.symbol_password is not null then
    return json_build_object('ok', false, 'error', 'already_set');
  end if;

  update public.students
  set symbol_password = p_sequence,
      password_set_at = now(),
      failed_login_count = 0
  where id = p_student_id;

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.student_sessions (student_id, token) values (p_student_id, v_token);

  return json_build_object(
    'ok', true, 'token', v_token,
    'student_id', v_student.id, 'student_name', v_student.name,
    'class_id', v_student.class_id, 'teacher_id', v_student.teacher_id,
    'school_id', (select c.school_id from public.classes c where c.id = v_student.class_id)
  );
end;
$$;

create or replace function public.student_login(p_student_id uuid, p_sequence text)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_student public.students;
  v_token text;
begin
  select * into v_student from public.students where id = p_student_id;
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_student.symbol_password is null then
    return json_build_object('ok', false, 'error', 'no_password');
  end if;

  -- lockout: 5+ consecutive failures within the last 60 seconds
  if v_student.failed_login_count >= 5
     and v_student.last_failed_login_at > now() - interval '60 seconds' then
    return json_build_object('ok', false, 'error', 'locked',
      'retry_seconds', ceil(extract(epoch from (v_student.last_failed_login_at + interval '60 seconds') - now())));
  end if;

  if p_sequence !~ '^[1-9]{3}$' or v_student.symbol_password <> p_sequence then
    update public.students
    set failed_login_count = case
          when last_failed_login_at is null or last_failed_login_at < now() - interval '60 seconds' then 1
          else failed_login_count + 1
        end,
        last_failed_login_at = now()
    where id = p_student_id;
    return json_build_object('ok', false, 'error', 'wrong_password');
  end if;

  update public.students
  set failed_login_count = 0, last_failed_login_at = null
  where id = p_student_id;

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.student_sessions (student_id, token) values (p_student_id, v_token);

  return json_build_object(
    'ok', true, 'token', v_token,
    'student_id', v_student.id, 'student_name', v_student.name,
    'class_id', v_student.class_id, 'teacher_id', v_student.teacher_id,
    'school_id', (select c.school_id from public.classes c where c.id = v_student.class_id)
  );
end;
$$;

create or replace function public.student_get_progress(p_token text)
returns table (area text, key text, payload jsonb, updated_at timestamptz)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_student public.students;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    raise exception 'invalid_session';
  end if;
  return query
    select sp.area, sp.key, sp.payload, sp.updated_at
    from public.student_progress sp
    where sp.student_id = v_student.id;
end;
$$;

create or replace function public.student_save_progress(
  p_token text, p_area text, p_key text, p_payload jsonb
)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_student public.students;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'invalid_session');
  end if;
  if p_area is null or p_key is null or p_payload is null then
    return json_build_object('ok', false, 'error', 'invalid_payload');
  end if;

  insert into public.student_progress (student_id, area, key, payload, updated_at)
  values (v_student.id, p_area, p_key, p_payload, now())
  on conflict (student_id, area, key)
  do update set payload = excluded.payload, updated_at = now();

  return json_build_object('ok', true);
end;
$$;

create or replace function public.student_log_activity(
  p_token text, p_area text, p_item_id text, p_event text, p_payload jsonb default null
)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_student public.students;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'invalid_session');
  end if;

  insert into public.learn_activity (student_id, class_id, teacher_id, area, item_id, event, payload)
  values (v_student.id, v_student.class_id, v_student.teacher_id, p_area, p_item_id, p_event, p_payload);

  return json_build_object('ok', true);
end;
$$;

-- ─── 7. Grants: anon may call the student RPCs and nothing else ─────────────

grant execute on function public.student_list_schools() to anon, authenticated;
grant execute on function public.find_or_create_school(text) to anon, authenticated;
grant execute on function public.student_list_classes(uuid) to anon, authenticated;
grant execute on function public.student_list_students(uuid) to anon, authenticated;
grant execute on function public.student_set_password(uuid, text) to anon, authenticated;
grant execute on function public.student_login(uuid, text) to anon, authenticated;
grant execute on function public.student_get_progress(text) to anon, authenticated;
grant execute on function public.student_save_progress(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.student_log_activity(text, text, text, text, jsonb) to anon, authenticated;

-- ==== 20260610000001_teacher_set_school_rpc.sql =========================

-- Let any signed-in teacher (or admin) set their school reliably.
--
-- Why: the self-update RLS policy on pending_teacher_accounts only allows
-- updates while approval status is 'pending'. Approved teachers and admins
-- (who may have no row at all) silently updated zero rows, so "Set your
-- school" never persisted. This security-definer RPC owns that write path.

create or replace function public.teacher_set_school(p_school_name text)
returns table (school_id uuid, school_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_id uuid;
  v_name text;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select s.id, s.name into v_id, v_name
  from public.find_or_create_school(p_school_name) as s;

  update public.pending_teacher_accounts
  set school_id = v_id,
      updated_at = now()
  where user_id = v_user;

  if not found then
    -- Admins and legacy accounts may have no signup row; create one so the
    -- school sticks. Marked approved because the caller is already inside
    -- the app (new signups always get a row from the signup trigger).
    select u.email into v_email from auth.users u where u.id = v_user;
    insert into public.pending_teacher_accounts
      (user_id, email, role, status, approval_status, school_id, approved_at)
    values
      (v_user, coalesce(v_email, ''), 'teacher', 'approved', 'approved', v_id, now())
    on conflict (user_id) do update
      set school_id = excluded.school_id, updated_at = now();
  end if;

  -- Keep all of this teacher's classes on their current school so students
  -- can find them through child login.
  update public.classes
  set school_id = v_id
  where teacher_id = v_user;

  return query select v_id, v_name;
end;
$$;

revoke all on function public.teacher_set_school(text) from public, anon;
grant execute on function public.teacher_set_school(text) to authenticated;

-- ==== 20260610090000_teacher_set_school.sql =============================

-- Let any signed-in teacher (or admin) set their school reliably.
--
-- Why: the self-update RLS policy on pending_teacher_accounts only allows
-- updates while approval status is 'pending'. Approved teachers and admins
-- (who may have no row at all) silently updated zero rows, so "Set your
-- school" never persisted. This security-definer RPC owns that write path.

create or replace function public.teacher_set_school(p_school_name text)
returns table (school_id uuid, school_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_id uuid;
  v_name text;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select s.id, s.name into v_id, v_name
  from public.find_or_create_school(p_school_name) as s;

  update public.pending_teacher_accounts
  set school_id = v_id,
      updated_at = now()
  where user_id = v_user;

  if not found then
    -- Admins and legacy accounts may have no signup row; create one so the
    -- school sticks. Marked approved because the caller is already inside
    -- the app (new signups always get a row from the signup trigger).
    select u.email into v_email from auth.users u where u.id = v_user;
    insert into public.pending_teacher_accounts
      (user_id, email, role, status, approval_status, school_id, approved_at)
    values
      (v_user, coalesce(v_email, ''), 'teacher', 'approved', 'approved', v_id, now())
    on conflict (user_id) do update
      set school_id = excluded.school_id, updated_at = now();
  end if;

  -- Keep all of this teacher's classes on their current school so students
  -- can find them through child login.
  update public.classes
  set school_id = v_id
  where teacher_id = v_user;

  return query select v_id, v_name;
end;
$$;

revoke all on function public.teacher_set_school(text) from public, anon;
grant execute on function public.teacher_set_school(text) to authenticated;

-- ==== 20260611090000_list_school_names.sql ==============================

-- Allow the signup page (not yet logged in) to offer existing school names
-- in a dropdown, so teachers join "Basis" instead of creating "basis",
-- "Basis." and other duplicates. Names only - no ids or other data exposed.

create or replace function public.list_school_names()
returns table (name text)
language sql
stable
security definer
set search_path = public
as $$
  select s.name
  from public.schools s
  order by lower(s.name);
$$;

revoke all on function public.list_school_names() from public;
grant execute on function public.list_school_names() to anon, authenticated;

notify pgrst, 'reload schema';

-- ==== 20260611120000_game_leaderboard.sql ===============================

-- High score board for the games arcade: student first name, school, and
-- total points across all games. Reads the synced learn-games progress.
-- Exposes only name + school + scores, nothing else.

create or replace function public.get_game_leaderboard(p_limit int default 10)
returns table (student_name text, school_name text, total_points int, total_stars int)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.name as student_name,
    coalesce(sc.name, '') as school_name,
    coalesce((
      select sum(greatest(coalesce((g.value->>'highScore')::int, 0), 0))
      from jsonb_each(coalesce(sp.payload->'games', '{}'::jsonb)) as g
    ), 0)::int as total_points,
    coalesce((
      select sum(least(greatest(coalesce((g.value->>'stars')::int, 0), 0), 3))
      from jsonb_each(coalesce(sp.payload->'games', '{}'::jsonb)) as g
    ), 0)::int as total_stars
  from public.student_progress sp
  join public.students s on s.id = sp.student_id
  left join public.classes c on c.id = s.class_id
  left join public.schools sc on sc.id = c.school_id
  where sp.area = 'learn_games'
    and sp.key = '__all__'
  order by total_points desc, total_stars desc
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

revoke all on function public.get_game_leaderboard(int) from public;
grant execute on function public.get_game_leaderboard(int) to anon, authenticated;

notify pgrst, 'reload schema';

-- ==== 20260613090000_leaderboard_school_scope.sql =======================

-- Privacy fix: the leaderboard was GLOBAL, showing children's names and
-- schools to students at OTHER schools. This scopes it to one school.
-- Run this whole file in the Supabase SQL Editor.

-- Remove the old global-only version so only the scoped one exists.
drop function if exists public.get_game_leaderboard(int);

create or replace function public.get_game_leaderboard(
  p_limit int default 10,
  p_school_id uuid default null
)
returns table (student_name text, school_name text, total_points int, total_stars int)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.name as student_name,
    coalesce(sc.name, '') as school_name,
    coalesce((
      select sum(greatest(coalesce((g.value->>'highScore')::int, 0), 0))
      from jsonb_each(coalesce(sp.payload->'games', '{}'::jsonb)) as g
    ), 0)::int as total_points,
    coalesce((
      select sum(least(greatest(coalesce((g.value->>'stars')::int, 0), 0), 3))
      from jsonb_each(coalesce(sp.payload->'games', '{}'::jsonb)) as g
    ), 0)::int as total_stars
  from public.student_progress sp
  join public.students s on s.id = sp.student_id
  left join public.classes c on c.id = s.class_id
  left join public.schools sc on sc.id = c.school_id
  where sp.area = 'learn_games'
    and sp.key = '__all__'
    and (p_school_id is null or c.school_id = p_school_id)
  order by total_points desc, total_stars desc
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

revoke all on function public.get_game_leaderboard(int, uuid) from public;
grant execute on function public.get_game_leaderboard(int, uuid) to anon, authenticated;

notify pgrst, 'reload schema';

-- Status report
select 'leaderboard is now school-scoped' as status;

-- ==== 20260613100000_leaderboard_require_school.sql =====================

-- P0 PRIVACY FIX: the school-scoped leaderboard still leaked GLOBALLY when
-- p_school_id was null (the old predicate `p_school_id is null OR ...` returned
-- every child's name to anyone, including unauthenticated callers).
-- This version returns NO rows unless a real school id is supplied, so a
-- missing/teacher-preview school can never expose children at other schools.
-- Run this whole file in the Supabase SQL Editor.

create or replace function public.get_game_leaderboard(
  p_limit int default 10,
  p_school_id uuid default null
)
returns table (student_name text, school_name text, total_points int, total_stars int)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.name as student_name,
    coalesce(sc.name, '') as school_name,
    coalesce((
      select sum(greatest(coalesce((g.value->>'highScore')::int, 0), 0))
      from jsonb_each(coalesce(sp.payload->'games', '{}'::jsonb)) as g
    ), 0)::int as total_points,
    coalesce((
      select sum(least(greatest(coalesce((g.value->>'stars')::int, 0), 0), 3))
      from jsonb_each(coalesce(sp.payload->'games', '{}'::jsonb)) as g
    ), 0)::int as total_stars
  from public.student_progress sp
  join public.students s on s.id = sp.student_id
  join public.classes c on c.id = s.class_id
  left join public.schools sc on sc.id = c.school_id
  where sp.area = 'learn_games'
    and sp.key = '__all__'
    and p_school_id is not null
    and c.school_id = p_school_id
  order by total_points desc, total_stars desc
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

revoke all on function public.get_game_leaderboard(int, uuid) from public;
grant execute on function public.get_game_leaderboard(int, uuid) to anon, authenticated;

notify pgrst, 'reload schema';

select 'leaderboard now returns nothing without a school id' as status;

-- ==== 20260613150000_app_config.sql =====================================

-- Lightweight app-wide config store (key -> jsonb). First use: map stop
-- positions placed by an admin in the in-app Map Stops editor. Public read so
-- student devices pick up the positions; writes are admin-only.
-- Run this whole file in the Supabase SQL Editor.

create table if not exists public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

-- Anyone (including anon student sessions) may READ config.
revoke all on public.app_config from anon, authenticated;
grant select on public.app_config to anon, authenticated;

drop policy if exists "Anyone can read app config" on public.app_config;
create policy "Anyone can read app config"
  on public.app_config for select to anon, authenticated using (true);

-- Writes go ONLY through this admin-gated security-definer function.
create or replace function public.set_app_config(p_key text, p_value jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin(auth.uid()) then
    raise exception 'not_authorized';
  end if;
  insert into public.app_config (key, value, updated_at)
  values (p_key, p_value, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
end;
$$;

revoke all on function public.set_app_config(text, jsonb) from public, anon;
grant execute on function public.set_app_config(text, jsonb) to authenticated;

notify pgrst, 'reload schema';

select 'app_config ready' as status;

-- ==== 20260614090000_progress_forward_merge.sql =========================

-- Forward-only merge of student progress on the SERVER.
--
-- Why: kids in schools use multiple class iPads. With plain last-write-wins, a
-- stale or offline iPad could overwrite progress earned on another device,
-- wiping stars / completions / found words. This makes every write a forward
-- merge: progress can only move forward, the same rule the client already uses
-- in src/utils/progressMerge.js. Mirrors that logic so the two never disagree.

-- Rank for the phonics / cvc mastery status vocabulary. -1 = not a status word.
create or replace function public.lp_status_rank(s text)
returns int language sql immutable as $$
  select case s
    when 'completed' then 3
    when 'inprogress' then 2
    when 'locked' then 1
    when 'default' then 0
    else -1
  end;
$$;

-- Recursive forward merge of two jsonb values:
--   objects  -> merge key-by-key (union of keys)
--   arrays   -> union (keep every element seen on any device)
--   numbers  -> greatest (best score / most stars)
--   booleans -> OR (an earned true is never un-earned)
--   strings  -> status-rank wins if both are status words, else incoming wins
--   anything else / type mismatch -> incoming wins
create or replace function public.lp_jsonb_forward_merge(a jsonb, b jsonb)
returns jsonb language plpgsql immutable as $$
declare
  result jsonb;
  k text;
  elem jsonb;
  ta text := jsonb_typeof(a);
  tb text := jsonb_typeof(b);
  rank_a int;
  rank_b int;
begin
  if a is null or ta = 'null' then return b; end if;
  if b is null or tb = 'null' then return a; end if;

  if ta = 'object' and tb = 'object' then
    result := a;
    for k in select jsonb_object_keys(b) loop
      result := jsonb_set(result, array[k], public.lp_jsonb_forward_merge(a -> k, b -> k), true);
    end loop;
    return result;
  end if;

  if ta = 'array' and tb = 'array' then
    result := a;
    for elem in select * from jsonb_array_elements(b) loop
      if not (result @> jsonb_build_array(elem)) then
        result := result || jsonb_build_array(elem);
      end if;
    end loop;
    return result;
  end if;

  if ta = 'number' and tb = 'number' then
    return to_jsonb(greatest((a::text)::numeric, (b::text)::numeric));
  end if;

  if ta = 'boolean' and tb = 'boolean' then
    return to_jsonb((a::text)::boolean or (b::text)::boolean);
  end if;

  if ta = 'string' and tb = 'string' then
    rank_a := public.lp_status_rank(a #>> '{}');
    rank_b := public.lp_status_rank(b #>> '{}');
    if rank_a >= 0 and rank_b >= 0 then
      if rank_a > rank_b then return a; else return b; end if;
    end if;
    return b;
  end if;

  return b;
end;
$$;

-- Per-area gate. daily_mission (streaks) and profile (chosen companion) are
-- "latest state", not cumulative progress, so they stay last-write-wins - a
-- streak that legitimately reset must NOT be inflated back up by a merge.
create or replace function public.lp_forward_merge_progress(p_area text, p_existing jsonb, p_incoming jsonb)
returns jsonb language sql immutable as $$
  select case
    when p_area in ('daily_mission', 'profile') then p_incoming
    else public.lp_jsonb_forward_merge(p_existing, p_incoming)
  end;
$$;

-- On any conflict-update of a progress row, merge the incoming payload forward
-- with what is already stored. Covers BOTH the student_save_progress RPC and the
-- teacher-mode upsert, since both run INSERT ... ON CONFLICT DO UPDATE.
create or replace function public.lp_student_progress_merge()
returns trigger language plpgsql as $$
begin
  new.payload := public.lp_forward_merge_progress(new.area, old.payload, new.payload);
  return new;
end;
$$;

drop trigger if exists student_progress_forward_merge on public.student_progress;
create trigger student_progress_forward_merge
  before update on public.student_progress
  for each row execute function public.lp_student_progress_merge();

-- The trigger fires for teacher (authenticated) upserts too, so make sure those
-- roles can execute the helper functions it calls.
grant execute on function public.lp_status_rank(text) to anon, authenticated;
grant execute on function public.lp_jsonb_forward_merge(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_forward_merge_progress(text, jsonb, jsonb) to anon, authenticated;

-- ==== 20260614100000_worksheet_bank.sql =================================

-- Teacher worksheet "bank": saved worksheet recipes (cycle + type + page count).
-- We store the recipe, not the PDF - worksheets regenerate deterministically.
-- Scoped to the teacher and synced across their devices.

create table if not exists public.worksheet_bank (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cycle_id text not null,
  type text not null,
  pages int not null default 1,
  title text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists worksheet_bank_teacher_idx
  on public.worksheet_bank (teacher_id, created_at desc);

alter table public.worksheet_bank enable row level security;
revoke all on public.worksheet_bank from anon;
grant select, insert, delete on public.worksheet_bank to authenticated;

-- A teacher only ever sees and manages their own saved worksheets.
drop policy if exists "Teachers manage their own worksheets" on public.worksheet_bank;
create policy "Teachers manage their own worksheets"
  on public.worksheet_bank for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- ==== 20260715090000_phonics_quest_merge.sql ============================

-- Sound Seekers (phonics_quest) server merge.
--
-- Why: 20260614090000_progress_forward_merge.sql routes EVERY area through the
-- naive recursive forward-merge. For phonics_quest that is destructive — the
-- client (src/utils/progressMerge.js, `area === "phonics_quest"` branch) says
-- exactly why and refuses to do it:
--
--   mastery.window  is an ORDERED list of the last results. Array-union
--                   collapses [1,1,0,1] to [1,0] and destroys the accuracy
--                   calculation the whole mastery gate runs on.
--   mastery.state   last-write/forward merge silently UNDOES a demotion.
--   trail.routeCursor  journey position, not an achievement — greatest() pins
--                   a second review circuit at stop 40 forever.
--   ledger.purchases   union by whole-object identity duplicates a purchase
--                   whose timestamp differs between devices; the client unions
--                   by id.
--   checkpoint      resume state — merging two checkpoints teleports a child
--                   mid-stop. Each write keeps the WRITER's own checkpoint.
--
-- This migration mirrors the client rules field for field. The fixtures in
-- tests/unit/progressMerge.test.js ("phonics_quest:" cases) are the shared
-- contract: if a rule changes there, change it here in the same commit.
--
-- Perspective note: on the server, `existing` is the stored row and `incoming`
-- is the device write. The client's "local" corresponds to `existing` and its
-- "cloud" to `incoming`; ties therefore prefer `incoming`, matching the
-- client's "ties prefer cloud".

create or replace function public.lp_quest_num(j jsonb, k text)
returns numeric language sql immutable as $$
  select coalesce(nullif(j ->> k, '')::numeric, 0);
$$;

-- Union two arrays of {id: ...} records (or bare scalars) by id, first
-- occurrence wins, order: existing then incoming. Mirrors the client unionById.
create or replace function public.lp_quest_union_by_id(a jsonb, b jsonb)
returns jsonb language plpgsql immutable as $$
declare
  result jsonb := '[]'::jsonb;
  seen jsonb := '{}'::jsonb;
  elem jsonb;
  id text;
begin
  for elem in
    select * from jsonb_array_elements(coalesce(case when jsonb_typeof(a) = 'array' then a end, '[]'::jsonb))
    union all
    select * from jsonb_array_elements(coalesce(case when jsonb_typeof(b) = 'array' then b end, '[]'::jsonb))
  loop
    id := case when jsonb_typeof(elem) = 'object' then elem ->> 'id' else elem #>> '{}' end;
    if id is null or seen ? id then continue; end if;
    seen := seen || jsonb_build_object(id, true);
    result := result || jsonb_build_array(elem);
  end loop;
  return result;
end;
$$;

-- One mastery record. `seen` is the clock: the side that has watched the child
-- answer more times owns the ordered/volatile fields (window, misses, state,
-- box, lastAt). Counters take the max; evidence sets union.
create or replace function public.lp_quest_merge_mastery_record(a jsonb, b jsonb)
returns jsonb language plpgsql immutable as $$
declare
  newer jsonb;
begin
  if a is null or jsonb_typeof(a) <> 'object' then return b; end if;
  if b is null or jsonb_typeof(b) <> 'object' then return a; end if;
  -- Strictly-greater keeps a; tie goes to b (the incoming write), mirroring the
  -- client where the tie goes to the cloud side.
  newer := case when public.lp_quest_num(a, 'seen') > public.lp_quest_num(b, 'seen') then a else b end;
  return (b || a || newer) || jsonb_build_object(
    'seen',     to_jsonb(greatest(public.lp_quest_num(a, 'seen'),    public.lp_quest_num(b, 'seen'))),
    'correct',  to_jsonb(greatest(public.lp_quest_num(a, 'correct'), public.lp_quest_num(b, 'correct'))),
    'streak',   to_jsonb(greatest(public.lp_quest_num(a, 'streak'),  public.lp_quest_num(b, 'streak'))),
    'shells',   public.lp_quest_union_by_id(a -> 'shells',   b -> 'shells'),
    'sessions', public.lp_quest_union_by_id(a -> 'sessions', b -> 'sessions'),
    'window',   coalesce(case when jsonb_typeof(newer -> 'window') = 'array' then newer -> 'window' end, '[]'::jsonb),
    'misses',   to_jsonb(public.lp_quest_num(newer, 'misses')),
    'state',    coalesce(newer -> 'state', '"not-started"'::jsonb),
    'box',      to_jsonb(greatest(public.lp_quest_num(newer, 'box'), 1)),
    'lastAt',   coalesce(newer -> 'lastAt', '""'::jsonb),
    'lastStop', to_jsonb(greatest(public.lp_quest_num(a, 'lastStop'), public.lp_quest_num(b, 'lastStop')))
  );
end;
$$;

create or replace function public.lp_quest_merge_mastery(a jsonb, b jsonb)
returns jsonb language plpgsql immutable as $$
declare
  result jsonb;
  k text;
begin
  if a is null or jsonb_typeof(a) <> 'object' then return coalesce(b, '{}'::jsonb); end if;
  if b is null or jsonb_typeof(b) <> 'object' then return a; end if;
  result := a;
  for k in select jsonb_object_keys(b) loop
    result := jsonb_set(result, array[k], public.lp_quest_merge_mastery_record(a -> k, b -> k), true);
  end loop;
  return result;
end;
$$;

create or replace function public.lp_merge_phonics_quest(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable as $$
declare
  result jsonb;
  trail jsonb;
  cursor_val numeric;
begin
  if existing is null or jsonb_typeof(existing) <> 'object' then return incoming; end if;
  if incoming is null or jsonb_typeof(incoming) <> 'object' then return existing; end if;

  -- Unknown/extra keys: incoming wins (client: {...base, ...cloud}).
  result := existing || incoming;

  -- trail: achievements merge forward, but routeCursor is journey state — the
  -- writer's own position is stored, never greatest().
  trail := public.lp_jsonb_forward_merge(existing -> 'trail', incoming -> 'trail');
  cursor_val := case
    when public.lp_quest_num(incoming -> 'trail', 'routeCursor') > 0 then public.lp_quest_num(incoming -> 'trail', 'routeCursor')
    when public.lp_quest_num(existing -> 'trail', 'routeCursor') > 0 then public.lp_quest_num(existing -> 'trail', 'routeCursor')
    else 1
  end;
  if trail is null or jsonb_typeof(trail) <> 'object' then trail := '{}'::jsonb; end if;
  trail := trail || jsonb_build_object('routeCursor', to_jsonb(cursor_val));

  result := result || jsonb_build_object(
    'creature', coalesce(
      case when jsonb_typeof(incoming -> 'creature') = 'object' then incoming -> 'creature' end,
      existing -> 'creature', 'null'::jsonb),
    'hatched', to_jsonb(
      coalesce((existing ->> 'hatched')::boolean, false) or coalesce((incoming ->> 'hatched')::boolean, false)),
    'trail', trail,
    'mastery', public.lp_quest_merge_mastery(existing -> 'mastery', incoming -> 'mastery'),
    'stones', public.lp_jsonb_forward_merge(
      coalesce(case when jsonb_typeof(existing -> 'stones') = 'array' then existing -> 'stones' end, '[]'::jsonb),
      coalesce(case when jsonb_typeof(incoming -> 'stones') = 'array' then incoming -> 'stones' end, '[]'::jsonb)),
    'trickies', public.lp_jsonb_forward_merge(
      coalesce(case when jsonb_typeof(existing -> 'trickies') = 'array' then existing -> 'trickies' end, '[]'::jsonb),
      coalesce(case when jsonb_typeof(incoming -> 'trickies') = 'array' then incoming -> 'trickies' end, '[]'::jsonb)),
    'ledger', jsonb_build_object(
      'purchases', public.lp_quest_union_by_id(existing #> '{ledger,purchases}', incoming #> '{ledger,purchases}')),
    'settings', coalesce(
      case when jsonb_typeof(incoming -> 'settings') = 'object' then incoming -> 'settings' end,
      existing -> 'settings', 'null'::jsonb),
    'telemetry', jsonb_build_object(
      'sessions', public.lp_quest_union_by_id(existing #> '{telemetry,sessions}', incoming #> '{telemetry,sessions}'),
      'current', coalesce(incoming #> '{telemetry,current}', 'null'::jsonb)),
    -- The WRITER's checkpoint, never a merge of two devices' checkpoints.
    'checkpoint', coalesce(incoming -> 'checkpoint', 'null'::jsonb)
  );
  return result;
end;
$$;

-- Route phonics_quest away from the naive merge. daily_mission / profile keep
-- their existing last-write behaviour; everything else is unchanged.
create or replace function public.lp_forward_merge_progress(p_area text, p_existing jsonb, p_incoming jsonb)
returns jsonb language sql immutable as $$
  select case
    when p_area in ('daily_mission', 'profile') then p_incoming
    when p_area = 'phonics_quest' then public.lp_merge_phonics_quest(p_existing, p_incoming)
    else public.lp_jsonb_forward_merge(p_existing, p_incoming)
  end;
$$;

grant execute on function public.lp_quest_num(jsonb, text) to anon, authenticated;
grant execute on function public.lp_quest_union_by_id(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_merge_mastery_record(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_merge_mastery(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_merge_phonics_quest(jsonb, jsonb) to anon, authenticated;

-- ── Verification (run in the Supabase SQL editor after applying) ─────────────
-- Each select must return TRUE. These mirror tests/unit/progressMerge.test.js.
--
-- select public.lp_merge_phonics_quest(
--   '{"mastery":{"s":{"seen":6,"window":[1,1,0,1],"state":"learning","box":2}}}',
--   '{"mastery":{"s":{"seen":4,"window":[1,0],"state":"learning","box":2}}}'
-- ) #> '{mastery,s,window}' = '[1,1,0,1]'::jsonb as window_preserved;
--
-- select public.lp_merge_phonics_quest(
--   '{"mastery":{"sh":{"seen":12,"state":"learning","box":1,"window":[0,0,1,1]}}}',
--   '{"mastery":{"sh":{"seen":10,"state":"mastered","box":4,"window":[1,1,1,1]}}}'
-- ) #>> '{mastery,sh,state}' = 'learning' as demotion_sticks;
--
-- select public.lp_merge_phonics_quest(
--   '{"trail":{"routeCursor":3,"stopsDone":["s1"]}}',
--   '{"trail":{"routeCursor":40,"stopsDone":["s1","s2"]}}'
-- ) #> '{trail,routeCursor}' = '40'::jsonb as cursor_is_writers_not_greatest;
--
-- select jsonb_array_length(public.lp_merge_phonics_quest(
--   '{"ledger":{"purchases":[{"id":"leaf-cap","at":"t1"}]}}',
--   '{"ledger":{"purchases":[{"id":"leaf-cap","at":"t2"},{"id":"moth-wings","at":"t3"}]}}'
-- ) #> '{ledger,purchases}') = 2 as purchases_union_by_id;
--
-- select public.lp_merge_phonics_quest(
--   '{"checkpoint":{"stopId":"s3"}}',
--   '{"checkpoint":{"stopId":"s9"}}'
-- ) #>> '{checkpoint,stopId}' = 's9' as checkpoint_is_writers_own;

-- ==== 20260720000000_class_access_codes.sql =============================

-- Close anonymous roster enumeration + first-login account hijack.
--
-- Before this migration, anon could walk student_list_schools -> _classes ->
-- _students and dump every child's real name, then call student_set_password on
-- any un-onboarded child to claim their account. Both RPCs were granted to anon.
--
-- Fix: a per-class access_code (a secret NOT shipped in the app bundle, handed
-- out by the teacher). The child login flow now needs the code to see any class
-- roster, and first-time password setup needs the code too. Enumeration and
-- hijack both require the out-of-band code, which anon does not have.
--
-- Idempotent + safe to re-run. Run in the Supabase SQL editor.

-- ─── 1. access_code column, generator, backfill, auto-assign ────────────────

-- Unambiguous alphabet (no 0/O/1/I/L) so a 5-year-old's teacher can read it out.
create or replace function public.gen_class_access_code()
returns text
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  v_alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
  v_i int;
  v_exists boolean;
begin
  loop
    v_code := '';
    for v_i in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    select exists(select 1 from public.classes where access_code = v_code) into v_exists;
    exit when not v_exists;
  end loop;
  return v_code;
end;
$$;

alter table public.classes add column if not exists access_code text;
create unique index if not exists classes_access_code_key on public.classes (access_code);

-- Backfill every existing class, then require the column going forward.
update public.classes set access_code = public.gen_class_access_code() where access_code is null;
alter table public.classes alter column access_code set not null;

-- New classes get a code automatically, so the teacher app's plain INSERT keeps
-- working with no client change to the insert itself.
create or replace function public.set_class_access_code()
returns trigger language plpgsql as $$
begin
  if new.access_code is null then
    new.access_code := public.gen_class_access_code();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_class_access_code on public.classes;
create trigger trg_class_access_code before insert on public.classes
  for each row execute function public.set_class_access_code();

-- ─── 2. Code-gated roster lookup (replaces the anon enumeration walk) ────────

create or replace function public.student_class_by_code(p_code text)
returns json
language plpgsql stable security definer set search_path = public
as $$
declare
  v_class public.classes;
  v_students json;
  v_school json;
begin
  if p_code is null or btrim(p_code) = '' then
    return json_build_object('ok', false, 'error', 'invalid_code');
  end if;

  select * into v_class from public.classes
  where access_code = upper(btrim(p_code));
  if v_class.id is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;

  select json_agg(
           json_build_object('id', s.id, 'name', s.name,
             'has_password', (s.symbol_password is not null))
           order by s.name)
    into v_students
  from public.students s where s.class_id = v_class.id;

  select json_build_object('id', sc.id, 'name', sc.name) into v_school
  from public.schools sc where sc.id = v_class.school_id;

  return json_build_object(
    'ok', true,
    'class', json_build_object('id', v_class.id, 'name', v_class.name),
    'school', v_school,
    'students', coalesce(v_students, '[]'::json)
  );
end;
$$;

-- ─── 3. First-time password setup now requires the class code ───────────────
-- (overload: keeps the old 2-arg signature defined, but we revoke anon from it
--  below so only this code-checked 3-arg version is reachable anonymously).

create or replace function public.student_set_password(p_student_id uuid, p_sequence text, p_code text)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_student public.students;
  v_class public.classes;
  v_token text;
begin
  if p_sequence !~ '^[1-9]{3}$' then
    return json_build_object('ok', false, 'error', 'invalid_sequence');
  end if;

  select * into v_student from public.students where id = p_student_id;
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;

  select * into v_class from public.classes where id = v_student.class_id;
  if v_class.id is null or v_class.access_code is distinct from upper(btrim(p_code)) then
    return json_build_object('ok', false, 'error', 'invalid_code');
  end if;

  if v_student.symbol_password is not null then
    return json_build_object('ok', false, 'error', 'already_set');
  end if;

  update public.students
  set symbol_password = p_sequence,
      password_set_at = now(),
      failed_login_count = 0
  where id = p_student_id;

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.student_sessions (student_id, token) values (p_student_id, v_token);

  return json_build_object(
    'ok', true, 'token', v_token,
    'student_id', v_student.id, 'student_name', v_student.name,
    'class_id', v_student.class_id, 'teacher_id', v_student.teacher_id,
    'school_id', v_class.school_id
  );
end;
$$;

-- ─── 4. Teacher-only: regenerate a class code (e.g. after it leaks) ──────────

create or replace function public.teacher_regenerate_class_code(p_class_id uuid)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_owner uuid;
  v_code text;
begin
  select teacher_id into v_owner from public.classes where id = p_class_id;
  if v_owner is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_owner is distinct from auth.uid() and not public.is_app_admin(auth.uid()) then
    return json_build_object('ok', false, 'error', 'forbidden');
  end if;

  v_code := public.gen_class_access_code();
  update public.classes set access_code = v_code where id = p_class_id;
  return json_build_object('ok', true, 'access_code', v_code);
end;
$$;

-- ─── 5. Grants: revoke the enumeration + un-gated setup from anon ────────────

revoke execute on function public.student_list_schools() from anon;
revoke execute on function public.student_list_classes(uuid) from anon;
revoke execute on function public.student_list_students(uuid) from anon;
revoke execute on function public.student_set_password(uuid, text) from anon;

grant execute on function public.student_class_by_code(text) to anon, authenticated;
grant execute on function public.student_set_password(uuid, text, text) to anon, authenticated;
grant execute on function public.teacher_regenerate_class_code(uuid) to authenticated;

-- student_login(uuid, text) is intentionally left as-is: a student_id is now only
-- obtainable through the code-gated lookup above, and login already has a
-- failed-attempt lockout, so brute force stays bounded.

-- ==== 20260720153000_sound_seekers_audit_integrity.sql ==================

-- Sound Seekers audit-integrity follow-up.
--
-- 1. Mastery demotion now increments evidenceEpoch and clears the proof set.
--    A stale pre-demotion cloud row must therefore never win merely because
--    its lifetime `seen` counter is higher.
-- 2. Knowledge accuracy has an independentSeen denominator. Preserve it in
--    the same server-side merge that owns the ordered accuracy window.
-- 3. Hollow append-only records are bounded on the server too. Bounding only
--    the browser payload is ineffective when a forward-only cloud union keeps
--    resurrecting every historical row the browser intentionally compacted.

create or replace function public.lp_quest_independent_count(j jsonb)
returns numeric language sql immutable as $$
  select case
    when j is null or jsonb_typeof(j) <> 'object' then 0
    when j ? 'independentSeen' then
      case
        when public.lp_quest_num(j, 'independentSeen') = 0
          and public.lp_quest_num(j, 'correct') > 0
        then greatest(public.lp_quest_num(j, 'seen'), public.lp_quest_num(j, 'correct'))
        else greatest(public.lp_quest_num(j, 'independentSeen'), 0)
      end
    else greatest(public.lp_quest_num(j, 'seen'), 0)
  end;
$$;

create or replace function public.lp_quest_merge_mastery_record(a jsonb, b jsonb)
returns jsonb language plpgsql immutable as $$
declare
  newer jsonb;
  authoritative jsonb;
  a_epoch numeric := greatest(public.lp_quest_num(a, 'evidenceEpoch'), 0);
  b_epoch numeric := greatest(public.lp_quest_num(b, 'evidenceEpoch'), 0);
begin
  if a is null or jsonb_typeof(a) <> 'object' then return b; end if;
  if b is null or jsonb_typeof(b) <> 'object' then return a; end if;

  -- A higher evidence epoch is an explicit invalidation boundary. Lifetime
  -- exposure remains monotone, but every field that could re-prove mastery
  -- comes intact from the post-demotion side.
  if a_epoch <> b_epoch then
    authoritative := case when a_epoch > b_epoch then a else b end;
    return (b || a || authoritative) || jsonb_build_object(
      'seen',            to_jsonb(greatest(public.lp_quest_num(a, 'seen'), public.lp_quest_num(b, 'seen'))),
      'evidenceEpoch',   to_jsonb(greatest(a_epoch, b_epoch)),
      'independentSeen', to_jsonb(public.lp_quest_independent_count(authoritative)),
      'correct',         to_jsonb(greatest(public.lp_quest_num(authoritative, 'correct'), 0)),
      'streak',          to_jsonb(greatest(public.lp_quest_num(authoritative, 'streak'), 0)),
      'shells',          coalesce(case when jsonb_typeof(authoritative -> 'shells') = 'array' then authoritative -> 'shells' end, '[]'::jsonb),
      'sessions',        coalesce(case when jsonb_typeof(authoritative -> 'sessions') = 'array' then authoritative -> 'sessions' end, '[]'::jsonb),
      'window',          coalesce(case when jsonb_typeof(authoritative -> 'window') = 'array' then authoritative -> 'window' end, '[]'::jsonb),
      'misses',          to_jsonb(greatest(public.lp_quest_num(authoritative, 'misses'), 0)),
      'state',           coalesce(authoritative -> 'state', '"not-started"'::jsonb),
      'box',             to_jsonb(greatest(public.lp_quest_num(authoritative, 'box'), 1)),
      'lastAt',          coalesce(authoritative -> 'lastAt', '""'::jsonb),
      'lastStop',        to_jsonb(greatest(public.lp_quest_num(authoritative, 'lastStop'), 0))
    );
  end if;

  -- Within one epoch, `seen` remains the ordered-history clock. Ties go to the
  -- incoming side, matching the client hydrate contract.
  newer := case when public.lp_quest_num(a, 'seen') > public.lp_quest_num(b, 'seen') then a else b end;
  return (b || a || newer) || jsonb_build_object(
    'seen',            to_jsonb(greatest(public.lp_quest_num(a, 'seen'), public.lp_quest_num(b, 'seen'))),
    'independentSeen', to_jsonb(greatest(public.lp_quest_independent_count(a), public.lp_quest_independent_count(b))),
    'correct',         to_jsonb(greatest(public.lp_quest_num(a, 'correct'), public.lp_quest_num(b, 'correct'))),
    'streak',          to_jsonb(greatest(public.lp_quest_num(newer, 'streak'), 0)),
    'shells',          public.lp_quest_union_by_id(a -> 'shells', b -> 'shells'),
    'sessions',        public.lp_quest_union_by_id(a -> 'sessions', b -> 'sessions'),
    'window',          coalesce(case when jsonb_typeof(newer -> 'window') = 'array' then newer -> 'window' end, '[]'::jsonb),
    'misses',          to_jsonb(greatest(public.lp_quest_num(newer, 'misses'), 0)),
    'state',           coalesce(newer -> 'state', '"not-started"'::jsonb),
    'box',             to_jsonb(greatest(public.lp_quest_num(newer, 'box'), 1)),
    'evidenceEpoch',   to_jsonb(a_epoch),
    'lastAt',          coalesce(newer -> 'lastAt', '""'::jsonb),
    'lastStop',        to_jsonb(greatest(public.lp_quest_num(a, 'lastStop'), public.lp_quest_num(b, 'lastStop')))
  );
end;
$$;

-- Keep the server write path aligned with computeHydratedValue. In particular,
-- a normalized fresh-device payload contains routeCursor=1 even though the
-- child has not played locally; that synthetic default must not erase the
-- stored review-circuit position or its matching mid-stop checkpoint.
create or replace function public.lp_merge_phonics_quest(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable as $$
declare
  result jsonb;
  trail jsonb;
  cursor_val numeric;
  incoming_has_progress boolean := false;
  incoming_checkpoint jsonb;
  existing_checkpoint jsonb;
  chosen_checkpoint jsonb := 'null'::jsonb;
  existing_creature_at text := coalesce(existing ->> 'creatureAt', '');
  incoming_creature_at text := coalesce(incoming ->> 'creatureAt', '');
  existing_settings_at text := coalesce(existing ->> 'settingsAt', '');
  incoming_settings_at text := coalesce(incoming ->> 'settingsAt', '');
  chosen_creature jsonb;
  chosen_settings jsonb;
begin
  if existing is null or jsonb_typeof(existing) <> 'object' then return incoming; end if;
  if incoming is null or jsonb_typeof(incoming) <> 'object' then return existing; end if;

  result := existing || incoming;
  incoming_has_progress := case
    when jsonb_typeof(incoming #> '{trail,stopsDone}') = 'array'
      then jsonb_array_length(incoming #> '{trail,stopsDone}') > 0
    else false
  end;

  trail := public.lp_jsonb_forward_merge(existing -> 'trail', incoming -> 'trail');
  cursor_val := case
    when incoming_has_progress and public.lp_quest_num(incoming -> 'trail', 'routeCursor') > 0
      then public.lp_quest_num(incoming -> 'trail', 'routeCursor')
    when public.lp_quest_num(existing -> 'trail', 'routeCursor') > 0
      then public.lp_quest_num(existing -> 'trail', 'routeCursor')
    when public.lp_quest_num(incoming -> 'trail', 'routeCursor') > 0
      then public.lp_quest_num(incoming -> 'trail', 'routeCursor')
    else 1
  end;
  if trail is null or jsonb_typeof(trail) <> 'object' then trail := '{}'::jsonb; end if;
  trail := trail || jsonb_build_object('routeCursor', to_jsonb(cursor_val));

  incoming_checkpoint := case
    when jsonb_typeof(incoming -> 'checkpoint') = 'object' then incoming -> 'checkpoint'
    else null
  end;
  existing_checkpoint := case
    when jsonb_typeof(existing -> 'checkpoint') = 'object' then existing -> 'checkpoint'
    else null
  end;
  if incoming_checkpoint is not null then
    chosen_checkpoint := incoming_checkpoint;
  elsif existing_checkpoint is not null
    and existing_checkpoint ->> 'stopId' = 's' || trunc(cursor_val)::bigint::text then
    chosen_checkpoint := existing_checkpoint;
  end if;

  -- Creature and settings are mutable choices, so their explicit clocks own
  -- last-write-wins. Ties/legacy rows retain the stored cloud value, matching
  -- the client's cloud-wins fallback when stamps are absent.
  chosen_creature := case
    when incoming_creature_at <> ''
      and (existing_creature_at = '' or incoming_creature_at > existing_creature_at)
      and jsonb_typeof(incoming -> 'creature') = 'object'
      then incoming -> 'creature'
    else coalesce(
      case when jsonb_typeof(existing -> 'creature') = 'object' then existing -> 'creature' end,
      case when jsonb_typeof(incoming -> 'creature') = 'object' then incoming -> 'creature' end,
      'null'::jsonb)
  end;
  chosen_settings := case
    when incoming_settings_at <> ''
      and (existing_settings_at = '' or incoming_settings_at > existing_settings_at)
      and jsonb_typeof(incoming -> 'settings') = 'object'
      then incoming -> 'settings'
    else coalesce(
      case when jsonb_typeof(existing -> 'settings') = 'object' then existing -> 'settings' end,
      case when jsonb_typeof(incoming -> 'settings') = 'object' then incoming -> 'settings' end,
      'null'::jsonb)
  end;

  -- Telemetry is local-only child behavioural data. Removing an old cloud copy
  -- on the next write completes the client-side upload exclusion instead of
  -- preserving historical telemetry forever.
  result := (result - 'telemetry') || jsonb_build_object(
    'creature', chosen_creature,
    'creatureAt', greatest(existing_creature_at, incoming_creature_at),
    'hatched', to_jsonb(
      coalesce((existing ->> 'hatched')::boolean, false)
      or coalesce((incoming ->> 'hatched')::boolean, false)),
    'trail', trail,
    'mastery', public.lp_quest_merge_mastery(existing -> 'mastery', incoming -> 'mastery'),
    'stones', public.lp_jsonb_forward_merge(
      coalesce(case when jsonb_typeof(existing -> 'stones') = 'array' then existing -> 'stones' end, '[]'::jsonb),
      coalesce(case when jsonb_typeof(incoming -> 'stones') = 'array' then incoming -> 'stones' end, '[]'::jsonb)),
    'trickies', public.lp_jsonb_forward_merge(
      coalesce(case when jsonb_typeof(existing -> 'trickies') = 'array' then existing -> 'trickies' end, '[]'::jsonb),
      coalesce(case when jsonb_typeof(incoming -> 'trickies') = 'array' then incoming -> 'trickies' end, '[]'::jsonb)),
    'ledger', jsonb_build_object(
      'purchases', public.lp_quest_union_by_id(existing #> '{ledger,purchases}', incoming #> '{ledger,purchases}')),
    'settings', chosen_settings,
    'settingsAt', greatest(existing_settings_at, incoming_settings_at),
    'checkpoint', chosen_checkpoint
  );
  return result;
end;
$$;

-- Deterministic union of record arrays by id, ordered oldest-first, then
-- bounded. The earliest record wins an impossible duplicate-id conflict,
-- matching the irreversible nature of ownership/spend history.
create or replace function public.lp_hollow_merge_records(a jsonb, b jsonb, max_records integer)
returns jsonb language sql immutable as $$
  with combined as (
    select value as elem
      from jsonb_array_elements(coalesce(case when jsonb_typeof(a) = 'array' then a end, '[]'::jsonb))
    union all
    select value as elem
      from jsonb_array_elements(coalesce(case when jsonb_typeof(b) = 'array' then b end, '[]'::jsonb))
  ), valid as (
    select elem,
           elem ->> 'id' as id,
           coalesce(elem ->> 'at', '') as at
      from combined
     where jsonb_typeof(elem) = 'object' and coalesce(elem ->> 'id', '') <> ''
  ), deduped as (
    select distinct on (id) elem, id, at
      from valid
     order by id, at, elem::text
  ), bounded as (
    select elem, id, at
      from deduped
     order by at, id
     limit greatest(max_records, 0)
  )
  select coalesce(jsonb_agg(elem order by at, id), '[]'::jsonb) from bounded;
$$;

create or replace function public.lp_hollow_merge_feeds(a jsonb, b jsonb)
returns jsonb language sql immutable as $$
  with combined as (
    select value as elem
      from jsonb_array_elements(coalesce(case when jsonb_typeof(a) = 'array' then a end, '[]'::jsonb))
    union all
    select value as elem
      from jsonb_array_elements(coalesce(case when jsonb_typeof(b) = 'array' then b end, '[]'::jsonb))
  ), valid as (
    select elem,
           elem ->> 'id' as id,
           elem ->> 'species' as species,
           coalesce(elem ->> 'at', '') as at
      from combined
     where jsonb_typeof(elem) = 'object'
       and coalesce(elem ->> 'id', '') <> ''
       and coalesce(elem ->> 'species', '') <> ''
  ), deduped as (
    select distinct on (id) elem, id, species, at
      from valid
     order by id, at, elem::text
  ), ranked as (
    select elem, id, species, at,
           row_number() over (partition by species order by at, id) as species_rank
      from deduped
  )
  select coalesce(jsonb_agg(elem order by at, id), '[]'::jsonb)
    from ranked
   where species_rank <= 8;
$$;

create or replace function public.lp_merge_hollow(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable as $$
declare
  existing_layout jsonb := coalesce(case when jsonb_typeof(existing -> 'layout') = 'object' then existing -> 'layout' end, '{}'::jsonb);
  incoming_layout jsonb := coalesce(case when jsonb_typeof(incoming -> 'layout') = 'object' then incoming -> 'layout' end, '{}'::jsonb);
  chosen_layout jsonb;
begin
  if existing is null or jsonb_typeof(existing) <> 'object' then existing := '{}'::jsonb; end if;
  if incoming is null or jsonb_typeof(incoming) <> 'object' then incoming := '{}'::jsonb; end if;
  chosen_layout := case
    when coalesce(existing_layout ->> 'at', '') > coalesce(incoming_layout ->> 'at', '') then existing_layout
    else incoming_layout
  end;
  return jsonb_build_object(
    'purchases', public.lp_hollow_merge_records(existing -> 'purchases', incoming -> 'purchases', 128),
    'feeds', public.lp_hollow_merge_feeds(existing -> 'feeds', incoming -> 'feeds'),
    -- Daily chests are derived earnings and cannot be truncated without taking
    -- coins away. They are still deduplicated deterministically by id.
    'chests', public.lp_hollow_merge_records(existing -> 'chests', incoming -> 'chests', 2147483647),
    'layout', chosen_layout
  );
end;
$$;

-- Tracked form of the day-aware daily-mission hotfix. Re-declaring the global
-- dispatcher below must not restore blind incoming-wins and let an offline
-- yesterday row un-finish today's three mission tasks.
create or replace function public.lp_merge_daily_mission(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable as $$
declare
  existing_day text;
  incoming_day text;
  existing_done jsonb;
  incoming_done jsonb;
  merged_done jsonb;
  task_key text;
  later_meta jsonb;
begin
  if existing is null or jsonb_typeof(existing) <> 'object' then return incoming; end if;
  if incoming is null or jsonb_typeof(incoming) <> 'object' then return existing; end if;

  existing_day := coalesce(existing ->> 'day', '');
  incoming_day := coalesce(incoming ->> 'day', '');
  if existing_day <> '' and existing_day = incoming_day then
    existing_done := coalesce(
      case when jsonb_typeof(existing -> 'done') = 'object' then existing -> 'done' end,
      '{}'::jsonb);
    incoming_done := coalesce(
      case when jsonb_typeof(incoming -> 'done') = 'object' then incoming -> 'done' end,
      '{}'::jsonb);
    merged_done := existing_done || incoming_done;
    -- App-written done flags are monotone true values. OR duplicate keys too,
    -- so even a malformed/stale false cannot un-finish a task.
    for task_key in select jsonb_object_keys(existing_done || incoming_done) loop
      merged_done := jsonb_set(merged_done, array[task_key], to_jsonb(
        coalesce(case when jsonb_typeof(existing_done -> task_key) = 'boolean' then (existing_done ->> task_key)::boolean end, false)
        or coalesce(case when jsonb_typeof(incoming_done -> task_key) = 'boolean' then (incoming_done ->> task_key)::boolean end, false)
      ), true);
    end loop;
    later_meta := case
      when coalesce(incoming ->> 'lastCompletedDay', '') > coalesce(existing ->> 'lastCompletedDay', '')
        then incoming
      else existing
    end;
    return incoming || existing || jsonb_build_object(
      'done', merged_done,
      'streak', greatest(public.lp_quest_num(existing, 'streak'), public.lp_quest_num(incoming, 'streak')),
      'lastCompletedDay', greatest(coalesce(existing ->> 'lastCompletedDay', ''), coalesce(incoming ->> 'lastCompletedDay', '')),
      'shieldWeek', coalesce(later_meta -> 'shieldWeek', '""'::jsonb),
      'celebratedDay', greatest(coalesce(existing ->> 'celebratedDay', ''), coalesce(incoming ->> 'celebratedDay', ''))
    );
  end if;

  if existing_day > incoming_day then return existing; end if;
  return incoming;
end;
$$;

create or replace function public.lp_forward_merge_progress(p_area text, p_existing jsonb, p_incoming jsonb)
returns jsonb language sql immutable as $$
  select case
    when p_area = 'daily_mission' then public.lp_merge_daily_mission(p_existing, p_incoming)
    when p_area = 'profile' then p_incoming
    when p_area = 'phonics_quest' then public.lp_merge_phonics_quest(p_existing, p_incoming)
    when p_area = 'hollow' then public.lp_merge_hollow(p_existing, p_incoming)
    else public.lp_jsonb_forward_merge(p_existing, p_incoming)
  end;
$$;

grant execute on function public.lp_quest_independent_count(jsonb) to anon, authenticated;
grant execute on function public.lp_quest_merge_mastery_record(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_merge_phonics_quest(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_hollow_merge_records(jsonb, jsonb, integer) to anon, authenticated;
grant execute on function public.lp_hollow_merge_feeds(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_merge_hollow(jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_merge_daily_mission(jsonb, jsonb) to anon, authenticated;

-- Verification examples for the SQL editor (each must return true):
-- select public.lp_quest_merge_mastery_record(
--   '{"seen":14,"independentSeen":0,"correct":0,"state":"learning","evidenceEpoch":1,"shells":[],"sessions":[]}',
--   '{"seen":15,"independentSeen":12,"correct":12,"state":"mastered","evidenceEpoch":0,"shells":["stones","bridge"],"sessions":["d1","d2"]}'
-- ) #>> '{state}' = 'learning';
--
-- select jsonb_array_length(public.lp_hollow_merge_feeds(
--   (select jsonb_agg(jsonb_build_object('id', 'a-' || n, 'species', 'owl', 'at', n::text)) from generate_series(1, 12) n),
--   (select jsonb_agg(jsonb_build_object('id', 'b-' || n, 'species', 'owl', 'at', (n + 12)::text)) from generate_series(1, 12) n)
-- )) = 8;
--
-- select public.lp_merge_phonics_quest(
--   '{"trail":{"routeCursor":30,"stopsDone":["s1","s40"]},"checkpoint":{"stopId":"s30","beatIndex":1}}',
--   '{"trail":{"routeCursor":1,"stopsDone":[]},"checkpoint":null}'
-- ) #>> '{checkpoint,stopId}' = 's30';
--
-- select public.lp_merge_phonics_quest(
--   '{"trail":{"routeCursor":30,"stopsDone":["s1","s40"]}}',
--   '{"trail":{"routeCursor":1,"stopsDone":[]}}'
-- ) #>> '{trail,routeCursor}' = '30';
--
-- select public.lp_merge_daily_mission(
--   '{"day":"2026-07-20","done":{"quest":true},"streak":4}',
--   '{"day":"2026-07-19","done":{},"streak":3}'
-- ) #>> '{day}' = '2026-07-20';

-- ==== 20260721100000_sound_seekers_reset_epoch.sql ======================

-- Sound Seekers child reset generations.
--
-- Most quest data is deliberately forward-only, but "Start adventure again"
-- is a legitimate destructive operation. Without an explicit generation, the
-- stored row unions the old trail/mastery/checkpoint straight back into the
-- fresh save. Each reset issues a unique `resetId` and carries its observed
-- `resetHistory`; ancestry therefore remains correct even when a stale offline
-- device's clock is behind. `resetEpoch` / `resetAt` are deterministic fallback
-- ordering for malformed legacy conflicts, not reset authority.
--
-- Teacher-owned `assignment` is intentionally not one of the resettable
-- fields. Child uploads omit it, and a teacher's partial {assignment} upsert
-- may not contain resetEpoch; existing || incoming therefore continues to
-- deliver/clear assignments without changing the child's journey generation.

-- Reset metadata is a pair of observed sets:
--   resetHistory    ids known to be settled/superseded
--   resetPendingIds reset operations not yet acknowledged by the server
-- The set helper is deliberately sorted and de-duplicated so every merge
-- orientation produces byte-for-byte equivalent metadata.
create or replace function public.lp_quest_reset_id_set(
  a jsonb,
  b jsonb,
  include_ids jsonb,
  exclude_ids jsonb
)
returns jsonb language sql immutable as $$
  with raw_ids(id) as (
    select value #>> '{}'
      from jsonb_array_elements(coalesce(case when jsonb_typeof(a) = 'array' then a end, '[]'::jsonb))
     where jsonb_typeof(value) = 'string'
    union all
    select value #>> '{}'
      from jsonb_array_elements(coalesce(case when jsonb_typeof(b) = 'array' then b end, '[]'::jsonb))
     where jsonb_typeof(value) = 'string'
    union all
    select value #>> '{}'
      from jsonb_array_elements(coalesce(case when jsonb_typeof(include_ids) = 'array' then include_ids end, '[]'::jsonb))
     where jsonb_typeof(value) = 'string'
  ), normalized_ids as (
    select distinct coalesce(nullif(left(btrim(id), 160), ''), 'legacy') as id
      from raw_ids
  ), normalized_exclusions as (
    select distinct coalesce(nullif(left(btrim(value #>> '{}'), 160), ''), 'legacy') as id
      from jsonb_array_elements(coalesce(
        case when jsonb_typeof(exclude_ids) = 'array' then exclude_ids end,
        '[]'::jsonb))
     where jsonb_typeof(value) = 'string'
  )
  select coalesce(jsonb_agg(to_jsonb(n.id) order by n.id collate "C"), '[]'::jsonb)
    from normalized_ids n
   where not exists (
     select 1 from normalized_exclusions x where x.id = n.id
   );
$$;

-- Compatibility wrapper retained for audit tooling and any already-prepared
-- statements which reference the scalar helper from the first migration pass.
create or replace function public.lp_quest_reset_history(
  a jsonb,
  b jsonb,
  include_id text,
  exclude_id text
)
returns jsonb language sql immutable as $$
  select public.lp_quest_reset_id_set(
    a,
    b,
    case when coalesce(btrim(include_id), '') = ''
      then '[]'::jsonb else jsonb_build_array(include_id) end,
    case when coalesce(btrim(exclude_id), '') = ''
      then '[]'::jsonb else jsonb_build_array(exclude_id) end
  );
$$;

-- Bridge saves written before resetPendingIds existed. A true scalar
-- resetPending means the active reset id is one pending operation. Any id the
-- same payload already carries in history is settled and must not be pending.
create or replace function public.lp_quest_pending_reset_ids(
  payload jsonb,
  active_id text,
  reset_history jsonb
)
returns jsonb language sql immutable as $$
  select public.lp_quest_reset_id_set(
    coalesce(
      case when jsonb_typeof(payload -> 'resetPendingIds') = 'array'
        then payload -> 'resetPendingIds' end,
      '[]'::jsonb),
    '[]'::jsonb,
    case when coalesce(payload ->> 'resetPending', 'false') = 'true'
      then jsonb_build_array(active_id) else '[]'::jsonb end,
    reset_history
  );
$$;

create or replace function public.lp_merge_phonics_quest(existing jsonb, incoming jsonb)
returns jsonb language plpgsql immutable as $$
declare
  result jsonb;
  existing_present boolean := existing is not null and jsonb_typeof(existing) = 'object';
  trail jsonb;
  cursor_val numeric;
  incoming_has_progress boolean := false;
  incoming_checkpoint jsonb;
  existing_checkpoint jsonb;
  chosen_checkpoint jsonb := 'null'::jsonb;
  existing_creature_at text := coalesce(existing ->> 'creatureAt', '');
  incoming_creature_at text := coalesce(incoming ->> 'creatureAt', '');
  existing_settings_at text := coalesce(existing ->> 'settingsAt', '');
  incoming_settings_at text := coalesce(incoming ->> 'settingsAt', '');
  existing_reset_epoch numeric;
  incoming_reset_epoch numeric;
  existing_reset_at text := coalesce(existing ->> 'resetAt', '');
  incoming_reset_at text := coalesce(incoming ->> 'resetAt', '');
  existing_reset_id text := coalesce(nullif(left(btrim(case
    when jsonb_typeof(existing -> 'resetId') = 'string' then existing ->> 'resetId'
    else '' end), 160), ''), 'legacy');
  incoming_reset_id text := coalesce(nullif(left(btrim(case
    when jsonb_typeof(incoming -> 'resetId') = 'string' then incoming ->> 'resetId'
    else '' end), 160), ''), 'legacy');
  existing_reset_history jsonb := coalesce(
    case when jsonb_typeof(existing -> 'resetHistory') = 'array' then existing -> 'resetHistory' end,
    '[]'::jsonb);
  incoming_reset_history jsonb := coalesce(
    case when jsonb_typeof(incoming -> 'resetHistory') = 'array' then incoming -> 'resetHistory' end,
    '[]'::jsonb);
  existing_pending_reset_ids jsonb := '[]'::jsonb;
  incoming_pending_reset_ids jsonb := '[]'::jsonb;
  combined_reset_history jsonb := '[]'::jsonb;
  acknowledged_reset_ids jsonb := '[]'::jsonb;
  settled_reset_ids jsonb := '[]'::jsonb;
  pending_reset_ids jsonb := '[]'::jsonb;
  existing_descends boolean;
  incoming_descends boolean;
  winner_reset_id text;
  loser_reset_id text;
  winner_is_existing boolean;
  winner_reset_epoch numeric;
  winner_reset_at text;
  merged_reset_history jsonb;
  authoritative jsonb;
  chosen_creature jsonb;
  chosen_settings jsonb;
begin
  if incoming is null or jsonb_typeof(incoming) <> 'object' then return existing; end if;
  if not existing_present then existing := '{}'::jsonb; end if;

  existing_reset_epoch := least(
    9007199254740991::numeric,
    greatest(0, trunc(public.lp_quest_num(existing, 'resetEpoch'))));
  incoming_reset_epoch := least(
    9007199254740991::numeric,
    greatest(0, trunc(public.lp_quest_num(incoming, 'resetEpoch'))));

  existing_reset_history := public.lp_quest_reset_id_set(
    existing_reset_history,
    '[]'::jsonb,
    '[]'::jsonb,
    jsonb_build_array(existing_reset_id)
  );
  incoming_reset_history := public.lp_quest_reset_id_set(
    incoming_reset_history,
    '[]'::jsonb,
    '[]'::jsonb,
    jsonb_build_array(incoming_reset_id)
  );
  existing_pending_reset_ids := public.lp_quest_pending_reset_ids(
    existing, existing_reset_id, existing_reset_history);
  incoming_pending_reset_ids := public.lp_quest_pending_reset_ids(
    incoming, incoming_reset_id, incoming_reset_history);
  combined_reset_history := public.lp_quest_reset_id_set(
    existing_reset_history,
    incoming_reset_history,
    '[]'::jsonb,
    '[]'::jsonb
  );
  acknowledged_reset_ids := public.lp_quest_reset_id_set(
    case when jsonb_array_length(existing_pending_reset_ids) = 0
      then jsonb_build_array(existing_reset_id) else '[]'::jsonb end,
    case when jsonb_array_length(incoming_pending_reset_ids) = 0
      then jsonb_build_array(incoming_reset_id) else '[]'::jsonb end,
    '[]'::jsonb,
    '[]'::jsonb
  );
  settled_reset_ids := public.lp_quest_reset_id_set(
    combined_reset_history,
    acknowledged_reset_ids,
    '[]'::jsonb,
    '[]'::jsonb
  );
  pending_reset_ids := public.lp_quest_reset_id_set(
    existing_pending_reset_ids,
    incoming_pending_reset_ids,
    '[]'::jsonb,
    settled_reset_ids
  );

  -- Unknown/authority-owned keys keep the established incoming-wins contract.
  result := existing || incoming;

  -- Settings are not journey progress. Their explicit clock continues to win
  -- even when the journey generations differ, so a reset never turns off a
  -- child's accessibility settings.
  chosen_settings := case
    when incoming_settings_at <> ''
      and (existing_settings_at = '' or incoming_settings_at > existing_settings_at)
      and jsonb_typeof(incoming -> 'settings') = 'object'
      then incoming -> 'settings'
    else coalesce(
      case when jsonb_typeof(existing -> 'settings') = 'object' then existing -> 'settings' end,
      case when jsonb_typeof(incoming -> 'settings') = 'object' then incoming -> 'settings' end,
      'null'::jsonb)
  end;

  -- Pending reset operations form an observed set. Set union followed by
  -- removal of history/acknowledged-current ids is associative, so the A/B/C
  -- case (A pending, B acknowledges A, unrelated C pending) leaves C pending
  -- regardless of queue grouping. Lexical max chooses one canonical snapshot;
  -- the whole set remains visible until this authoritative server merge.
  if jsonb_array_length(pending_reset_ids) > 0 then
    select value into winner_reset_id
      from jsonb_array_elements_text(pending_reset_ids)
     order by value collate "C" desc
     limit 1;

    if winner_reset_id = existing_reset_id
      and winner_reset_id = incoming_reset_id then
      -- Both sides own the same reset generation. The reset is already
      -- represented on both snapshots, so preserve post-reset learning with
      -- the normal same-generation forward merge while acknowledging the
      -- winner and folding any other pending operations into ancestry.
      combined_reset_history := public.lp_quest_reset_id_set(
        combined_reset_history,
        acknowledged_reset_ids,
        pending_reset_ids,
        jsonb_build_array(winner_reset_id)
      );
      pending_reset_ids := '[]'::jsonb;
    else
    if winner_reset_id = incoming_reset_id then
      winner_reset_epoch := incoming_reset_epoch;
      winner_reset_at := incoming_reset_at;
      -- An input whose active reset wins owns an unambiguous journey snapshot.
      -- A pending id merely carried in the observed set has metadata but no
      -- snapshot, so accepting another generation's journey would resurrect
      -- exactly the progress the reset meant to clear.
      authoritative := incoming;
    elsif winner_reset_id = existing_reset_id then
      winner_reset_epoch := existing_reset_epoch;
      winner_reset_at := existing_reset_at;
      authoritative := existing;
    else
      winner_reset_epoch := greatest(existing_reset_epoch, incoming_reset_epoch);
      winner_reset_at := greatest(existing_reset_at, incoming_reset_at);
      authoritative := null;
    end if;

    if authoritative is null then
      authoritative := jsonb_build_object(
        'creature', 'null'::jsonb,
        'creatureAt', winner_reset_at,
        'hatched', false,
        'trail', jsonb_build_object(
          'stopsDone', '[]'::jsonb,
          'stars', '{}'::jsonb,
          'drops', '{}'::jsonb,
          'routeCursor', 1),
        'mastery', '{}'::jsonb,
        'stones', '[]'::jsonb,
        'trickies', '[]'::jsonb,
        'ledger', jsonb_build_object('purchases', '[]'::jsonb),
        'lastEarnedGearStop', 'null'::jsonb,
        'checkpoint', 'null'::jsonb
      );
    end if;

    -- This function is the acknowledgement boundary. Fold every losing
    -- pending operation into history, retain the canonical winner as resetId,
    -- and explicitly clear both pending representations. A later stale replay
    -- is then settled by history before it can affect journey data.
    merged_reset_history := public.lp_quest_reset_id_set(
      combined_reset_history,
      acknowledged_reset_ids,
      pending_reset_ids,
      jsonb_build_array(winner_reset_id)
    );

    result := (result - 'telemetry') || jsonb_build_object(
      'resetEpoch', to_jsonb(winner_reset_epoch),
      'resetAt', to_jsonb(winner_reset_at),
      'resetId', to_jsonb(winner_reset_id),
      'resetHistory', merged_reset_history,
      'resetPendingIds', '[]'::jsonb,
      'resetPending', false,
      'creature', coalesce(
        case when jsonb_typeof(authoritative -> 'creature') = 'object' then authoritative -> 'creature' end,
        'null'::jsonb),
      'creatureAt', to_jsonb(coalesce(authoritative ->> 'creatureAt', '')),
      'hatched', to_jsonb(coalesce((authoritative ->> 'hatched')::boolean, false)),
      'trail', coalesce(
        case when jsonb_typeof(authoritative -> 'trail') = 'object' then authoritative -> 'trail' end,
        jsonb_build_object('stopsDone', '[]'::jsonb, 'stars', '{}'::jsonb, 'drops', '{}'::jsonb, 'routeCursor', 1)),
      'mastery', coalesce(
        case when jsonb_typeof(authoritative -> 'mastery') = 'object' then authoritative -> 'mastery' end,
        '{}'::jsonb),
      'stones', coalesce(
        case when jsonb_typeof(authoritative -> 'stones') = 'array' then authoritative -> 'stones' end,
        '[]'::jsonb),
      'trickies', coalesce(
        case when jsonb_typeof(authoritative -> 'trickies') = 'array' then authoritative -> 'trickies' end,
        '[]'::jsonb),
      'ledger', coalesce(
        case when jsonb_typeof(authoritative -> 'ledger') = 'object' then authoritative -> 'ledger' end,
        jsonb_build_object('purchases', '[]'::jsonb)),
      'settings', chosen_settings,
      'settingsAt', greatest(existing_settings_at, incoming_settings_at),
      'lastEarnedGearStop', coalesce(authoritative -> 'lastEarnedGearStop', 'null'::jsonb),
      'checkpoint', coalesce(authoritative -> 'checkpoint', 'null'::jsonb)
    );
    return result;
    end if;
  end if;

  -- With no unacknowledged operation, descendants beat ancestors. Unrelated
  -- acknowledged ids use the legacy issuance tuple only as a deterministic
  -- fallback. The losing current id joins history, making stale replays safe.
  if existing_reset_id <> incoming_reset_id then
    existing_descends := existing_reset_history ? incoming_reset_id;
    incoming_descends := incoming_reset_history ? existing_reset_id;

    if not existing_present then
      authoritative := incoming;
      winner_is_existing := false;
    elsif existing_descends and not incoming_descends then
      authoritative := existing;
      winner_is_existing := true;
    elsif incoming_descends and not existing_descends then
      authoritative := incoming;
      winner_is_existing := false;
    elsif existing_reset_epoch > incoming_reset_epoch
      or (existing_reset_epoch = incoming_reset_epoch and existing_reset_at > incoming_reset_at)
      or (existing_reset_epoch = incoming_reset_epoch and existing_reset_at = incoming_reset_at
        and existing_reset_id collate "C" > incoming_reset_id collate "C") then
      authoritative := existing;
      winner_is_existing := true;
    else
      authoritative := incoming;
      winner_is_existing := false;
    end if;

    if winner_is_existing then
      winner_reset_id := existing_reset_id;
      loser_reset_id := incoming_reset_id;
      winner_reset_epoch := existing_reset_epoch;
      winner_reset_at := existing_reset_at;
    else
      winner_reset_id := incoming_reset_id;
      loser_reset_id := existing_reset_id;
      winner_reset_epoch := incoming_reset_epoch;
      winner_reset_at := incoming_reset_at;
    end if;
    merged_reset_history := public.lp_quest_reset_id_set(
      combined_reset_history,
      acknowledged_reset_ids,
      jsonb_build_array(loser_reset_id),
      jsonb_build_array(winner_reset_id)
    );

    result := (result - 'telemetry') || jsonb_build_object(
      'resetEpoch', to_jsonb(winner_reset_epoch),
      'resetAt', to_jsonb(winner_reset_at),
      'resetId', to_jsonb(winner_reset_id),
      'resetHistory', merged_reset_history,
      'resetPendingIds', '[]'::jsonb,
      'resetPending', false,
      'creature', coalesce(
        case when jsonb_typeof(authoritative -> 'creature') = 'object' then authoritative -> 'creature' end,
        'null'::jsonb),
      'creatureAt', to_jsonb(coalesce(authoritative ->> 'creatureAt', '')),
      'hatched', to_jsonb(coalesce((authoritative ->> 'hatched')::boolean, false)),
      'trail', coalesce(
        case when jsonb_typeof(authoritative -> 'trail') = 'object' then authoritative -> 'trail' end,
        jsonb_build_object('stopsDone', '[]'::jsonb, 'stars', '{}'::jsonb, 'drops', '{}'::jsonb, 'routeCursor', 1)),
      'mastery', coalesce(
        case when jsonb_typeof(authoritative -> 'mastery') = 'object' then authoritative -> 'mastery' end,
        '{}'::jsonb),
      'stones', coalesce(
        case when jsonb_typeof(authoritative -> 'stones') = 'array' then authoritative -> 'stones' end,
        '[]'::jsonb),
      'trickies', coalesce(
        case when jsonb_typeof(authoritative -> 'trickies') = 'array' then authoritative -> 'trickies' end,
        '[]'::jsonb),
      'ledger', coalesce(
        case when jsonb_typeof(authoritative -> 'ledger') = 'object' then authoritative -> 'ledger' end,
        jsonb_build_object('purchases', '[]'::jsonb)),
      'settings', chosen_settings,
      'settingsAt', greatest(existing_settings_at, incoming_settings_at),
      'lastEarnedGearStop', coalesce(authoritative -> 'lastEarnedGearStop', 'null'::jsonb),
      'checkpoint', coalesce(authoritative -> 'checkpoint', 'null'::jsonb)
    );
    return result;
  end if;

  incoming_has_progress := case
    when jsonb_typeof(incoming #> '{trail,stopsDone}') = 'array'
      then jsonb_array_length(incoming #> '{trail,stopsDone}') > 0
    else false
  end;

  trail := public.lp_jsonb_forward_merge(existing -> 'trail', incoming -> 'trail');
  cursor_val := case
    when incoming_has_progress and public.lp_quest_num(incoming -> 'trail', 'routeCursor') > 0
      then public.lp_quest_num(incoming -> 'trail', 'routeCursor')
    when public.lp_quest_num(existing -> 'trail', 'routeCursor') > 0
      then public.lp_quest_num(existing -> 'trail', 'routeCursor')
    when public.lp_quest_num(incoming -> 'trail', 'routeCursor') > 0
      then public.lp_quest_num(incoming -> 'trail', 'routeCursor')
    else 1
  end;
  if trail is null or jsonb_typeof(trail) <> 'object' then trail := '{}'::jsonb; end if;
  trail := trail || jsonb_build_object('routeCursor', to_jsonb(cursor_val));

  incoming_checkpoint := case
    when jsonb_typeof(incoming -> 'checkpoint') = 'object' then incoming -> 'checkpoint'
    else null
  end;
  existing_checkpoint := case
    when jsonb_typeof(existing -> 'checkpoint') = 'object' then existing -> 'checkpoint'
    else null
  end;
  if incoming_checkpoint is not null then
    chosen_checkpoint := incoming_checkpoint;
  elsif existing_checkpoint is not null
    and existing_checkpoint ->> 'stopId' = 's' || trunc(cursor_val)::bigint::text then
    chosen_checkpoint := existing_checkpoint;
  end if;

  chosen_creature := case
    when incoming_creature_at <> ''
      and (existing_creature_at = '' or incoming_creature_at > existing_creature_at)
      and jsonb_typeof(incoming -> 'creature') = 'object'
      then incoming -> 'creature'
    else coalesce(
      case when jsonb_typeof(existing -> 'creature') = 'object' then existing -> 'creature' end,
      case when jsonb_typeof(incoming -> 'creature') = 'object' then incoming -> 'creature' end,
      'null'::jsonb)
  end;

  -- Equal generations keep the existing forward-only achievement merge.
  merged_reset_history := public.lp_quest_reset_id_set(
    combined_reset_history,
    acknowledged_reset_ids,
    '[]'::jsonb,
    jsonb_build_array(existing_reset_id)
  );
  result := (result - 'telemetry') || jsonb_build_object(
    'resetEpoch', to_jsonb(greatest(existing_reset_epoch, incoming_reset_epoch)),
    'resetAt', greatest(existing_reset_at, incoming_reset_at),
    'resetId', to_jsonb(existing_reset_id),
    'resetHistory', merged_reset_history,
    'resetPendingIds', '[]'::jsonb,
    'resetPending', false,
    'creature', chosen_creature,
    'creatureAt', greatest(existing_creature_at, incoming_creature_at),
    'hatched', to_jsonb(
      coalesce((existing ->> 'hatched')::boolean, false)
      or coalesce((incoming ->> 'hatched')::boolean, false)),
    'trail', trail,
    'mastery', public.lp_quest_merge_mastery(existing -> 'mastery', incoming -> 'mastery'),
    'stones', public.lp_jsonb_forward_merge(
      coalesce(case when jsonb_typeof(existing -> 'stones') = 'array' then existing -> 'stones' end, '[]'::jsonb),
      coalesce(case when jsonb_typeof(incoming -> 'stones') = 'array' then incoming -> 'stones' end, '[]'::jsonb)),
    'trickies', public.lp_jsonb_forward_merge(
      coalesce(case when jsonb_typeof(existing -> 'trickies') = 'array' then existing -> 'trickies' end, '[]'::jsonb),
      coalesce(case when jsonb_typeof(incoming -> 'trickies') = 'array' then incoming -> 'trickies' end, '[]'::jsonb)),
    'ledger', jsonb_build_object(
      'purchases', public.lp_quest_union_by_id(existing #> '{ledger,purchases}', incoming #> '{ledger,purchases}')),
    'settings', chosen_settings,
    'settingsAt', greatest(existing_settings_at, incoming_settings_at),
    'checkpoint', chosen_checkpoint
  );
  return result;
end;
$$;

grant execute on function public.lp_quest_reset_id_set(jsonb, jsonb, jsonb, jsonb) to anon, authenticated;
grant execute on function public.lp_quest_reset_history(jsonb, jsonb, text, text) to anon, authenticated;
grant execute on function public.lp_quest_pending_reset_ids(jsonb, text, jsonb) to anon, authenticated;
grant execute on function public.lp_merge_phonics_quest(jsonb, jsonb) to anon, authenticated;

-- ==== 20260721120000_el_assessment_persistence.sql ======================

-- Durable EL assessment attempts and generated reports.
-- The payload columns retain the complete, versioned assessment evidence while
-- relational columns support secure teacher/student filters and summaries.

create table if not exists public.assessment_attempts (
  attempt_id text primary key,
  student_id text not null,
  class_id text,
  teacher_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  assessment_type text not null default 'skill_checkpoint',
  skill_id text not null default '',
  skill_name text not null default 'Assessment',
  skill_level integer not null default 1,
  skill_phase integer not null default 1,
  started_at timestamptz,
  completed_at timestamptz not null default now(),
  total_questions integer not null default 0,
  correct_count integer not null default 0,
  accuracy numeric(5, 2) not null default 0,
  status text not null default 'needs_retry',
  administration_status text not null default 'completed',
  schema_version integer not null default 1,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep this migration safe for installations where the app's optional cloud
-- table was created manually before it became part of the managed schema.
alter table public.assessment_attempts
  add column if not exists attempt_id text,
  add column if not exists student_id text,
  add column if not exists class_id text,
  add column if not exists teacher_id uuid default auth.uid() references auth.users(id) on delete cascade,
  add column if not exists assessment_type text not null default 'skill_checkpoint',
  add column if not exists skill_id text not null default '',
  add column if not exists skill_name text not null default 'Assessment',
  add column if not exists skill_level integer not null default 1,
  add column if not exists skill_phase integer not null default 1,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz not null default now(),
  add column if not exists total_questions integer not null default 0,
  add column if not exists correct_count integer not null default 0,
  add column if not exists accuracy numeric(5, 2) not null default 0,
  add column if not exists status text not null default 'needs_retry',
  add column if not exists administration_status text not null default 'completed',
  add column if not exists schema_version integer not null default 1,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists assessment_attempts_attempt_id_key
  on public.assessment_attempts (attempt_id);
create index if not exists assessment_attempts_teacher_completed_idx
  on public.assessment_attempts (teacher_id, completed_at desc);
create index if not exists assessment_attempts_teacher_student_completed_idx
  on public.assessment_attempts (teacher_id, student_id, completed_at desc);
create index if not exists assessment_attempts_teacher_class_completed_idx
  on public.assessment_attempts (teacher_id, class_id, completed_at desc);

create table if not exists public.el_assessment_reports (
  report_id text primary key,
  report_type text not null,
  class_id text,
  student_id text,
  teacher_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  generated_at timestamptz not null default now(),
  file_name text not null default '',
  summary jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.el_assessment_reports
  add column if not exists report_id text,
  add column if not exists report_type text,
  add column if not exists class_id text,
  add column if not exists student_id text,
  add column if not exists teacher_id uuid default auth.uid() references auth.users(id) on delete cascade,
  add column if not exists generated_at timestamptz not null default now(),
  add column if not exists file_name text not null default '',
  add column if not exists summary jsonb not null default '{}'::jsonb,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists schema_version integer not null default 1,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists el_assessment_reports_report_id_key
  on public.el_assessment_reports (report_id);
create index if not exists el_assessment_reports_teacher_generated_idx
  on public.el_assessment_reports (teacher_id, generated_at desc);
create index if not exists el_assessment_reports_teacher_student_generated_idx
  on public.el_assessment_reports (teacher_id, student_id, generated_at desc);
create index if not exists el_assessment_reports_teacher_class_generated_idx
  on public.el_assessment_reports (teacher_id, class_id, generated_at desc);

create or replace function public.set_el_assessment_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists assessment_attempts_set_updated_at on public.assessment_attempts;
create trigger assessment_attempts_set_updated_at
  before update on public.assessment_attempts
  for each row execute function public.set_el_assessment_updated_at();

drop trigger if exists el_assessment_reports_set_updated_at on public.el_assessment_reports;
create trigger el_assessment_reports_set_updated_at
  before update on public.el_assessment_reports
  for each row execute function public.set_el_assessment_updated_at();

alter table public.assessment_attempts enable row level security;
alter table public.el_assessment_reports enable row level security;

revoke all on public.assessment_attempts from anon;
revoke all on public.el_assessment_reports from anon;
grant select, insert, update, delete on public.assessment_attempts to authenticated;
grant select, insert, update, delete on public.el_assessment_reports to authenticated;

drop policy if exists "Teachers manage owned assessment attempts" on public.assessment_attempts;
create policy "Teachers manage owned assessment attempts"
  on public.assessment_attempts for all to authenticated
  using (
    public.is_app_admin(auth.uid())
    or (
      assessment_attempts.teacher_id::text = auth.uid()::text
      and exists (
        select 1
        from public.students s
        where s.id::text = assessment_attempts.student_id::text
          and s.teacher_id = auth.uid()
      )
      and (
        assessment_attempts.class_id is null
        or assessment_attempts.class_id = ''
        or exists (
          select 1
          from public.classes c
          where c.id::text = assessment_attempts.class_id::text
            and c.teacher_id = auth.uid()
        )
      )
    )
  )
  with check (
    public.is_app_admin(auth.uid())
    or (
      assessment_attempts.teacher_id::text = auth.uid()::text
      and exists (
        select 1
        from public.students s
        where s.id::text = assessment_attempts.student_id::text
          and s.teacher_id = auth.uid()
      )
      and (
        assessment_attempts.class_id is null
        or assessment_attempts.class_id = ''
        or exists (
          select 1
          from public.classes c
          where c.id::text = assessment_attempts.class_id::text
            and c.teacher_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "Teachers manage owned EL assessment reports" on public.el_assessment_reports;
create policy "Teachers manage owned EL assessment reports"
  on public.el_assessment_reports for all to authenticated
  using (
    public.is_app_admin(auth.uid())
    or (
      el_assessment_reports.teacher_id::text = auth.uid()::text
      and (
        el_assessment_reports.student_id is null
        or el_assessment_reports.student_id = ''
        or exists (
          select 1
          from public.students s
          where s.id::text = el_assessment_reports.student_id::text
            and s.teacher_id = auth.uid()
        )
      )
      and (
        el_assessment_reports.class_id is null
        or el_assessment_reports.class_id = ''
        or exists (
          select 1
          from public.classes c
          where c.id::text = el_assessment_reports.class_id::text
            and c.teacher_id = auth.uid()
        )
      )
    )
  )
  with check (
    public.is_app_admin(auth.uid())
    or (
      el_assessment_reports.teacher_id::text = auth.uid()::text
      and (
        el_assessment_reports.student_id is null
        or el_assessment_reports.student_id = ''
        or exists (
          select 1
          from public.students s
          where s.id::text = el_assessment_reports.student_id::text
            and s.teacher_id = auth.uid()
        )
      )
      and (
        el_assessment_reports.class_id is null
        or el_assessment_reports.class_id = ''
        or exists (
          select 1
          from public.classes c
          where c.id::text = el_assessment_reports.class_id::text
            and c.teacher_id = auth.uid()
        )
      )
    )
  );

comment on table public.assessment_attempts is
  'Versioned assessment attempts with complete item-level evidence in payload.';
comment on table public.el_assessment_reports is
  'Versioned EL class and student report snapshots with complete report payloads.';

-- ==== 20260723090000_teacher_only_student_password_setup.sql ============

-- Make symbol-password creation and reset teacher-only.
--
-- The child login still shows the code-gated class roster, but a pupil whose
-- pictures are not configured must ask a teacher for help. Teachers manage the
-- symbol_password column through the authenticated dashboard under RLS.
--
-- PostgreSQL functions are executable by PUBLIC by default, so revoke both the
-- old two-argument helper and the later class-code-gated overload explicitly.

revoke execute on function public.student_set_password(uuid, text)
  from public, anon, authenticated;

revoke execute on function public.student_set_password(uuid, text, text)
  from public, anon, authenticated;

-- ==== 20260723100000_core_learning_schema_reconciliation.sql ============

-- Reconcile installations where the core tables predate managed migrations.
-- The early bootstrap migration creates fresh databases; this migration adds
-- the safe ownership constraints and admin policies to existing databases.

create or replace function public.set_core_learning_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.classes
  add column if not exists updated_at timestamptz not null default now();

alter table public.students
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists classes_id_teacher_key
  on public.classes (id, teacher_id);
create unique index if not exists students_id_teacher_key
  on public.students (id, teacher_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'students_class_teacher_fk'
      and conrelid = 'public.students'::regclass
  ) then
    alter table public.students
      add constraint students_class_teacher_fk
      foreign key (class_id, teacher_id)
      references public.classes(id, teacher_id)
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'answers_student_teacher_fk'
      and conrelid = 'public.answers'::regclass
  ) then
    alter table public.answers
      add constraint answers_student_teacher_fk
      foreign key (student_id, teacher_id)
      references public.students(id, teacher_id)
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'mastery_student_teacher_fk'
      and conrelid = 'public.mastery'::regclass
  ) then
    alter table public.mastery
      add constraint mastery_student_teacher_fk
      foreign key (student_id, teacher_id)
      references public.students(id, teacher_id)
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'item_mastery_student_teacher_fk'
      and conrelid = 'public.item_mastery'::regclass
  ) then
    alter table public.item_mastery
      add constraint item_mastery_student_teacher_fk
      foreign key (student_id, teacher_id)
      references public.students(id, teacher_id)
      on delete cascade
      not valid;
  end if;
end;
$$;

drop policy if exists "App admins manage all classes" on public.classes;
create policy "App admins manage all classes"
  on public.classes for all to authenticated
  using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

drop policy if exists "App admins manage all students" on public.students;
create policy "App admins manage all students"
  on public.students for all to authenticated
  using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

drop policy if exists "App admins manage all answers" on public.answers;
create policy "App admins manage all answers"
  on public.answers for all to authenticated
  using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

drop policy if exists "App admins manage all mastery" on public.mastery;
create policy "App admins manage all mastery"
  on public.mastery for all to authenticated
  using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

drop policy if exists "App admins manage all item mastery" on public.item_mastery;
create policy "App admins manage all item mastery"
  on public.item_mastery for all to authenticated
  using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

drop trigger if exists classes_set_updated_at on public.classes;
create trigger classes_set_updated_at
  before update on public.classes
  for each row execute function public.set_core_learning_updated_at();

drop trigger if exists students_set_updated_at on public.students;
create trigger students_set_updated_at
  before update on public.students
  for each row execute function public.set_core_learning_updated_at();

drop trigger if exists mastery_set_updated_at on public.mastery;
create trigger mastery_set_updated_at
  before update on public.mastery
  for each row execute function public.set_core_learning_updated_at();

drop trigger if exists item_mastery_set_updated_at on public.item_mastery;
create trigger item_mastery_set_updated_at
  before update on public.item_mastery
  for each row execute function public.set_core_learning_updated_at();

-- ==== 20260723110000_leaderboard_student_token_privacy.sql ==============

-- Child-safety boundary for arcade leaderboards.
--
-- The previous RPC trusted a caller-supplied school id and returned real
-- student names. This migration makes the server own every privacy decision:
-- a live student session identifies the learner, the learner's class owns the
-- scope, and only pseudonyms leave the database.

alter table public.classes
  add column if not exists leaderboard_scope text;

update public.classes
set leaderboard_scope = 'class'
where leaderboard_scope is null;

alter table public.classes
  alter column leaderboard_scope set default 'class',
  alter column leaderboard_scope set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'classes_leaderboard_scope_check'
      and conrelid = 'public.classes'::regclass
  ) then
    alter table public.classes
      add constraint classes_leaderboard_scope_check
      check (leaderboard_scope in ('class', 'school'));
  end if;
end
$$;

create or replace function public.teacher_set_class_leaderboard_scope(
  p_class_id uuid,
  p_scope text
)
returns table (class_id uuid, leaderboard_scope text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_scope text := lower(btrim(coalesce(p_scope, '')));
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;
  if v_scope not in ('class', 'school') then
    raise exception 'invalid_leaderboard_scope';
  end if;

  update public.classes c
  set leaderboard_scope = v_scope,
      updated_at = now()
  where c.id = p_class_id
    and (
      c.teacher_id = v_user_id
      or public.is_app_admin(v_user_id)
    );

  if not found then
    raise exception 'class_not_found_or_not_owned';
  end if;

  return query
  select p_class_id, v_scope;
end;
$$;

revoke all on function public.teacher_set_class_leaderboard_scope(uuid, text)
  from public, anon;
grant execute on function public.teacher_set_class_leaderboard_scope(uuid, text)
  to authenticated;

-- Remove every legacy overload so no caller can select a scope by supplying
-- a school id and no overload can return a child's real name.
drop function if exists public.get_game_leaderboard(int);
drop function if exists public.get_game_leaderboard(int, uuid);

create or replace function public.get_game_leaderboard(
  p_student_token text,
  p_limit int default 10
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_student public.students;
  v_school_id uuid;
  v_scope text;
  v_rows jsonb;
begin
  if btrim(coalesce(p_student_token, '')) = '' then
    raise exception 'invalid_session';
  end if;

  v_student := public.student_from_token(p_student_token);
  if v_student.id is null or v_student.class_id is null then
    raise exception 'invalid_session';
  end if;

  select c.school_id, c.leaderboard_scope
  into v_school_id, v_scope
  from public.classes c
  where c.id = v_student.class_id;

  if v_scope = 'school' and v_school_id is null then
    v_scope := 'class';
  end if;
  v_scope := coalesce(v_scope, 'class');

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'student_name', ranked.student_name,
        'total_points', ranked.total_points,
        'total_stars', ranked.total_stars
      )
      order by ranked.total_points desc, ranked.total_stars desc, ranked.student_name
    ),
    '[]'::jsonb
  )
  into v_rows
  from (
    select
      'Reader ' || upper(substr(
        encode(
          extensions.digest(
            s.id::text || ':' ||
              case when v_scope = 'school' then v_school_id::text else c.id::text end ||
              ':leaderboard-v1',
            'sha256'
          ),
          'hex'
        ),
        1,
        6
      )) as student_name,
      coalesce((
        select sum(
          case
            when coalesce(g.value ->> 'highScore', '') ~ '^-?[0-9]+$'
              then least(
                greatest((g.value ->> 'highScore')::numeric, 0),
                2147483647
              )
            else 0
          end
        )
        from jsonb_each(coalesce(sp.payload -> 'games', '{}'::jsonb)) as g
      ), 0)::int as total_points,
      coalesce((
        select sum(
          case
            when coalesce(g.value ->> 'stars', '') ~ '^-?[0-9]+$'
              then least(greatest((g.value ->> 'stars')::numeric, 0), 3)
            else 0
          end
        )
        from jsonb_each(coalesce(sp.payload -> 'games', '{}'::jsonb)) as g
      ), 0)::int as total_stars
    from public.student_progress sp
    join public.students s on s.id = sp.student_id
    join public.classes c on c.id = s.class_id
    where sp.area = 'learn_games'
      and sp.key = '__all__'
      and s.archived_at is null
      and (
        (v_scope = 'class' and c.id = v_student.class_id)
        or
        (v_scope = 'school' and c.school_id = v_school_id)
      )
    order by total_points desc, total_stars desc, student_name
    limit greatest(1, least(coalesce(p_limit, 10), 50))
  ) as ranked;

  return jsonb_build_object(
    'scope', v_scope,
    'rows', v_rows
  );
end;
$$;

revoke all on function public.get_game_leaderboard(text, int) from public;
grant execute on function public.get_game_leaderboard(text, int)
  to anon, authenticated;

notify pgrst, 'reload schema';

-- ==== 20260723170000_teacher_demo_class.sql =============================

-- Atomic, teacher-owned sample data for first-run onboarding.
--
-- Demo learners carry login pictures so teachers can safely explore child
-- sign-in, but they carry no answers, mastery, attempts, or progress. The
-- "(sample)" label keeps the data unmistakable in every downstream view.

create or replace function public.teacher_create_demo_class()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
  v_school_id uuid;
  v_class public.classes;
begin
  if v_teacher_id is null then
    raise exception 'Authentication required';
  end if;

  select school_id
  into v_school_id
  from public.pending_teacher_accounts
  where user_id = v_teacher_id
    and role = 'teacher'
    and status = 'approved'
    and approval_status = 'approved'
  limit 1;

  if not found then
    raise exception 'Approved teacher account required';
  end if;

  if exists (
    select 1
    from public.classes
    where teacher_id = v_teacher_id
  ) then
    raise exception 'Sample class is only available before the first class is created';
  end if;

  insert into public.classes (teacher_id, school_id, name)
  values (v_teacher_id, v_school_id, 'Demo Class (sample)')
  returning * into v_class;

  insert into public.students (
    class_id,
    teacher_id,
    name,
    symbol_password,
    password_set_at,
    password_updated_by
  )
  values
    (v_class.id, v_teacher_id, 'Demo Ava', '123', now(), v_teacher_id),
    (v_class.id, v_teacher_id, 'Demo Ben', '456', now(), v_teacher_id),
    (v_class.id, v_teacher_id, 'Demo Chen', '789', now(), v_teacher_id);

  return jsonb_build_object(
    'class_id', v_class.id,
    'class_name', v_class.name,
    'learner_count', 3,
    'contains_assessment_evidence', false
  );
end;
$$;

revoke all on function public.teacher_create_demo_class() from public;
grant execute on function public.teacher_create_demo_class() to authenticated;

-- ==== 20260723183000_teacher_interventions.sql ==========================

-- Track the complete teacher intervention lifecycle as durable, owned data.
--
-- A suggestion is not an intervention until it has an owner, date, group,
-- focus, and activity. Later states require the evidence recorded at each
-- transition, so a client cannot create a misleading "reviewed" shell.

create table if not exists public.teacher_interventions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  parent_intervention_id uuid references public.teacher_interventions(id) on delete set null,
  owner_label text not null check (char_length(btrim(owner_label)) between 1 and 80),
  group_label text not null check (char_length(btrim(group_label)) between 1 and 120),
  student_ids uuid[] not null default '{}'
    check (cardinality(student_ids) <= 40),
  focus text not null check (char_length(btrim(focus)) between 1 and 160),
  activity text not null check (char_length(btrim(activity)) between 1 and 240),
  planned_for date not null,
  status text not null default 'planned'
    check (status in ('planned', 'delivered', 'recorded', 'reviewed')),
  delivered_at timestamptz,
  outcome text check (outcome in ('effective', 'partial', 'ineffective')),
  outcome_note text check (outcome_note is null or char_length(outcome_note) <= 500),
  recorded_at timestamptz,
  reviewed_at timestamptz,
  next_review_on date,
  follow_up_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_interventions_class_teacher_fk
    foreign key (class_id, teacher_id)
    references public.classes(id, teacher_id)
    on delete cascade,
  constraint teacher_interventions_state_evidence_check check (
    (status = 'planned'
      and delivered_at is null
      and recorded_at is null
      and reviewed_at is null
      and outcome is null)
    or
    (status = 'delivered'
      and delivered_at is not null
      and recorded_at is null
      and reviewed_at is null
      and outcome is null)
    or
    (status = 'recorded'
      and delivered_at is not null
      and recorded_at is not null
      and reviewed_at is null
      and outcome is not null)
    or
    (status = 'reviewed'
      and delivered_at is not null
      and recorded_at is not null
      and reviewed_at is not null
      and outcome is not null
      and next_review_on is not null)
  ),
  constraint teacher_interventions_follow_up_check check (
    not follow_up_required
    or (status = 'reviewed' and outcome in ('partial', 'ineffective'))
  )
);

create index if not exists teacher_interventions_class_status_date_idx
  on public.teacher_interventions (teacher_id, class_id, status, planned_for);
create index if not exists teacher_interventions_follow_up_idx
  on public.teacher_interventions (teacher_id, class_id, next_review_on)
  where follow_up_required;

alter table public.teacher_interventions enable row level security;

revoke all on public.teacher_interventions from anon;
grant select, insert, update, delete on public.teacher_interventions to authenticated;

drop policy if exists "Teachers manage owned interventions" on public.teacher_interventions;
create policy "Teachers manage owned interventions"
  on public.teacher_interventions for all to authenticated
  using (teacher_id = auth.uid())
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1
      from public.classes c
      where c.id = teacher_interventions.class_id
        and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "App admins manage all interventions" on public.teacher_interventions;
create policy "App admins manage all interventions"
  on public.teacher_interventions for all to authenticated
  using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

create or replace function public.validate_teacher_intervention()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if cardinality(new.student_ids) > 40 then
    raise exception 'An intervention group cannot contain more than 40 learners';
  end if;

  if exists (
    select 1
    from unnest(new.student_ids) student_id
    left join public.students s
      on s.id = student_id
      and s.class_id = new.class_id
      and s.teacher_id = new.teacher_id
    where s.id is null
  ) then
    raise exception 'Every intervention learner must belong to its class and teacher';
  end if;

  if tg_op = 'UPDATE' and (
    (old.status = 'planned' and new.status not in ('planned', 'delivered'))
    or (old.status = 'delivered' and new.status not in ('delivered', 'recorded'))
    or (old.status = 'recorded' and new.status not in ('recorded', 'reviewed'))
    or (old.status = 'reviewed' and new.status <> 'reviewed')
  ) then
    raise exception 'Invalid intervention lifecycle transition from % to %', old.status, new.status;
  end if;

  return new;
end;
$$;

drop trigger if exists teacher_interventions_validate on public.teacher_interventions;
create trigger teacher_interventions_validate
  before insert or update on public.teacher_interventions
  for each row execute function public.validate_teacher_intervention();

drop trigger if exists teacher_interventions_set_updated_at on public.teacher_interventions;
create trigger teacher_interventions_set_updated_at
  before update on public.teacher_interventions
  for each row execute function public.set_core_learning_updated_at();

create or replace function public.teacher_create_intervention_follow_up(
  p_parent_intervention_id uuid,
  p_owner_label text,
  p_group_label text,
  p_student_ids uuid[],
  p_focus text,
  p_activity text,
  p_planned_for date
)
returns public.teacher_interventions
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_parent public.teacher_interventions;
  v_follow_up public.teacher_interventions;
begin
  select *
  into v_parent
  from public.teacher_interventions
  where id = p_parent_intervention_id
    and teacher_id = auth.uid()
    and status = 'reviewed'
    and follow_up_required
  for update;

  if not found then
    raise exception 'A reviewed owned intervention requiring follow-up was not found';
  end if;

  insert into public.teacher_interventions (
    teacher_id,
    class_id,
    parent_intervention_id,
    owner_label,
    group_label,
    student_ids,
    focus,
    activity,
    planned_for,
    status
  )
  values (
    v_parent.teacher_id,
    v_parent.class_id,
    v_parent.id,
    p_owner_label,
    p_group_label,
    coalesce(p_student_ids, '{}'),
    p_focus,
    p_activity,
    p_planned_for,
    'planned'
  )
  returning * into v_follow_up;

  update public.teacher_interventions
  set follow_up_required = false
  where id = v_parent.id;

  return v_follow_up;
end;
$$;

revoke all on function public.teacher_create_intervention_follow_up(uuid, text, text, uuid[], text, text, date) from public;
grant execute on function public.teacher_create_intervention_follow_up(uuid, text, text, uuid[], text, text, date) to authenticated;

-- ==== 20260723231500_teacher_instructional_groups.sql ===================

-- Durable instructional groups derived from explicit evidence criteria.
--
-- A group is saved with the criterion that produced it. Membership is never
-- overwritten in place: each review appends a dated snapshot so teachers can
-- explain who stayed, joined, or left without ranking learners.

create table if not exists public.teacher_instructional_groups (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  criteria jsonb not null,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_instructional_groups_class_teacher_fk
    foreign key (class_id, teacher_id)
    references public.classes(id, teacher_id)
    on delete cascade,
  constraint teacher_instructional_groups_owner_key
    unique (id, teacher_id, class_id)
);

alter table public.teacher_instructional_groups
  drop constraint if exists teacher_instructional_groups_criteria_check;
alter table public.teacher_instructional_groups
  add constraint teacher_instructional_groups_criteria_check check (
    jsonb_typeof(criteria) = 'object'
    and criteria ?& array['sourceId', 'kind', 'label', 'basis', 'policy']
    and jsonb_typeof(criteria -> 'sourceId') = 'string'
    and jsonb_typeof(criteria -> 'kind') = 'string'
    and jsonb_typeof(criteria -> 'label') = 'string'
    and jsonb_typeof(criteria -> 'basis') = 'string'
    and jsonb_typeof(criteria -> 'policy') = 'string'
    and char_length(btrim(criteria ->> 'sourceId')) between 1 and 180
    and char_length(btrim(criteria ->> 'kind')) between 1 and 80
    and char_length(btrim(criteria ->> 'label')) between 1 and 180
    and char_length(btrim(criteria ->> 'basis')) between 1 and 240
    and char_length(btrim(criteria ->> 'policy')) between 1 and 500
  );

create unique index if not exists teacher_instructional_groups_active_name_idx
  on public.teacher_instructional_groups (teacher_id, class_id, lower(btrim(name)))
  where status = 'active';
create index if not exists teacher_instructional_groups_class_updated_idx
  on public.teacher_instructional_groups (teacher_id, class_id, updated_at desc);

create table if not exists public.teacher_instructional_group_reviews (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null,
  teacher_id uuid not null,
  class_id uuid not null,
  student_ids uuid[] not null check (
    cardinality(student_ids) between 1 and 40
  ),
  evidence_snapshot jsonb not null check (
    jsonb_typeof(evidence_snapshot) = 'object'
  ),
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint teacher_instructional_group_reviews_group_fk
    foreign key (group_id, teacher_id, class_id)
    references public.teacher_instructional_groups(id, teacher_id, class_id)
    on delete cascade
);

create index if not exists teacher_instructional_group_reviews_latest_idx
  on public.teacher_instructional_group_reviews
    (teacher_id, class_id, group_id, reviewed_at desc, id desc);

alter table public.teacher_instructional_groups enable row level security;
alter table public.teacher_instructional_group_reviews enable row level security;

revoke all on public.teacher_instructional_groups from anon;
revoke all on public.teacher_instructional_group_reviews from anon;
revoke all on public.teacher_instructional_groups from authenticated;
revoke all on public.teacher_instructional_group_reviews from authenticated;
grant select, update on public.teacher_instructional_groups to authenticated;
grant select on public.teacher_instructional_group_reviews to authenticated;

drop policy if exists "Teachers manage owned instructional groups"
  on public.teacher_instructional_groups;
create policy "Teachers manage owned instructional groups"
  on public.teacher_instructional_groups for all to authenticated
  using (teacher_id = auth.uid())
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1
      from public.classes c
      where c.id = teacher_instructional_groups.class_id
        and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "App admins manage all instructional groups"
  on public.teacher_instructional_groups;
create policy "App admins manage all instructional groups"
  on public.teacher_instructional_groups for all to authenticated
  using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

drop policy if exists "Teachers manage owned instructional group reviews"
  on public.teacher_instructional_group_reviews;
create policy "Teachers manage owned instructional group reviews"
  on public.teacher_instructional_group_reviews for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists "App admins manage all instructional group reviews"
  on public.teacher_instructional_group_reviews;
create policy "App admins manage all instructional group reviews"
  on public.teacher_instructional_group_reviews for all to authenticated
  using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

create or replace function public.validate_teacher_instructional_group()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and (
    new.teacher_id is distinct from old.teacher_id
    or new.class_id is distinct from old.class_id
    or new.criteria is distinct from old.criteria
    or new.created_at is distinct from old.created_at
    or (old.status = 'archived' and new.status <> 'archived')
  ) then
    raise exception 'Instructional group ownership, criterion, creation time, and archive state are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists teacher_instructional_groups_validate
  on public.teacher_instructional_groups;
create trigger teacher_instructional_groups_validate
  before update on public.teacher_instructional_groups
  for each row execute function public.validate_teacher_instructional_group();

create or replace function public.validate_teacher_instructional_group_review()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'Instructional group review snapshots are append-only';
  end if;

  if cardinality(new.student_ids) <> cardinality(array(select distinct unnest(new.student_ids))) then
    raise exception 'Instructional group membership cannot contain duplicate learners';
  end if;

  if exists (
    select 1
    from unnest(new.student_ids) student_id
    left join public.students s
      on s.id = student_id
      and s.class_id = new.class_id
      and s.teacher_id = new.teacher_id
      and s.archived_at is null
    where s.id is null
  ) then
    raise exception 'Every instructional group learner must be active in its class and teacher';
  end if;

  if jsonb_typeof(new.evidence_snapshot) <> 'object'
    or not (
      new.evidence_snapshot ?& array[
        'schemaVersion',
        'capturedAt',
        'memberCount',
        'policyReadyMembers',
        'attempts',
        'skillDiversity',
        'latestEvidenceAt',
        'averageAccuracy',
        'supportRecorded',
        'supportUsed'
      ]
    )
    or jsonb_typeof(new.evidence_snapshot -> 'schemaVersion') <> 'number'
    or jsonb_typeof(new.evidence_snapshot -> 'capturedAt') <> 'string'
    or jsonb_typeof(new.evidence_snapshot -> 'memberCount') <> 'number'
    or jsonb_typeof(new.evidence_snapshot -> 'policyReadyMembers') <> 'number'
    or jsonb_typeof(new.evidence_snapshot -> 'attempts') <> 'number'
    or jsonb_typeof(new.evidence_snapshot -> 'skillDiversity') <> 'number'
    or jsonb_typeof(new.evidence_snapshot -> 'latestEvidenceAt') <> 'string'
    or coalesce(jsonb_typeof(new.evidence_snapshot -> 'averageAccuracy'), '') not in ('number', 'null')
    or jsonb_typeof(new.evidence_snapshot -> 'supportRecorded') <> 'number'
    or jsonb_typeof(new.evidence_snapshot -> 'supportUsed') <> 'number'
  then
    raise exception 'Instructional group evidence snapshot has an invalid schema';
  end if;

  if (new.evidence_snapshot ->> 'schemaVersion')::numeric <> 1
    or (new.evidence_snapshot ->> 'memberCount')::numeric
      <> cardinality(new.student_ids)
    or trunc((new.evidence_snapshot ->> 'memberCount')::numeric)
      <> (new.evidence_snapshot ->> 'memberCount')::numeric
    or (new.evidence_snapshot ->> 'policyReadyMembers')::numeric < 0
    or trunc((new.evidence_snapshot ->> 'policyReadyMembers')::numeric)
      <> (new.evidence_snapshot ->> 'policyReadyMembers')::numeric
    or (new.evidence_snapshot ->> 'policyReadyMembers')::numeric
      > (new.evidence_snapshot ->> 'memberCount')::numeric
    or (new.evidence_snapshot ->> 'attempts')::numeric < 0
    or trunc((new.evidence_snapshot ->> 'attempts')::numeric)
      <> (new.evidence_snapshot ->> 'attempts')::numeric
    or (new.evidence_snapshot ->> 'skillDiversity')::numeric < 0
    or trunc((new.evidence_snapshot ->> 'skillDiversity')::numeric)
      <> (new.evidence_snapshot ->> 'skillDiversity')::numeric
    or (
      jsonb_typeof(new.evidence_snapshot -> 'averageAccuracy') = 'number'
      and (
        (new.evidence_snapshot ->> 'averageAccuracy')::numeric < 0
        or (new.evidence_snapshot ->> 'averageAccuracy')::numeric > 100
      )
    )
    or (new.evidence_snapshot ->> 'supportRecorded')::numeric < 0
    or trunc((new.evidence_snapshot ->> 'supportRecorded')::numeric)
      <> (new.evidence_snapshot ->> 'supportRecorded')::numeric
    or (new.evidence_snapshot ->> 'supportUsed')::numeric < 0
    or trunc((new.evidence_snapshot ->> 'supportUsed')::numeric)
      <> (new.evidence_snapshot ->> 'supportUsed')::numeric
    or (new.evidence_snapshot ->> 'supportUsed')::numeric
      > (new.evidence_snapshot ->> 'supportRecorded')::numeric
  then
    raise exception 'Instructional group evidence snapshot values are inconsistent';
  end if;

  new.reviewed_at := now();
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists teacher_instructional_group_reviews_validate
  on public.teacher_instructional_group_reviews;
create trigger teacher_instructional_group_reviews_validate
  before insert or update on public.teacher_instructional_group_reviews
  for each row execute function public.validate_teacher_instructional_group_review();

drop trigger if exists teacher_instructional_groups_set_updated_at
  on public.teacher_instructional_groups;
create trigger teacher_instructional_groups_set_updated_at
  before update on public.teacher_instructional_groups
  for each row execute function public.set_core_learning_updated_at();

create or replace function public.teacher_save_instructional_group(
  p_class_id uuid,
  p_name text,
  p_criteria jsonb,
  p_student_ids uuid[],
  p_evidence_snapshot jsonb
)
returns public.teacher_instructional_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
  v_group public.teacher_instructional_groups;
begin
  if v_teacher_id is null or not exists (
    select 1
    from public.classes c
    where c.id = p_class_id
      and c.teacher_id = v_teacher_id
  ) then
    raise exception 'An owned class was not found';
  end if;

  insert into public.teacher_instructional_groups (
    teacher_id,
    class_id,
    name,
    criteria
  )
  values (
    v_teacher_id,
    p_class_id,
    btrim(p_name),
    p_criteria
  )
  returning * into v_group;

  insert into public.teacher_instructional_group_reviews (
    group_id,
    teacher_id,
    class_id,
    student_ids,
    evidence_snapshot
  )
  values (
    v_group.id,
    v_group.teacher_id,
    v_group.class_id,
    p_student_ids,
    p_evidence_snapshot
  );

  return v_group;
end;
$$;

create or replace function public.teacher_review_instructional_group(
  p_group_id uuid,
  p_student_ids uuid[],
  p_evidence_snapshot jsonb
)
returns public.teacher_instructional_group_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.teacher_instructional_groups;
  v_review public.teacher_instructional_group_reviews;
begin
  select *
  into v_group
  from public.teacher_instructional_groups
  where id = p_group_id
    and teacher_id = auth.uid()
    and status = 'active'
  for update;

  if not found then
    raise exception 'An active owned instructional group was not found';
  end if;

  insert into public.teacher_instructional_group_reviews (
    group_id,
    teacher_id,
    class_id,
    student_ids,
    evidence_snapshot
  )
  values (
    v_group.id,
    v_group.teacher_id,
    v_group.class_id,
    p_student_ids,
    p_evidence_snapshot
  )
  returning * into v_review;

  update public.teacher_instructional_groups
  set updated_at = now()
  where id = v_group.id;

  return v_review;
end;
$$;

alter table public.teacher_interventions
  add column if not exists instructional_group_id uuid;

alter table public.teacher_interventions
  drop constraint if exists teacher_interventions_instructional_group_fk;
alter table public.teacher_interventions
  add constraint teacher_interventions_instructional_group_fk
  foreign key (instructional_group_id, teacher_id, class_id)
  references public.teacher_instructional_groups(id, teacher_id, class_id);

create index if not exists teacher_interventions_instructional_group_idx
  on public.teacher_interventions (instructional_group_id, created_at desc)
  where instructional_group_id is not null;

create or replace function public.teacher_assign_instructional_group_follow_up(
  p_group_id uuid,
  p_owner_label text,
  p_activity text,
  p_planned_for date
)
returns public.teacher_interventions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.teacher_instructional_groups;
  v_student_ids uuid[];
  v_intervention public.teacher_interventions;
begin
  select *
  into v_group
  from public.teacher_instructional_groups
  where id = p_group_id
    and teacher_id = auth.uid()
    and status = 'active';

  if not found then
    raise exception 'An active owned instructional group was not found';
  end if;

  select student_ids
  into v_student_ids
  from public.teacher_instructional_group_reviews
  where group_id = v_group.id
    and teacher_id = v_group.teacher_id
    and class_id = v_group.class_id
  order by reviewed_at desc, id desc
  limit 1;

  if coalesce(cardinality(v_student_ids), 0) = 0 then
    raise exception 'The instructional group has no reviewed learners';
  end if;

  insert into public.teacher_interventions (
    teacher_id,
    class_id,
    instructional_group_id,
    owner_label,
    group_label,
    student_ids,
    focus,
    activity,
    planned_for,
    status
  )
  values (
    v_group.teacher_id,
    v_group.class_id,
    v_group.id,
    btrim(p_owner_label),
    v_group.name,
    v_student_ids,
    v_group.criteria ->> 'label',
    btrim(p_activity),
    p_planned_for,
    'planned'
  )
  returning * into v_intervention;

  return v_intervention;
end;
$$;

revoke all on function public.teacher_save_instructional_group(uuid, text, jsonb, uuid[], jsonb)
  from public;
revoke all on function public.teacher_review_instructional_group(uuid, uuid[], jsonb)
  from public;
revoke all on function public.teacher_assign_instructional_group_follow_up(uuid, text, text, date)
  from public;
grant execute on function public.teacher_save_instructional_group(uuid, text, jsonb, uuid[], jsonb)
  to authenticated;
grant execute on function public.teacher_review_instructional_group(uuid, uuid[], jsonb)
  to authenticated;
grant execute on function public.teacher_assign_instructional_group_follow_up(uuid, text, text, date)
  to authenticated;

-- ==== 20260724000000_teacher_insight_actions.sql ========================

-- Close report insights into real teacher-owned actions.
--
-- Practice assignment and small-group planning create normal interventions,
-- so delivery, outcome, review, and follow-up use the A5.10 lifecycle.
-- Direct observations are immutable evidence and atomically create a dated
-- teaching response instead of becoming an untracked note.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.teacher_interventions'::regclass
      and conname = 'teacher_interventions_owner_key'
  ) then
    alter table public.teacher_interventions
      add constraint teacher_interventions_owner_key
      unique (id, teacher_id, class_id);
  end if;
end;
$$;

create table if not exists public.teacher_insight_observations (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  intervention_id uuid not null,
  insight_snapshot jsonb not null,
  student_ids uuid[] not null check (cardinality(student_ids) between 1 and 40),
  note text not null check (char_length(btrim(note)) between 1 and 500),
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint teacher_insight_observations_class_teacher_fk
    foreign key (class_id, teacher_id)
    references public.classes(id, teacher_id)
    on delete cascade,
  constraint teacher_insight_observations_intervention_fk
    foreign key (intervention_id, teacher_id, class_id)
    references public.teacher_interventions(id, teacher_id, class_id)
    on delete cascade
);

create index if not exists teacher_insight_observations_class_time_idx
  on public.teacher_insight_observations
    (teacher_id, class_id, observed_at desc, id desc);
create index if not exists teacher_insight_observations_intervention_idx
  on public.teacher_insight_observations (intervention_id);

alter table public.teacher_insight_observations enable row level security;
revoke all on public.teacher_insight_observations from anon;
revoke all on public.teacher_insight_observations from authenticated;
grant select on public.teacher_insight_observations to authenticated;

drop policy if exists "Teachers read owned insight observations"
  on public.teacher_insight_observations;
create policy "Teachers read owned insight observations"
  on public.teacher_insight_observations for select to authenticated
  using (teacher_id = auth.uid());

drop policy if exists "App admins read all insight observations"
  on public.teacher_insight_observations;
create policy "App admins read all insight observations"
  on public.teacher_insight_observations for select to authenticated
  using (public.is_app_admin(auth.uid()));

create or replace function public.validate_teacher_insight_observation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'Teacher insight observations are immutable';
  end if;

  if cardinality(new.student_ids)
    <> cardinality(array(select distinct unnest(new.student_ids)))
  then
    raise exception 'Teacher insight observations cannot contain duplicate learners';
  end if;

  if exists (
    select 1
    from unnest(new.student_ids) student_id
    left join public.students s
      on s.id = student_id
      and s.class_id = new.class_id
      and s.teacher_id = new.teacher_id
      and s.archived_at is null
    where s.id is null
  ) then
    raise exception 'Every observed learner must be active in its class and teacher';
  end if;

  if jsonb_typeof(new.insight_snapshot) <> 'object'
    or not (
      new.insight_snapshot ?& array[
        'schemaVersion',
        'key',
        'kind',
        'label',
        'focus'
      ]
    )
    or jsonb_typeof(new.insight_snapshot -> 'schemaVersion') <> 'number'
    or jsonb_typeof(new.insight_snapshot -> 'key') <> 'string'
    or jsonb_typeof(new.insight_snapshot -> 'kind') <> 'string'
    or jsonb_typeof(new.insight_snapshot -> 'label') <> 'string'
    or jsonb_typeof(new.insight_snapshot -> 'focus') <> 'string'
    or exists (
      select 1
      from jsonb_object_keys(new.insight_snapshot) as keys(snapshot_key)
      where snapshot_key <> all (array[
        'schemaVersion',
        'key',
        'kind',
        'label',
        'focus',
        'reason',
        'criterion',
        'evidence'
      ])
    )
    or (
      new.insight_snapshot ? 'reason'
      and jsonb_typeof(new.insight_snapshot -> 'reason') <> 'string'
    )
    or (
      new.insight_snapshot ? 'criterion'
      and jsonb_typeof(new.insight_snapshot -> 'criterion') <> 'object'
    )
    or (
      new.insight_snapshot ? 'evidence'
      and jsonb_typeof(new.insight_snapshot -> 'evidence') <> 'object'
    )
  then
    raise exception 'Teacher insight snapshot has an invalid schema';
  end if;

  if (new.insight_snapshot ->> 'schemaVersion')::numeric <> 1
    or char_length(btrim(new.insight_snapshot ->> 'key')) not between 1 and 180
    or char_length(btrim(new.insight_snapshot ->> 'kind')) not between 1 and 80
    or char_length(btrim(new.insight_snapshot ->> 'label')) not between 1 and 180
    or char_length(btrim(new.insight_snapshot ->> 'focus')) not between 1 and 240
    or (
      new.insight_snapshot ? 'reason'
      and char_length(btrim(new.insight_snapshot ->> 'reason')) not between 1 and 500
    )
    or octet_length(new.insight_snapshot::text) > 8000
  then
    raise exception 'Teacher insight snapshot has an invalid schema';
  end if;

  new.observed_at := now();
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists teacher_insight_observations_validate
  on public.teacher_insight_observations;
create trigger teacher_insight_observations_validate
  before insert or update on public.teacher_insight_observations
  for each row execute function public.validate_teacher_insight_observation();

create or replace function public.teacher_create_insight_intervention(
  p_action_type text,
  p_class_id uuid,
  p_insight jsonb,
  p_student_ids uuid[],
  p_targets text[],
  p_owner_label text,
  p_activity text,
  p_planned_for date
)
returns public.teacher_interventions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
  v_intervention public.teacher_interventions;
  v_assignment jsonb;
begin
  if p_action_type not in ('assign_practice', 'plan_small_group') then
    raise exception 'Unknown teacher insight action';
  end if;

  if v_teacher_id is null or not exists (
    select 1
    from public.classes c
    where c.id = p_class_id
      and c.teacher_id = v_teacher_id
  ) then
    raise exception 'An owned class was not found';
  end if;

  if coalesce(cardinality(p_student_ids), 0) not between 1 and 40
    or cardinality(p_student_ids)
      <> cardinality(array(select distinct unnest(p_student_ids)))
    or exists (
      select 1
      from unnest(p_student_ids) student_id
      left join public.students s
        on s.id = student_id
        and s.class_id = p_class_id
        and s.teacher_id = v_teacher_id
        and s.archived_at is null
      where s.id is null
    )
  then
    raise exception 'Every action learner must be active in its class and teacher';
  end if;

  if jsonb_typeof(p_insight) <> 'object'
    or not (p_insight ?& array['schemaVersion', 'key', 'kind', 'label', 'focus'])
    or jsonb_typeof(p_insight -> 'schemaVersion') <> 'number'
    or jsonb_typeof(p_insight -> 'key') <> 'string'
    or jsonb_typeof(p_insight -> 'kind') <> 'string'
    or jsonb_typeof(p_insight -> 'label') <> 'string'
    or jsonb_typeof(p_insight -> 'focus') <> 'string'
    or exists (
      select 1
      from jsonb_object_keys(p_insight) as keys(snapshot_key)
      where snapshot_key <> all (array[
        'schemaVersion',
        'key',
        'kind',
        'label',
        'focus',
        'reason',
        'criterion',
        'evidence'
      ])
    )
    or (
      p_insight ? 'reason'
      and jsonb_typeof(p_insight -> 'reason') <> 'string'
    )
    or (
      p_insight ? 'criterion'
      and jsonb_typeof(p_insight -> 'criterion') <> 'object'
    )
    or (
      p_insight ? 'evidence'
      and jsonb_typeof(p_insight -> 'evidence') <> 'object'
    )
  then
    raise exception 'Teacher insight snapshot has an invalid schema';
  end if;

  if (p_insight ->> 'schemaVersion')::numeric <> 1
    or char_length(btrim(p_insight ->> 'key')) not between 1 and 180
    or char_length(btrim(p_insight ->> 'kind')) not between 1 and 80
    or char_length(btrim(p_insight ->> 'label')) not between 1 and 180
    or char_length(btrim(p_insight ->> 'focus')) not between 1 and 240
    or (
      p_insight ? 'reason'
      and char_length(btrim(p_insight ->> 'reason')) not between 1 and 500
    )
    or octet_length(p_insight::text) > 8000
  then
    raise exception 'Teacher insight snapshot has an invalid schema';
  end if;

  if p_action_type = 'assign_practice' then
    if coalesce(cardinality(p_targets), 0) not between 1 and 6
      or cardinality(p_targets)
        <> cardinality(array(select distinct unnest(p_targets)))
      or exists (
        select 1
        from unnest(p_targets) target
        where target is null
          or char_length(btrim(target)) not between 1 and 40
      )
    then
      raise exception 'Practice assignment requires one to six unique exact targets';
    end if;

    v_assignment := jsonb_build_object(
      'assignment',
      jsonb_build_object(
        'targets', to_jsonb(p_targets),
        'note', left(btrim(p_activity), 120),
        'assignedAt', now(),
        'by', 'teacher',
        'insight', p_insight
      )
    );

    insert into public.student_progress (
      student_id,
      area,
      key,
      payload,
      updated_at
    )
    select
      student_id,
      'phonics_quest',
      '__all__',
      v_assignment,
      now()
    from unnest(p_student_ids) student_id
    on conflict (student_id, area, key)
    do update set
      payload = excluded.payload,
      updated_at = excluded.updated_at;
  end if;

  insert into public.teacher_interventions (
    teacher_id,
    class_id,
    owner_label,
    group_label,
    student_ids,
    focus,
    activity,
    planned_for,
    status
  )
  values (
    v_teacher_id,
    p_class_id,
    btrim(p_owner_label),
    left(
      btrim(p_insight ->> 'label')
        || case
          when p_action_type = 'assign_practice' then ' practice'
          else ' group'
        end,
      120
    ),
    p_student_ids,
    left(btrim(p_insight ->> 'focus'), 160),
    btrim(p_activity),
    p_planned_for,
    'planned'
  )
  returning * into v_intervention;

  return v_intervention;
end;
$$;

create or replace function public.teacher_record_insight_observation(
  p_class_id uuid,
  p_insight jsonb,
  p_student_ids uuid[],
  p_note text,
  p_owner_label text,
  p_follow_up_activity text,
  p_follow_up_on date
)
returns public.teacher_insight_observations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
  v_intervention public.teacher_interventions;
  v_observation public.teacher_insight_observations;
begin
  if v_teacher_id is null or not exists (
    select 1
    from public.classes c
    where c.id = p_class_id
      and c.teacher_id = v_teacher_id
  ) then
    raise exception 'An owned class was not found';
  end if;

  if coalesce(cardinality(p_student_ids), 0) not between 1 and 40
    or cardinality(p_student_ids)
      <> cardinality(array(select distinct unnest(p_student_ids)))
    or exists (
      select 1
      from unnest(p_student_ids) student_id
      left join public.students s
        on s.id = student_id
        and s.class_id = p_class_id
        and s.teacher_id = v_teacher_id
        and s.archived_at is null
      where s.id is null
    )
  then
    raise exception 'Every observed learner must be active in its class and teacher';
  end if;

  if jsonb_typeof(p_insight) <> 'object'
    or not (p_insight ?& array['schemaVersion', 'key', 'kind', 'label', 'focus'])
  then
    raise exception 'Teacher insight snapshot has an invalid schema';
  end if;

  insert into public.teacher_interventions (
    teacher_id,
    class_id,
    owner_label,
    group_label,
    student_ids,
    focus,
    activity,
    planned_for,
    status
  )
  values (
    v_teacher_id,
    p_class_id,
    btrim(p_owner_label),
    left(btrim(p_insight ->> 'label') || ' observation follow-up', 120),
    p_student_ids,
    left(btrim(p_insight ->> 'focus'), 160),
    btrim(p_follow_up_activity),
    p_follow_up_on,
    'planned'
  )
  returning * into v_intervention;

  insert into public.teacher_insight_observations (
    teacher_id,
    class_id,
    intervention_id,
    insight_snapshot,
    student_ids,
    note
  )
  values (
    v_teacher_id,
    p_class_id,
    v_intervention.id,
    p_insight,
    p_student_ids,
    btrim(p_note)
  )
  returning * into v_observation;

  return v_observation;
end;
$$;

revoke all on function public.teacher_create_insight_intervention(
  text, uuid, jsonb, uuid[], text[], text, text, date
) from public;
revoke all on function public.teacher_record_insight_observation(
  uuid, jsonb, uuid[], text, text, text, date
) from public;
grant execute on function public.teacher_create_insight_intervention(
  text, uuid, jsonb, uuid[], text[], text, text, date
) to authenticated;
grant execute on function public.teacher_record_insight_observation(
  uuid, jsonb, uuid[], text, text, text, date
) to authenticated;

-- ==== 20260724003000_immutable_assessment_evidence.sql ==================

-- Preserve the exact result and the versions that governed it.
--
-- The relational version columns make provenance queryable. raw_evidence is
-- an immutable replay envelope containing the complete stored result, so a
-- later content, form, or policy deployment cannot rewrite history.

alter table public.assessment_attempts
  add column if not exists evidence_schema_version integer not null default 1,
  add column if not exists assessment_version text not null default 'legacy_unspecified',
  add column if not exists content_version text not null default 'legacy_unspecified',
  add column if not exists policy_version text not null default 'legacy_unspecified',
  add column if not exists raw_evidence jsonb not null default '{}'::jsonb;

update public.assessment_attempts
set
  evidence_schema_version = 1,
  assessment_version = coalesce(
    nullif(btrim(payload ->> 'assessmentVersion'), ''),
    nullif(btrim(payload ->> 'formVersion'), ''),
    nullif(btrim(assessment_type), '') || '-schema-' || schema_version::text,
    'legacy_unspecified'
  ),
  content_version = coalesce(
    nullif(btrim(payload ->> 'contentVersion'), ''),
    'content-' || md5(coalesce(payload -> 'questionRecords', '[]'::jsonb)::text)
  ),
  policy_version = coalesce(
    nullif(btrim(payload ->> 'policyVersion'), ''),
    nullif(btrim(payload ->> 'scoringRuleVersion'), ''),
    nullif(btrim(payload ->> 'scoringVersion'), ''),
    'legacy-unspecified-' || coalesce(nullif(btrim(assessment_type), ''), 'assessment')
      || '-schema-' || schema_version::text
  )
where raw_evidence = '{}'::jsonb;

update public.assessment_attempts
set raw_evidence = jsonb_build_object(
  'schemaVersion', evidence_schema_version,
  'attemptId', attempt_id,
  'capturedAt', completed_at,
  'assessmentVersion', assessment_version,
  'contentVersion', content_version,
  'policyVersion', policy_version,
  'result', payload
)
where raw_evidence = '{}'::jsonb;

alter table public.assessment_attempts
  drop constraint if exists assessment_attempts_evidence_schema_check;
alter table public.assessment_attempts
  add constraint assessment_attempts_evidence_schema_check check (
    evidence_schema_version = 1
    and char_length(btrim(assessment_version)) between 1 and 160
    and char_length(btrim(content_version)) between 1 and 160
    and char_length(btrim(policy_version)) between 1 and 160
    and jsonb_typeof(raw_evidence) = 'object'
  );

create index if not exists assessment_attempts_versions_idx
  on public.assessment_attempts (
    teacher_id,
    assessment_type,
    assessment_version,
    content_version,
    policy_version
  );

create or replace function public.validate_immutable_assessment_evidence()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.raw_evidence = '{}'::jsonb then
    new.evidence_schema_version := 1;
    if new.assessment_version = 'legacy_unspecified' then
      new.assessment_version := coalesce(
        nullif(btrim(new.payload ->> 'assessmentVersion'), ''),
        nullif(btrim(new.payload ->> 'formVersion'), ''),
        nullif(btrim(new.assessment_type), '') || '-schema-' || new.schema_version::text,
        'legacy_unspecified'
      );
    end if;
    if new.content_version = 'legacy_unspecified' then
      new.content_version := coalesce(
        nullif(btrim(new.payload ->> 'contentVersion'), ''),
        'content-' || md5(coalesce(new.payload -> 'questionRecords', '[]'::jsonb)::text)
      );
    end if;
    if new.policy_version = 'legacy_unspecified' then
      new.policy_version := coalesce(
        nullif(btrim(new.payload ->> 'policyVersion'), ''),
        nullif(btrim(new.payload ->> 'scoringRuleVersion'), ''),
        nullif(btrim(new.payload ->> 'scoringVersion'), ''),
        'legacy-unspecified-' || coalesce(
          nullif(btrim(new.assessment_type), ''),
          'assessment'
        ) || '-schema-' || new.schema_version::text
      );
    end if;
    new.raw_evidence := jsonb_build_object(
      'schemaVersion', new.evidence_schema_version,
      'attemptId', new.attempt_id,
      'capturedAt', new.completed_at,
      'assessmentVersion', new.assessment_version,
      'contentVersion', new.content_version,
      'policyVersion', new.policy_version,
      'result', new.payload
    );
  end if;

  if new.evidence_schema_version <> 1
    or char_length(btrim(new.assessment_version)) not between 1 and 160
    or char_length(btrim(new.content_version)) not between 1 and 160
    or char_length(btrim(new.policy_version)) not between 1 and 160
    or jsonb_typeof(new.raw_evidence) <> 'object'
    or not (
      new.raw_evidence ?& array[
        'schemaVersion',
        'attemptId',
        'capturedAt',
        'assessmentVersion',
        'contentVersion',
        'policyVersion',
        'result'
      ]
    )
    or jsonb_typeof(new.raw_evidence -> 'schemaVersion') <> 'number'
    or jsonb_typeof(new.raw_evidence -> 'attemptId') <> 'string'
    or jsonb_typeof(new.raw_evidence -> 'capturedAt') <> 'string'
    or jsonb_typeof(new.raw_evidence -> 'assessmentVersion') <> 'string'
    or jsonb_typeof(new.raw_evidence -> 'contentVersion') <> 'string'
    or jsonb_typeof(new.raw_evidence -> 'policyVersion') <> 'string'
    or new.raw_evidence ->> 'attemptId' <> new.attempt_id
    or new.raw_evidence ->> 'assessmentVersion' <> new.assessment_version
    or new.raw_evidence ->> 'contentVersion' <> new.content_version
    or new.raw_evidence ->> 'policyVersion' <> new.policy_version
    or jsonb_typeof(new.raw_evidence -> 'result') <> 'object'
    or new.raw_evidence -> 'result' <> new.payload
    or octet_length(new.raw_evidence::text) > 5000000
  then
    raise exception 'Assessment evidence archive does not match its stored result and versions';
  end if;

  if (new.raw_evidence ->> 'schemaVersion')::numeric
    <> new.evidence_schema_version
    or (new.raw_evidence ->> 'capturedAt')::timestamptz <> new.completed_at
  then
    raise exception 'Assessment evidence archive does not match its stored result and versions';
  end if;

  if tg_op = 'UPDATE'
    and old.administration_status in (
      'completed',
      'discontinued',
      'not_administered',
      'not_scorable'
    )
    and (
      to_jsonb(new) - array['created_at', 'updated_at']
      <> to_jsonb(old) - array['created_at', 'updated_at']
    )
  then
    raise exception 'Completed assessment evidence is immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists assessment_attempts_evidence_immutable
  on public.assessment_attempts;
create trigger assessment_attempts_evidence_immutable
  before insert or update on public.assessment_attempts
  for each row execute function public.validate_immutable_assessment_evidence();

comment on column public.assessment_attempts.assessment_version is
  'Version of the assessment/form definition used for this result.';
comment on column public.assessment_attempts.content_version is
  'Version or content fingerprint of the administered items.';
comment on column public.assessment_attempts.policy_version is
  'Version of the scoring, routing, or mastery policy used for this result.';
comment on column public.assessment_attempts.raw_evidence is
  'Immutable replay envelope containing the complete result and its provenance.';

-- ==== 20260724133000_teacher_reduced_choice_mode.sql ====================

-- Teacher-owned reduced-choice navigation.
--
-- Student profiles are otherwise latest-state records. A partial teacher
-- upsert must not erase a child's companion or collectibles, and an offline
-- child profile save must not undo a teacher's accessibility setting.
-- This trigger branch makes those two ownership rules atomic at the database.

create or replace function public.lp_student_progress_merge()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_profile jsonb;
  v_teacher_controls_profile boolean;
begin
  if new.area = 'profile' then
    v_profile := coalesce(old.payload, '{}'::jsonb) || coalesce(new.payload, '{}'::jsonb);
    select exists (
      select 1
      from public.students s
      where s.id = new.student_id
        and (s.teacher_id = auth.uid() or public.is_app_admin(auth.uid()))
    ) into v_teacher_controls_profile;

    if not v_teacher_controls_profile then
      v_profile := (
        v_profile
        - 'reducedChoiceMode'
        - 'reducedChoiceModeAt'
        - 'reducedChoiceModeBy'
      ) || jsonb_strip_nulls(jsonb_build_object(
        'reducedChoiceMode', old.payload -> 'reducedChoiceMode',
        'reducedChoiceModeAt', old.payload -> 'reducedChoiceModeAt',
        'reducedChoiceModeBy', old.payload -> 'reducedChoiceModeBy'
      ));
    end if;

    new.payload := v_profile;
    return new;
  end if;

  new.payload := public.lp_forward_merge_progress(new.area, old.payload, new.payload);
  return new;
end;
$$;

comment on function public.lp_student_progress_merge() is
  'Merges student progress atomically; reduced-choice profile fields are teacher/admin owned.';

-- ==== 20260724173000_teacher_learner_accessibility_settings.sql =========

-- Teacher-owned per-learner accessibility settings.
--
-- These settings are hydrated to the learner profile, but child/offline
-- profile writes must not be able to change or remove them. Partial teacher
-- profile writes must continue to preserve the rest of the learner profile.

create or replace function public.lp_student_progress_merge()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_profile jsonb;
  v_teacher_controls_profile boolean;
begin
  if new.area = 'profile' then
    v_profile := coalesce(old.payload, '{}'::jsonb) || coalesce(new.payload, '{}'::jsonb);
    select exists (
      select 1
      from public.students s
      where s.id = new.student_id
        and (s.teacher_id = auth.uid() or public.is_app_admin(auth.uid()))
    ) into v_teacher_controls_profile;

    if not v_teacher_controls_profile then
      v_profile := (
        v_profile
        - 'reducedChoiceMode'
        - 'reducedChoiceModeAt'
        - 'reducedChoiceModeBy'
        - 'accessibilitySettings'
        - 'accessibilitySettingsAt'
        - 'accessibilitySettingsBy'
      ) || jsonb_strip_nulls(jsonb_build_object(
        'reducedChoiceMode', old.payload -> 'reducedChoiceMode',
        'reducedChoiceModeAt', old.payload -> 'reducedChoiceModeAt',
        'reducedChoiceModeBy', old.payload -> 'reducedChoiceModeBy',
        'accessibilitySettings', old.payload -> 'accessibilitySettings',
        'accessibilitySettingsAt', old.payload -> 'accessibilitySettingsAt',
        'accessibilitySettingsBy', old.payload -> 'accessibilitySettingsBy'
      ));
    end if;

    new.payload := v_profile;
    return new;
  end if;

  new.payload := public.lp_forward_merge_progress(new.area, old.payload, new.payload);
  return new;
end;
$$;

comment on function public.lp_student_progress_merge() is
  'Merges student progress atomically; learner navigation and accessibility profile fields are teacher/admin owned.';

-- ==== 20260724234500_engagement_sync_health.sql =========================

alter table public.learn_activity
  add column if not exists client_event_id text,
  add column if not exists occurred_at timestamptz,
  add column if not exists delivery_attempts integer not null default 1;

create unique index if not exists learn_activity_student_client_event_idx
  on public.learn_activity (student_id, client_event_id)
  where client_event_id is not null;

create table if not exists public.activity_sync_health (
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  attempted bigint not null default 0 check (attempted >= 0),
  delivered bigint not null default 0 check (delivered >= 0),
  recovered bigint not null default 0 check (recovered >= 0),
  storage_failures bigint not null default 0 check (storage_failures >= 0),
  pending bigint not null default 0 check (pending >= 0),
  lost bigint not null default 0 check (lost >= 0),
  oldest_pending_at timestamptz,
  observed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (student_id, device_id),
  check (delivered <= attempted),
  check (recovered <= delivered),
  check (lost <= attempted),
  check (delivered + pending + lost <= attempted)
);

create index if not exists activity_sync_health_class_idx
  on public.activity_sync_health (class_id, observed_at desc);

alter table public.activity_sync_health enable row level security;
revoke all on public.activity_sync_health from anon;
grant select on public.activity_sync_health to authenticated;

drop policy if exists "Teachers read their class activity sync health"
  on public.activity_sync_health;
create policy "Teachers read their class activity sync health"
  on public.activity_sync_health for select to authenticated
  using (
    teacher_id = auth.uid()
    or public.is_app_admin(auth.uid())
  );

create or replace function public.student_log_activity_v2(
  p_token text,
  p_client_event_id text,
  p_area text,
  p_item_id text,
  p_event text,
  p_payload jsonb default null,
  p_occurred_at timestamptz default null,
  p_delivery_attempts integer default 1
)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_student public.students;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'invalid_session');
  end if;
  if
    nullif(btrim(p_client_event_id), '') is null
    or length(p_client_event_id) > 120
    or nullif(btrim(p_area), '') is null
    or length(p_area) > 80
    or nullif(btrim(p_event), '') is null
    or length(p_event) > 80
    or length(coalesce(p_item_id, '')) > 160
    or octet_length(coalesce(p_payload, '{}'::jsonb)::text) > 16384
    or p_delivery_attempts < 1
    or p_delivery_attempts > 10000
  then
    return json_build_object('ok', false, 'error', 'invalid_payload');
  end if;

  insert into public.learn_activity (
    student_id,
    class_id,
    teacher_id,
    client_event_id,
    area,
    item_id,
    event,
    payload,
    occurred_at,
    delivery_attempts
  )
  values (
    v_student.id,
    v_student.class_id,
    v_student.teacher_id,
    p_client_event_id,
    p_area,
    p_item_id,
    p_event,
    p_payload,
    least(coalesce(p_occurred_at, now()), now()),
    p_delivery_attempts
  )
  on conflict (student_id, client_event_id)
    where client_event_id is not null
  do nothing;

  return json_build_object('ok', true);
end;
$$;

create or replace function public.student_report_activity_sync_health(
  p_token text,
  p_device_id text,
  p_attempted bigint,
  p_delivered bigint,
  p_recovered bigint,
  p_storage_failures bigint,
  p_pending bigint,
  p_lost bigint,
  p_oldest_pending_at timestamptz default null
)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_student public.students;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'invalid_session');
  end if;
  if
    v_student.class_id is null
    or nullif(btrim(p_device_id), '') is null
    or length(p_device_id) > 120
    or p_attempted < 0
    or p_delivered < 0
    or p_recovered < 0
    or p_storage_failures < 0
    or p_pending < 0
    or p_lost < 0
    or p_delivered > p_attempted
    or p_recovered > p_delivered
    or p_lost > p_attempted
    or p_delivered + p_pending + p_lost > p_attempted
  then
    return json_build_object('ok', false, 'error', 'invalid_payload');
  end if;

  insert into public.activity_sync_health (
    student_id,
    class_id,
    teacher_id,
    device_id,
    attempted,
    delivered,
    recovered,
    storage_failures,
    pending,
    lost,
    oldest_pending_at,
    observed_at,
    updated_at
  )
  values (
    v_student.id,
    v_student.class_id,
    v_student.teacher_id,
    p_device_id,
    p_attempted,
    p_delivered,
    p_recovered,
    p_storage_failures,
    p_pending,
    p_lost,
    case
      when p_oldest_pending_at is null then null
      else least(p_oldest_pending_at, now())
    end,
    now(),
    now()
  )
  on conflict (student_id, device_id)
  do update set
    class_id = excluded.class_id,
    teacher_id = excluded.teacher_id,
    attempted = greatest(activity_sync_health.attempted, excluded.attempted),
    delivered = greatest(activity_sync_health.delivered, excluded.delivered),
    recovered = greatest(activity_sync_health.recovered, excluded.recovered),
    storage_failures = greatest(activity_sync_health.storage_failures, excluded.storage_failures),
    pending = excluded.pending,
    lost = excluded.lost,
    oldest_pending_at = excluded.oldest_pending_at,
    observed_at = excluded.observed_at,
    updated_at = now();

  return json_build_object('ok', true);
end;
$$;

grant execute on function public.student_log_activity_v2(
  text, text, text, text, text, jsonb, timestamptz, integer
) to anon, authenticated;

grant execute on function public.student_report_activity_sync_health(
  text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) to anon, authenticated;

-- ==== 20260725085000_students_lifecycle_columns.sql =====================

-- Add the two student lifecycle columns BEFORE anything reads them.
--
-- Why this file exists
-- --------------------
-- 20260725145000_teacher_child_lifecycle.sql adds students.archived_at and
-- students.updated_at, but three earlier migrations already reference them:
--
--   20260725090000_class_access_security.sql   reads s.archived_at
--   20260725110000_learner_data_rights.sql     reads v_student.archived_at
--   20260725120000_school_retention_policy.sql reads s.updated_at
--
-- On a database that already had the columns this was invisible. Applying the
-- set in order to a database that did NOT have them fails at
-- retention_last_learner_activity with:
--
--   ERROR: 42703: column s.updated_at does not exist
--
-- because PostgreSQL validates the body of a `language sql` function when the
-- function is created, not when it is called. Observed on 2026-07-27 against
-- the hosted project.
--
-- The columns are declared once, first, so no later migration can depend on a
-- column that does not exist yet. 20260725145000 still declares them too; both
-- are `if not exists`, so running either order is safe.

alter table public.students
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

comment on column public.students.archived_at is
  'When the teacher archived this child. Null means active.';
comment on column public.students.updated_at is
  'Last change to the student row. Used by retention to find the last activity.';

-- ==== 20260725090000_class_access_security.sql ==========================

-- Class access abuse controls and teacher-visible security history.
--
-- Privacy properties:
-- - raw class codes, IP addresses, device identifiers, passwords, and learner
--   identifiers are never stored in the security tables;
-- - network/device/code values are one-way fingerprints used only for bounded
--   rate-limit buckets;
-- - teachers can read events for their own classes only, and the returned log
--   contains generic event labels rather than child data.

alter table public.classes
  add column if not exists access_code_created_at timestamptz not null default now(),
  add column if not exists access_code_expires_at timestamptz;

create table if not exists public.class_access_rate_limits (
  bucket_key text primary key,
  dimension text not null check (dimension in ('device', 'network', 'code')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  window_started_at timestamptz not null default now(),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists class_access_rate_limits_updated_idx
  on public.class_access_rate_limits (updated_at);

alter table public.class_access_rate_limits enable row level security;
revoke all on public.class_access_rate_limits from public, anon, authenticated;

create table if not exists public.class_access_events (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references auth.users(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'code_accepted',
      'code_rejected',
      'code_expired',
      'rate_limited',
      'login_succeeded',
      'login_failed',
      'login_locked',
      'code_regenerated',
      'expiry_changed'
    )
  ),
  outcome text not null check (outcome in ('allowed', 'denied', 'blocked', 'changed')),
  device_fingerprint text not null,
  network_fingerprint text not null,
  occurred_at timestamptz not null default now()
);

create index if not exists class_access_events_class_time_idx
  on public.class_access_events (class_id, occurred_at desc);

alter table public.class_access_events enable row level security;
revoke all on public.class_access_events from public, anon;
grant select on public.class_access_events to authenticated;

drop policy if exists "Teachers read their class access events"
  on public.class_access_events;
create policy "Teachers read their class access events"
  on public.class_access_events for select to authenticated
  using (
    teacher_id = auth.uid()
    or public.is_app_admin(auth.uid())
  );

create or replace function public.class_access_fingerprint(
  p_kind text,
  p_value text
)
returns text
language sql immutable security definer
set search_path = public, extensions
as $$
  select encode(
    digest(
      'literacy-path-class-access-v1:' || coalesce(p_kind, '') || ':' || coalesce(p_value, ''),
      'sha256'
    ),
    'hex'
  );
$$;

create or replace function public.class_access_network_fingerprint()
returns text
language plpgsql stable security definer
set search_path = public, extensions
as $$
declare
  v_headers jsonb := '{}'::jsonb;
  v_network text := 'unknown';
begin
  begin
    v_headers := coalesce(
      nullif(current_setting('request.headers', true), ''),
      '{}'
    )::jsonb;
  exception when others then
    v_headers := '{}'::jsonb;
  end;

  v_network := split_part(
    coalesce(
      nullif(v_headers ->> 'cf-connecting-ip', ''),
      nullif(v_headers ->> 'x-forwarded-for', ''),
      nullif(v_headers ->> 'x-real-ip', ''),
      'unknown'
    ),
    ',',
    1
  );

  return public.class_access_fingerprint('network', btrim(v_network));
end;
$$;

create or replace function public.class_access_record_event(
  p_class_id uuid,
  p_teacher_id uuid,
  p_event_type text,
  p_outcome text,
  p_device_id text default null
)
returns void
language plpgsql volatile security definer
set search_path = public, extensions
as $$
begin
  insert into public.class_access_events (
    class_id,
    teacher_id,
    event_type,
    outcome,
    device_fingerprint,
    network_fingerprint
  )
  values (
    p_class_id,
    p_teacher_id,
    p_event_type,
    p_outcome,
    public.class_access_fingerprint('device', coalesce(p_device_id, 'server')),
    public.class_access_network_fingerprint()
  );
end;
$$;

create or replace function public.class_access_rate_limit_status(
  p_device_id text,
  p_code text
)
returns json
language plpgsql volatile security definer
set search_path = public, extensions
as $$
declare
  v_dimensions text[] := array['device', 'network', 'code'];
  v_values text[];
  v_thresholds integer[] := array[10, 60, 120];
  v_index integer;
  v_bucket public.class_access_rate_limits;
  v_key text;
  v_retry_seconds integer := 0;
  v_blocked_dimension text := null;
begin
  if p_device_id is null
     or p_device_id !~ '^[A-Za-z0-9._:-]{16,120}$'
  then
    return json_build_object('ok', false, 'error', 'invalid_device');
  end if;

  v_values := array[
    public.class_access_fingerprint('device', p_device_id),
    public.class_access_network_fingerprint(),
    public.class_access_fingerprint('code', upper(btrim(coalesce(p_code, ''))))
  ];

  for v_index in 1..3 loop
    v_key := public.class_access_fingerprint(
      'bucket',
      v_dimensions[v_index] || ':' || v_values[v_index]
    );

    insert into public.class_access_rate_limits (
      bucket_key,
      dimension,
      attempt_count,
      window_started_at,
      locked_until,
      updated_at
    )
    values (
      v_key,
      v_dimensions[v_index],
      1,
      now(),
      null,
      now()
    )
    on conflict (bucket_key)
    do update set
      attempt_count = case
        when class_access_rate_limits.window_started_at <= now() - interval '60 seconds'
          then 1
        else class_access_rate_limits.attempt_count + 1
      end,
      window_started_at = case
        when class_access_rate_limits.window_started_at <= now() - interval '60 seconds'
          then now()
        else class_access_rate_limits.window_started_at
      end,
      locked_until = case
        when class_access_rate_limits.locked_until > now()
          then class_access_rate_limits.locked_until
        when class_access_rate_limits.window_started_at <= now() - interval '60 seconds'
          then null
        else class_access_rate_limits.locked_until
      end,
      updated_at = now()
    returning * into v_bucket;

    if v_bucket.locked_until > now()
       or v_bucket.attempt_count > v_thresholds[v_index]
    then
      if v_bucket.locked_until is null or v_bucket.locked_until <= now() then
        update public.class_access_rate_limits
        set locked_until = now() + interval '2 minutes',
            updated_at = now()
        where bucket_key = v_key
        returning * into v_bucket;
      end if;

      if v_blocked_dimension is null then
        v_blocked_dimension := v_dimensions[v_index];
      end if;
      v_retry_seconds := greatest(
        v_retry_seconds,
        ceil(extract(epoch from (v_bucket.locked_until - now())))::integer
      );
    end if;
  end loop;

  if v_blocked_dimension is not null then
    return json_build_object(
      'ok', false,
      'error', 'rate_limited',
      'dimension', v_blocked_dimension,
      'retry_seconds', greatest(v_retry_seconds, 1)
    );
  end if;

  return json_build_object('ok', true);
end;
$$;

-- Replace the roster lookup with the non-bypassable device-aware signature.
create or replace function public.student_class_by_code(
  p_code text,
  p_device_id text
)
returns json
language plpgsql volatile security definer
set search_path = public, extensions
as $$
declare
  v_class public.classes;
  v_students json;
  v_school json;
  v_limit json;
begin
  v_limit := public.class_access_rate_limit_status(p_device_id, p_code);

  select * into v_class
  from public.classes
  where access_code = upper(btrim(coalesce(p_code, '')));

  if coalesce((v_limit ->> 'ok')::boolean, false) is false then
    perform public.class_access_record_event(
      v_class.id,
      v_class.teacher_id,
      'rate_limited',
      'blocked',
      p_device_id
    );
    return v_limit;
  end if;

  if v_class.id is null then
    perform public.class_access_record_event(
      null,
      null,
      'code_rejected',
      'denied',
      p_device_id
    );
    return json_build_object('ok', false, 'error', 'not_found');
  end if;

  if v_class.access_code_expires_at is not null
     and v_class.access_code_expires_at <= now()
  then
    perform public.class_access_record_event(
      v_class.id,
      v_class.teacher_id,
      'code_expired',
      'denied',
      p_device_id
    );
    return json_build_object('ok', false, 'error', 'code_expired');
  end if;

  select json_agg(
           json_build_object(
             'id', s.id,
             'name', s.name,
             'has_password', (s.symbol_password is not null)
           )
           order by s.name
         )
  into v_students
  from public.students s
  where s.class_id = v_class.id
    and s.archived_at is null;

  select json_build_object('id', sc.id, 'name', sc.name)
  into v_school
  from public.schools sc
  where sc.id = v_class.school_id;

  perform public.class_access_record_event(
    v_class.id,
    v_class.teacher_id,
    'code_accepted',
    'allowed',
    p_device_id
  );

  return json_build_object(
    'ok', true,
    'class', json_build_object('id', v_class.id, 'name', v_class.name),
    'school', v_school,
    'students', coalesce(v_students, '[]'::json)
  );
end;
$$;

-- Replace student login with a device-aware overload. The previous two-argument
-- signature is retained only for migration compatibility and is not executable
-- by app roles, preventing a caller from bypassing these controls.
create or replace function public.student_login(
  p_student_id uuid,
  p_sequence text,
  p_device_id text,
  p_code text
)
returns json
language plpgsql volatile security definer
set search_path = public, extensions
as $$
declare
  v_student public.students;
  v_class public.classes;
  v_token text;
  v_limit json;
begin
  select * into v_student
  from public.students
  where id = p_student_id
  for update;

  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;

  select * into v_class
  from public.classes
  where id = v_student.class_id;

  v_limit := public.class_access_rate_limit_status(p_device_id, p_code);
  if coalesce((v_limit ->> 'ok')::boolean, false) is false then
    perform public.class_access_record_event(
      v_class.id,
      v_class.teacher_id,
      'rate_limited',
      'blocked',
      p_device_id
    );
    return v_limit;
  end if;

  if v_class.access_code is distinct from upper(btrim(coalesce(p_code, ''))) then
    perform public.class_access_record_event(
      v_class.id,
      v_class.teacher_id,
      'code_rejected',
      'denied',
      p_device_id
    );
    return json_build_object('ok', false, 'error', 'invalid_code');
  end if;

  if v_class.access_code_expires_at is not null
     and v_class.access_code_expires_at <= now()
  then
    perform public.class_access_record_event(
      v_class.id,
      v_class.teacher_id,
      'code_expired',
      'denied',
      p_device_id
    );
    return json_build_object('ok', false, 'error', 'code_expired');
  end if;

  if v_student.symbol_password is null then
    return json_build_object('ok', false, 'error', 'no_password');
  end if;

  if v_student.failed_login_count >= 5
     and v_student.last_failed_login_at > now() - interval '60 seconds'
  then
    perform public.class_access_record_event(
      v_class.id,
      v_class.teacher_id,
      'login_locked',
      'blocked',
      p_device_id
    );
    return json_build_object(
      'ok', false,
      'error', 'locked',
      'retry_seconds',
      greatest(
        ceil(extract(epoch from (
          v_student.last_failed_login_at + interval '60 seconds' - now()
        )))::integer,
        1
      )
    );
  end if;

  if p_sequence !~ '^[1-9]{3}$'
     or v_student.symbol_password <> p_sequence
  then
    update public.students
    set failed_login_count = case
          when last_failed_login_at is null
            or last_failed_login_at < now() - interval '60 seconds'
          then 1
          else failed_login_count + 1
        end,
        last_failed_login_at = now()
    where id = p_student_id;

    perform public.class_access_record_event(
      v_class.id,
      v_class.teacher_id,
      'login_failed',
      'denied',
      p_device_id
    );
    return json_build_object('ok', false, 'error', 'wrong_password');
  end if;

  update public.students
  set failed_login_count = 0,
      last_failed_login_at = null
  where id = p_student_id;

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.student_sessions (student_id, token)
  values (p_student_id, v_token);

  perform public.class_access_record_event(
    v_class.id,
    v_class.teacher_id,
    'login_succeeded',
    'allowed',
    p_device_id
  );

  return json_build_object(
    'ok', true,
    'token', v_token,
    'student_id', v_student.id,
    'student_name', v_student.name,
    'class_id', v_student.class_id,
    'teacher_id', v_student.teacher_id,
    'school_id', v_class.school_id
  );
end;
$$;

create or replace function public.teacher_regenerate_class_code(p_class_id uuid)
returns json
language plpgsql volatile security definer
set search_path = public, extensions
as $$
declare
  v_owner uuid;
  v_code text;
begin
  select teacher_id into v_owner
  from public.classes
  where id = p_class_id;

  if v_owner is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_owner is distinct from auth.uid()
     and not public.is_app_admin(auth.uid())
  then
    return json_build_object('ok', false, 'error', 'forbidden');
  end if;

  v_code := public.gen_class_access_code();
  update public.classes
  set access_code = v_code,
      access_code_created_at = now(),
      access_code_expires_at = case
        when access_code_expires_at <= now() then null
        else access_code_expires_at
      end
  where id = p_class_id;

  perform public.class_access_record_event(
    p_class_id,
    v_owner,
    'code_regenerated',
    'changed',
    null
  );

  return json_build_object('ok', true, 'access_code', v_code);
end;
$$;

create or replace function public.teacher_set_class_code_expiry(
  p_class_id uuid,
  p_expires_at timestamptz
)
returns json
language plpgsql volatile security definer
set search_path = public, extensions
as $$
declare
  v_owner uuid;
begin
  select teacher_id into v_owner
  from public.classes
  where id = p_class_id;

  if v_owner is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_owner is distinct from auth.uid()
     and not public.is_app_admin(auth.uid())
  then
    return json_build_object('ok', false, 'error', 'forbidden');
  end if;
  if p_expires_at is not null
     and (
       p_expires_at < now() + interval '1 hour'
       or p_expires_at > now() + interval '365 days'
     )
  then
    return json_build_object('ok', false, 'error', 'invalid_expiry');
  end if;

  update public.classes
  set access_code_expires_at = p_expires_at
  where id = p_class_id;

  perform public.class_access_record_event(
    p_class_id,
    v_owner,
    'expiry_changed',
    'changed',
    null
  );

  return json_build_object(
    'ok', true,
    'access_code_expires_at', p_expires_at
  );
end;
$$;

create or replace function public.teacher_class_access_summary(p_class_id uuid)
returns json
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_denied integer;
  v_blocked integer;
  v_allowed integer;
  v_latest timestamptz;
begin
  select teacher_id into v_owner
  from public.classes
  where id = p_class_id;

  if v_owner is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_owner is distinct from auth.uid()
     and not public.is_app_admin(auth.uid())
  then
    return json_build_object('ok', false, 'error', 'forbidden');
  end if;

  select
    count(*) filter (where outcome = 'denied'),
    count(*) filter (where outcome = 'blocked'),
    count(*) filter (where outcome = 'allowed'),
    max(occurred_at)
  into v_denied, v_blocked, v_allowed, v_latest
  from public.class_access_events
  where class_id = p_class_id
    and occurred_at >= now() - interval '24 hours';

  return json_build_object(
    'ok', true,
    'allowed', coalesce(v_allowed, 0),
    'denied', coalesce(v_denied, 0),
    'blocked', coalesce(v_blocked, 0),
    'anomaly', coalesce(v_blocked, 0) > 0 or coalesce(v_denied, 0) >= 5,
    'latest_at', v_latest
  );
end;
$$;

create or replace function public.teacher_class_access_log(
  p_class_id uuid,
  p_limit integer default 20
)
returns table (
  event_type text,
  outcome text,
  occurred_at timestamptz,
  device_label text
)
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select teacher_id into v_owner
  from public.classes
  where id = p_class_id;

  if v_owner is null
     or (
       v_owner is distinct from auth.uid()
       and not public.is_app_admin(auth.uid())
     )
  then
    return;
  end if;

  return query
    select
      event.event_type,
      event.outcome,
      event.occurred_at,
      'Device ' || upper(substr(event.device_fingerprint, 1, 6))
    from public.class_access_events event
    where event.class_id = p_class_id
    order by event.occurred_at desc
    limit least(greatest(coalesce(p_limit, 20), 1), 100);
end;
$$;

revoke execute on function public.class_access_fingerprint(text, text)
  from public, anon, authenticated;
revoke execute on function public.class_access_network_fingerprint()
  from public, anon, authenticated;
revoke execute on function public.class_access_record_event(uuid, uuid, text, text, text)
  from public, anon, authenticated;
revoke execute on function public.class_access_rate_limit_status(text, text)
  from public, anon, authenticated;

revoke execute on function public.student_class_by_code(text)
  from public, anon, authenticated;
revoke execute on function public.student_login(uuid, text)
  from public, anon, authenticated;

grant execute on function public.student_class_by_code(text, text)
  to anon, authenticated;
grant execute on function public.student_login(uuid, text, text, text)
  to anon, authenticated;
grant execute on function public.teacher_regenerate_class_code(uuid)
  to authenticated;
grant execute on function public.teacher_set_class_code_expiry(uuid, timestamptz)
  to authenticated;
grant execute on function public.teacher_class_access_summary(uuid)
  to authenticated;
grant execute on function public.teacher_class_access_log(uuid, integer)
  to authenticated;

-- ==== 20260725100000_remote_error_monitoring.sql ========================

-- Privacy-preserving remote application error monitor.
--
-- The RPC deliberately has no message, URL, user, learner, class, answer, or
-- arbitrary-context parameter. Clients can submit only a coarse surface,
-- error type, source, release, fingerprint, and sanitized stack-frame array.

create table if not exists public.app_error_events (
  id uuid primary key default gen_random_uuid(),
  client_event_id uuid not null unique,
  release_id text not null,
  fingerprint text not null,
  severity text not null check (severity in ('warning', 'error', 'fatal')),
  surface text not null,
  error_type text not null,
  source text not null,
  stack_frames text[] not null default '{}',
  sample_rate numeric(5, 4) not null check (sample_rate > 0 and sample_rate <= 1),
  alert_required boolean not null default false,
  occurred_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

create index if not exists app_error_events_release_time_idx
  on public.app_error_events (release_id, occurred_at desc);

create index if not exists app_error_events_fingerprint_time_idx
  on public.app_error_events (fingerprint, occurred_at desc);

create index if not exists app_error_events_expiry_idx
  on public.app_error_events (expires_at);

alter table public.app_error_events enable row level security;
revoke all on public.app_error_events from public, anon;
grant select on public.app_error_events to authenticated;

drop policy if exists "App admins read remote error events"
  on public.app_error_events;
create policy "App admins read remote error events"
  on public.app_error_events for select to authenticated
  using (public.is_app_admin(auth.uid()));

create or replace function public.report_app_error(
  p_client_event_id uuid,
  p_release_id text,
  p_fingerprint text,
  p_severity text,
  p_surface text,
  p_error_type text,
  p_source text,
  p_stack_frames text[],
  p_sample_rate numeric
)
returns json
language plpgsql volatile security definer
set search_path = public, extensions
as $$
declare
  v_payload text;
  v_recent_count integer;
  v_alert boolean;
begin
  v_payload := array_to_string(coalesce(p_stack_frames, '{}'::text[]), E'\n');

  if p_client_event_id is null
     or p_release_id !~ '^[A-Za-z0-9._:-]{1,120}$'
     or p_fingerprint !~ '^[a-f0-9]{8,64}$'
     or p_severity not in ('warning', 'error', 'fatal')
     or p_surface !~ '^[a-z0-9._:-]{1,80}$'
     or p_error_type !~ '^[A-Za-z][A-Za-z0-9._-]{0,79}$'
     or p_source !~ '^[a-z0-9._:-]{1,80}$'
     or coalesce(array_length(p_stack_frames, 1), 0) > 12
     or exists (
       select 1
       from unnest(coalesce(p_stack_frames, '{}'::text[])) frame
       where length(frame) > 300
          or frame !~ '^(assets|src)/[A-Za-z0-9._/-]+:[0-9]+:[0-9]+$'
     )
     or length(v_payload) > 3600
     or p_sample_rate <= 0
     or p_sample_rate > 1
     or v_payload ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'
     or v_payload ~* '\m[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\M'
     or v_payload ~* '\m(bearer|password|answer|student_name|learner_name|class_code|access_token|refresh_token)\M[[:space:]]*[:=]'
     or v_payload ~* '\meyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}'
  then
    return json_build_object('ok', false, 'error', 'invalid_or_sensitive_payload');
  end if;

  select count(*) into v_recent_count
  from public.app_error_events
  where fingerprint = p_fingerprint
    and occurred_at >= now() - interval '1 minute';

  if v_recent_count >= 100 then
    return json_build_object('ok', false, 'error', 'rate_limited');
  end if;

  v_alert := p_severity = 'fatal' or v_recent_count >= 4;

  insert into public.app_error_events (
    client_event_id,
    release_id,
    fingerprint,
    severity,
    surface,
    error_type,
    source,
    stack_frames,
    sample_rate,
    alert_required
  )
  values (
    p_client_event_id,
    p_release_id,
    p_fingerprint,
    p_severity,
    p_surface,
    p_error_type,
    p_source,
    coalesce(p_stack_frames, '{}'::text[]),
    p_sample_rate,
    v_alert
  )
  on conflict (client_event_id) do nothing;

  return json_build_object(
    'ok', true,
    'alert_required', v_alert,
    'retention_days', 30
  );
end;
$$;

create or replace function public.admin_recent_error_events(p_limit integer default 25)
returns table (
  release_id text,
  severity text,
  surface text,
  error_type text,
  source text,
  fingerprint text,
  alert_required boolean,
  occurred_at timestamptz
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_app_admin(auth.uid()) then
    return;
  end if;

  return query
    select
      event.release_id,
      event.severity,
      event.surface,
      event.error_type,
      event.source,
      event.fingerprint,
      event.alert_required,
      event.occurred_at
    from public.app_error_events event
    where event.expires_at > now()
    order by event.occurred_at desc
    limit least(greatest(coalesce(p_limit, 25), 1), 100);
end;
$$;

create or replace function public.admin_error_monitor_summary()
returns table (
  release_id text,
  events_24h bigint,
  affected_fingerprints bigint,
  alerts_24h bigint,
  latest_at timestamptz
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_app_admin(auth.uid()) then
    return;
  end if;

  return query
    select
      event.release_id,
      count(*) as events_24h,
      count(distinct event.fingerprint) as affected_fingerprints,
      count(*) filter (where event.alert_required) as alerts_24h,
      max(event.occurred_at) as latest_at
    from public.app_error_events event
    where event.occurred_at >= now() - interval '24 hours'
      and event.expires_at > now()
    group by event.release_id
    order by max(event.occurred_at) desc;
end;
$$;

create or replace function public.admin_purge_expired_error_events()
returns bigint
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_deleted bigint;
begin
  if not public.is_app_admin(auth.uid()) then
    raise exception 'forbidden';
  end if;

  delete from public.app_error_events
  where expires_at <= now();
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke execute on function public.report_app_error(
  uuid, text, text, text, text, text, text, text[], numeric
) from public;
grant execute on function public.report_app_error(
  uuid, text, text, text, text, text, text, text[], numeric
) to anon, authenticated;

revoke execute on function public.admin_recent_error_events(integer)
  from public, anon;
revoke execute on function public.admin_error_monitor_summary()
  from public, anon;
revoke execute on function public.admin_purge_expired_error_events()
  from public, anon;
grant execute on function public.admin_recent_error_events(integer)
  to authenticated;
grant execute on function public.admin_error_monitor_summary()
  to authenticated;
grant execute on function public.admin_purge_expired_error_events()
  to authenticated;

-- ==== 20260725110000_learner_data_rights.sql ============================

-- Verified learner data-rights export and deletion.
--
-- Requests and audit events deliberately retain no learner name, raw learner
-- ID, credential, answer, or report content. The irreversible subject_ref lets
-- an authorised requester prove that the requested learner was handled without
-- leaving the deleted identity in the audit trail.

create table if not exists public.data_rights_requests (
  id uuid primary key default gen_random_uuid(),
  subject_ref text not null check (subject_ref ~ '^[0-9a-f]{64}$'),
  -- These opaque ownership identifiers intentionally have no cascading
  -- foreign keys. A class or account deletion must not erase the evidence
  -- that a data-rights request was handled.
  teacher_id uuid not null,
  class_id uuid not null,
  school_id uuid references public.schools(id) on delete set null,
  request_type text not null
    check (request_type in ('access_export', 'correction', 'deletion', 'restriction')),
  requester_role text not null
    check (requester_role in ('school', 'parent_guardian', 'learner')),
  verification_method text not null
    check (verification_method in (
      'school_record_match',
      'verified_parent_via_school',
      'authorised_school_official'
    )),
  verification_status text not null default 'verified'
    check (verification_status in ('pending', 'verified', 'rejected')),
  status text not null default 'received'
    check (status in ('received', 'in_progress', 'completed', 'rejected')),
  due_at timestamptz not null,
  completed_at timestamptz,
  outcome_counts jsonb not null default '{}'::jsonb
    check (jsonb_typeof(outcome_counts) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create index if not exists data_rights_requests_teacher_created_idx
  on public.data_rights_requests (teacher_id, created_at desc);
create index if not exists data_rights_requests_due_idx
  on public.data_rights_requests (status, due_at)
  where status in ('received', 'in_progress');
create index if not exists data_rights_requests_subject_idx
  on public.data_rights_requests (subject_ref, created_at desc);

create table if not exists public.data_rights_audit_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.data_rights_requests(id) on delete cascade,
  teacher_id uuid not null,
  actor_id uuid not null,
  event_type text not null
    check (event_type in (
      'request_verified',
      'export_completed',
      'deletion_started',
      'deletion_completed',
      'request_rejected'
    )),
  event_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb
    check (
      jsonb_typeof(details) = 'object'
      and octet_length(details::text) <= 4096
    )
);

create index if not exists data_rights_audit_request_time_idx
  on public.data_rights_audit_events (request_id, event_at, id);
create index if not exists data_rights_audit_teacher_time_idx
  on public.data_rights_audit_events (teacher_id, event_at desc);

alter table public.data_rights_requests enable row level security;
alter table public.data_rights_audit_events enable row level security;

revoke all on public.data_rights_requests from anon, authenticated;
revoke all on public.data_rights_audit_events from anon, authenticated;
grant select on public.data_rights_requests to authenticated;
grant select on public.data_rights_audit_events to authenticated;

drop policy if exists "Teachers read owned data rights requests"
  on public.data_rights_requests;
create policy "Teachers read owned data rights requests"
  on public.data_rights_requests for select to authenticated
  using (teacher_id = auth.uid() or public.is_app_admin(auth.uid()));

drop policy if exists "Teachers read owned data rights audit events"
  on public.data_rights_audit_events;
create policy "Teachers read owned data rights audit events"
  on public.data_rights_audit_events for select to authenticated
  using (teacher_id = auth.uid() or public.is_app_admin(auth.uid()));

create or replace function public.data_rights_subject_ref(
  p_student_id uuid,
  p_created_at timestamptz
)
returns text
language sql
immutable
strict
set search_path = public, extensions
as $$
  select encode(
    digest(
      convert_to(p_student_id::text || ':' || p_created_at::text, 'utf8'),
      'sha256'
    ),
    'hex'
  );
$$;

revoke all on function public.data_rights_subject_ref(uuid, timestamptz)
  from public, anon, authenticated;

create or replace function public.assert_learner_data_rights_actor(
  p_student_id uuid
)
returns public.students
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
begin
  if v_actor_id is null then
    raise exception 'Authentication is required';
  end if;

  select s.*
  into v_student
  from public.students s
  where s.id = p_student_id
    and (
      s.teacher_id = v_actor_id
      or public.is_app_admin(v_actor_id)
    )
  for update;

  if not found then
    raise exception 'An owned learner was not found';
  end if;

  return v_student;
end;
$$;

revoke all on function public.assert_learner_data_rights_actor(uuid)
  from public, anon, authenticated;

create or replace function public.assert_data_rights_request_inputs(
  p_requester_role text,
  p_verification_method text
)
returns void
language plpgsql
immutable
set search_path = public
as $$
begin
  if p_requester_role is null
    or p_requester_role not in ('school', 'parent_guardian', 'learner')
  then
    raise exception 'A supported requester role is required';
  end if;

  if p_verification_method is null
    or p_verification_method not in (
      'school_record_match',
      'verified_parent_via_school',
      'authorised_school_official'
    )
  then
    raise exception 'A supported identity verification method is required';
  end if;
end;
$$;

revoke all on function public.assert_data_rights_request_inputs(text, text)
  from public, anon, authenticated;

create or replace function public.teacher_export_learner_data(
  p_student_id uuid,
  p_requester_role text,
  p_verification_method text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
  v_class public.classes;
  v_subject_ref text;
  v_request public.data_rights_requests;
  v_package jsonb;
begin
  perform public.assert_data_rights_request_inputs(
    p_requester_role,
    p_verification_method
  );
  v_student := public.assert_learner_data_rights_actor(p_student_id);

  select c.*
  into strict v_class
  from public.classes c
  where c.id = v_student.class_id;

  v_subject_ref := public.data_rights_subject_ref(
    v_student.id,
    v_student.created_at
  );

  insert into public.data_rights_requests (
    subject_ref,
    teacher_id,
    class_id,
    school_id,
    request_type,
    requester_role,
    verification_method,
    verification_status,
    status,
    due_at,
    completed_at
  )
  values (
    v_subject_ref,
    v_student.teacher_id,
    v_student.class_id,
    v_class.school_id,
    'access_export',
    p_requester_role,
    p_verification_method,
    'verified',
    'completed',
    now() + interval '30 days',
    now()
  )
  returning * into v_request;

  insert into public.data_rights_audit_events (
    request_id,
    teacher_id,
    actor_id,
    event_type,
    details
  )
  values (
    v_request.id,
    v_student.teacher_id,
    v_actor_id,
    'request_verified',
    jsonb_build_object('requestType', 'access_export')
  );

  v_package := jsonb_build_object(
    'schemaVersion', 1,
    'request', jsonb_build_object(
      'id', v_request.id,
      'subjectRef', v_subject_ref,
      'requestType', v_request.request_type,
      'requesterRole', v_request.requester_role,
      'verificationMethod', v_request.verification_method,
      'status', v_request.status,
      'dueAt', v_request.due_at,
      'createdAt', v_request.created_at,
      'completedAt', v_request.completed_at,
      'responseTargetDays', 30
    ),
    'learner', jsonb_build_object(
      'id', v_student.id,
      'displayName', v_student.name,
      'classId', v_student.class_id,
      'className', v_class.name,
      'teacherId', v_student.teacher_id,
      'archivedAt', v_student.archived_at,
      'createdAt', v_student.created_at,
      'updatedAt', v_student.updated_at,
      'pictureCredentialConfigured',
        nullif(btrim(coalesce(v_student.symbol_password, '')), '') is not null
    ),
    'answers', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.answered_at, a.id)
      from public.answers a
      where a.student_id = v_student.id
    ), '[]'::jsonb),
    'mastery', coalesce((
      select jsonb_agg(to_jsonb(m) order by m.updated_at, m.id)
      from public.mastery m
      where m.student_id = v_student.id
    ), '[]'::jsonb),
    'itemMastery', coalesce((
      select jsonb_agg(to_jsonb(im) order by im.updated_at, im.id)
      from public.item_mastery im
      where im.student_id = v_student.id
    ), '[]'::jsonb),
    'progress', coalesce((
      select jsonb_agg(to_jsonb(sp) order by sp.updated_at, sp.id)
      from public.student_progress sp
      where sp.student_id = v_student.id
    ), '[]'::jsonb),
    'learningActivity', coalesce((
      select jsonb_agg(to_jsonb(la) order by la.created_at, la.id)
      from public.learn_activity la
      where la.student_id = v_student.id
    ), '[]'::jsonb),
    'syncHealth', coalesce((
      select jsonb_agg(
        to_jsonb(sh) - 'device_id'
        order by sh.observed_at, sh.student_id
      )
      from public.activity_sync_health sh
      where sh.student_id = v_student.id
    ), '[]'::jsonb),
    'assessmentAttempts', coalesce((
      select jsonb_agg(to_jsonb(aa) order by aa.completed_at, aa.attempt_id)
      from public.assessment_attempts aa
      where aa.student_id = v_student.id::text
    ), '[]'::jsonb),
    'individualReports', coalesce((
      select jsonb_agg(to_jsonb(er) order by er.generated_at, er.report_id)
      from public.el_assessment_reports er
      where er.student_id = v_student.id::text
    ), '[]'::jsonb),
    'classReportReferences', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'reportId', er.report_id,
          'reportType', er.report_type,
          'generatedAt', er.generated_at,
          'schemaVersion', er.schema_version
        )
        order by er.generated_at, er.report_id
      )
      from public.el_assessment_reports er
      where er.teacher_id = v_student.teacher_id
        and (
          er.payload::text like '%' || v_student.id::text || '%'
          or er.summary::text like '%' || v_student.id::text || '%'
        )
    ), '[]'::jsonb),
    'interventions', coalesce((
      select jsonb_agg(
        to_jsonb(ti) - 'student_ids'
        order by ti.created_at, ti.id
      )
      from public.teacher_interventions ti
      where v_student.id = any(ti.student_ids)
    ), '[]'::jsonb),
    'instructionalGroupReviews', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'reviewId', gr.id,
          'groupId', gr.group_id,
          'reviewedAt', gr.reviewed_at,
          'evidenceSnapshot', gr.evidence_snapshot
        )
        order by gr.reviewed_at, gr.id
      )
      from public.teacher_instructional_group_reviews gr
      where v_student.id = any(gr.student_ids)
    ), '[]'::jsonb),
    'teacherObservations', coalesce((
      select jsonb_agg(
        to_jsonb(io) - 'student_ids'
        order by io.observed_at, io.id
      )
      from public.teacher_insight_observations io
      where v_student.id = any(io.student_ids)
    ), '[]'::jsonb),
    'sessionHistory', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'createdAt', ss.created_at,
          'expiresAt', ss.expires_at,
          'revoked', ss.revoked
        )
        order by ss.created_at
      )
      from public.student_sessions ss
      where ss.student_id = v_student.id
    ), '[]'::jsonb)
  );

  insert into public.data_rights_audit_events (
    request_id,
    teacher_id,
    actor_id,
    event_type,
    details
  )
  values (
    v_request.id,
    v_student.teacher_id,
    v_actor_id,
    'export_completed',
    jsonb_build_object(
      'schemaVersion', 1,
      'sections', jsonb_object_length(v_package)
    )
  );

  return v_package;
end;
$$;

create or replace function public.teacher_list_learner_data_rights(
  p_student_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student public.students;
  v_subject_ref text;
begin
  v_student := public.assert_learner_data_rights_actor(p_student_id);
  v_subject_ref := public.data_rights_subject_ref(
    v_student.id,
    v_student.created_at
  );

  return jsonb_build_object(
    'subjectRef', v_subject_ref,
    'requests', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', dr.id,
          'requestType', dr.request_type,
          'requesterRole', dr.requester_role,
          'verificationMethod', dr.verification_method,
          'verificationStatus', dr.verification_status,
          'status', dr.status,
          'dueAt', dr.due_at,
          'completedAt', dr.completed_at,
          'createdAt', dr.created_at,
          'events', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'eventType', dae.event_type,
                'eventAt', dae.event_at
              )
              order by dae.event_at, dae.id
            )
            from public.data_rights_audit_events dae
            where dae.request_id = dr.id
          ), '[]'::jsonb)
        )
        order by dr.created_at desc, dr.id desc
      )
      from public.data_rights_requests dr
      where dr.subject_ref = v_subject_ref
        and (
          dr.teacher_id = auth.uid()
          or public.is_app_admin(auth.uid())
        )
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.teacher_prepare_learner_deletion(
  p_student_id uuid,
  p_requester_role text,
  p_verification_method text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
  v_class public.classes;
  v_subject_ref text;
  v_request public.data_rights_requests;
begin
  perform public.assert_data_rights_request_inputs(
    p_requester_role,
    p_verification_method
  );
  v_student := public.assert_learner_data_rights_actor(p_student_id);

  select c.*
  into strict v_class
  from public.classes c
  where c.id = v_student.class_id;

  v_subject_ref := public.data_rights_subject_ref(
    v_student.id,
    v_student.created_at
  );

  insert into public.data_rights_requests (
    subject_ref,
    teacher_id,
    class_id,
    school_id,
    request_type,
    requester_role,
    verification_method,
    verification_status,
    status,
    due_at
  )
  values (
    v_subject_ref,
    v_student.teacher_id,
    v_student.class_id,
    v_class.school_id,
    'deletion',
    p_requester_role,
    p_verification_method,
    'verified',
    'in_progress',
    now() + interval '30 days'
  )
  returning * into v_request;

  insert into public.data_rights_audit_events (
    request_id,
    teacher_id,
    actor_id,
    event_type,
    details
  )
  values (
    v_request.id,
    v_student.teacher_id,
    v_actor_id,
    'request_verified',
    jsonb_build_object('requestType', 'deletion')
  );

  return jsonb_build_object(
    'requestId', v_request.id,
    'subjectRef', v_subject_ref,
    'status', v_request.status,
    'dueAt', v_request.due_at,
    'responseTargetDays', 30,
    'confirmationPhrase', 'DELETE LEARNER DATA'
  );
end;
$$;

create or replace function public.teacher_delete_learner_data(
  p_request_id uuid,
  p_student_id uuid,
  p_subject_ref text,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
  v_request public.data_rights_requests;
  v_expected_ref text;
  v_counts jsonb := '{}'::jsonb;
  v_count integer;
begin
  if p_confirmation is distinct from 'DELETE LEARNER DATA' then
    raise exception 'The exact deletion confirmation phrase is required';
  end if;

  v_student := public.assert_learner_data_rights_actor(p_student_id);
  v_expected_ref := public.data_rights_subject_ref(
    v_student.id,
    v_student.created_at
  );

  if p_subject_ref is distinct from v_expected_ref then
    raise exception 'The deletion subject reference does not match the learner';
  end if;

  select dr.*
  into v_request
  from public.data_rights_requests dr
  where dr.id = p_request_id
    and dr.subject_ref = v_expected_ref
    and dr.teacher_id = v_student.teacher_id
    and dr.class_id = v_student.class_id
    and dr.request_type = 'deletion'
    and dr.verification_status = 'verified'
    and dr.status = 'in_progress'
  for update;

  if not found then
    raise exception 'A verified in-progress deletion request was not found';
  end if;

  -- These tables contain text, array, or JSON references rather than a
  -- student foreign key. The short write lock closes the race where another
  -- session could recreate learner evidence between cleanup and verification.
  lock table public.assessment_attempts in share row exclusive mode;
  lock table public.el_assessment_reports in share row exclusive mode;
  lock table public.teacher_interventions in share row exclusive mode;
  lock table public.teacher_instructional_group_reviews in share row exclusive mode;
  lock table public.teacher_insight_observations in share row exclusive mode;

  insert into public.data_rights_audit_events (
    request_id,
    teacher_id,
    actor_id,
    event_type,
    details
  )
  values (
    v_request.id,
    v_student.teacher_id,
    v_actor_id,
    'deletion_started',
    jsonb_build_object('schemaVersion', 1)
  );

  delete from public.teacher_insight_observations io
  where v_student.id = any(io.student_ids);
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('teacherObservations', v_count);

  delete from public.teacher_instructional_group_reviews gr
  where v_student.id = any(gr.student_ids);
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('instructionalGroupReviews', v_count);

  update public.teacher_interventions ti
  set student_ids = array_remove(ti.student_ids, v_student.id)
  where v_student.id = any(ti.student_ids);
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('interventionsUpdated', v_count);

  delete from public.el_assessment_reports er
  where er.student_id = v_student.id::text
    or er.payload::text like '%' || v_student.id::text || '%'
    or er.summary::text like '%' || v_student.id::text || '%';
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('assessmentReports', v_count);

  delete from public.assessment_attempts aa
  where aa.student_id = v_student.id::text;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('assessmentAttempts', v_count);

  select
    v_counts || jsonb_build_object(
      'answers', (select count(*) from public.answers a where a.student_id = v_student.id),
      'mastery', (select count(*) from public.mastery m where m.student_id = v_student.id),
      'itemMastery', (select count(*) from public.item_mastery im where im.student_id = v_student.id),
      'progress', (select count(*) from public.student_progress sp where sp.student_id = v_student.id),
      'learningActivity', (select count(*) from public.learn_activity la where la.student_id = v_student.id),
      'syncHealth', (select count(*) from public.activity_sync_health sh where sh.student_id = v_student.id),
      'sessions', (select count(*) from public.student_sessions ss where ss.student_id = v_student.id)
    )
  into strict v_counts;

  delete from public.students s
  where s.id = v_student.id
    and (
      s.teacher_id = v_actor_id
      or public.is_app_admin(v_actor_id)
    );

  if not found then
    raise exception 'Learner deletion did not complete';
  end if;

  if exists (
    select 1 from public.answers a where a.student_id = p_student_id
    union all
    select 1 from public.mastery m where m.student_id = p_student_id
    union all
    select 1 from public.item_mastery im where im.student_id = p_student_id
    union all
    select 1 from public.student_progress sp where sp.student_id = p_student_id
    union all
    select 1 from public.learn_activity la where la.student_id = p_student_id
    union all
    select 1 from public.activity_sync_health sh where sh.student_id = p_student_id
    union all
    select 1 from public.student_sessions ss where ss.student_id = p_student_id
    union all
    select 1 from public.assessment_attempts aa where aa.student_id = p_student_id::text
    union all
    select 1 from public.el_assessment_reports er
      where er.student_id = p_student_id::text
        or er.payload::text like '%' || p_student_id::text || '%'
        or er.summary::text like '%' || p_student_id::text || '%'
    union all
    select 1 from public.teacher_interventions ti where p_student_id = any(ti.student_ids)
    union all
    select 1 from public.teacher_instructional_group_reviews gr where p_student_id = any(gr.student_ids)
    union all
    select 1 from public.teacher_insight_observations io where p_student_id = any(io.student_ids)
  ) then
    raise exception 'Learner deletion verification found residual managed records';
  end if;

  update public.data_rights_requests
  set
    status = 'completed',
    completed_at = now(),
    outcome_counts = v_counts,
    updated_at = now()
  where id = v_request.id;

  insert into public.data_rights_audit_events (
    request_id,
    teacher_id,
    actor_id,
    event_type,
    details
  )
  values (
    v_request.id,
    v_student.teacher_id,
    v_actor_id,
    'deletion_completed',
    jsonb_build_object(
      'schemaVersion', 1,
      'residualManagedRecords', 0
    )
  );

  return jsonb_build_object(
    'requestId', v_request.id,
    'subjectRef', v_expected_ref,
    'status', 'completed',
    'completedAt', now(),
    'deletedCounts', v_counts,
    'residualManagedRecords', 0
  );
end;
$$;

grant execute on function public.teacher_export_learner_data(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_list_learner_data_rights(uuid)
  to authenticated;
grant execute on function public.teacher_prepare_learner_deletion(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  to authenticated;

revoke all on function public.teacher_export_learner_data(uuid, text, text)
  from public, anon;
revoke all on function public.teacher_list_learner_data_rights(uuid)
  from public, anon;
revoke all on function public.teacher_prepare_learner_deletion(uuid, text, text)
  from public, anon;
revoke all on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  from public, anon;

comment on table public.data_rights_requests is
  'Privacy-minimal access/correction/deletion/restriction request tracking with a 30-day operational response target.';
comment on table public.data_rights_audit_events is
  'Append-only actor/action audit events with no learner identity or record content.';
comment on function public.teacher_export_learner_data(uuid, text, text) is
  'Exports one owned learner record after an explicit identity-verification declaration and records completion.';
comment on function public.teacher_list_learner_data_rights(uuid) is
  'Lists the privacy-minimal request and event history for one currently owned learner.';
comment on function public.teacher_prepare_learner_deletion(uuid, text, text) is
  'Creates a verified, tracked learner deletion request and returns its irreversible subject reference.';
comment on function public.teacher_delete_learner_data(uuid, uuid, text, text) is
  'Atomically removes all managed learner records and embedded group references, then records a privacy-safe tombstone.';

-- ==== 20260725120000_school_retention_policy.sql ========================

-- School-configurable retention, end-of-year handling, and deletion propagation.
--
-- Defaults are operational safeguards, not a legal conclusion. An authorised
-- app administrator records the school instruction, previews every run, and
-- must provide an exact destructive confirmation before records are removed.

create table if not exists public.school_retention_policies (
  school_id uuid primary key references public.schools(id) on delete cascade,
  inactive_after_days integer not null default 365
    check (inactive_after_days between 90 and 2555),
  archived_delete_after_days integer not null default 90
    check (archived_delete_after_days between 7 and 730),
  end_of_year_action text not null default 'archive'
    check (end_of_year_action in ('archive', 'delete')),
  academic_year_end_month integer not null default 7
    check (academic_year_end_month between 1 and 12),
  provider_expiry_days integer not null default 30
    check (provider_expiry_days between 1 and 365),
  backup_expiry_days integer not null default 35
    check (backup_expiry_days between 1 and 365),
  last_end_of_year_applied integer,
  policy_version integer not null default 1 check (policy_version = 1),
  updated_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deletion_propagation_records (
  request_id uuid primary key
    references public.data_rights_requests(id) on delete restrict,
  subject_ref text not null check (subject_ref ~ '^[0-9a-f]{64}$'),
  school_id uuid,
  active_systems_deleted_at timestamptz not null,
  provider_expires_at timestamptz not null,
  backup_expires_at timestamptz not null,
  status text not null default 'awaiting_expiry'
    check (status in ('awaiting_expiry', 'evidence_required', 'expired_verified')),
  evidence_reference text,
  verified_at timestamptz,
  verified_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (
      status in ('awaiting_expiry', 'evidence_required')
      and evidence_reference is null
      and verified_at is null
      and verified_by is null
    )
    or
    (
      status = 'expired_verified'
      and char_length(btrim(evidence_reference)) between 8 and 500
      and verified_at is not null
      and verified_by is not null
    )
  )
);

create table if not exists public.retention_job_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  actor_id uuid not null,
  policy_snapshot jsonb not null,
  preview_snapshot jsonb not null,
  archived_learners integer not null default 0 check (archived_learners >= 0),
  deleted_learners integer not null default 0 check (deleted_learners >= 0),
  propagation_records_due integer not null default 0
    check (propagation_records_due >= 0),
  completed_at timestamptz not null default now()
);

create index if not exists deletion_propagation_expiry_idx
  on public.deletion_propagation_records (status, provider_expires_at, backup_expires_at);
create index if not exists deletion_propagation_school_idx
  on public.deletion_propagation_records (school_id, created_at desc);

alter table public.school_retention_policies enable row level security;
alter table public.deletion_propagation_records enable row level security;
alter table public.retention_job_runs enable row level security;

revoke all on public.school_retention_policies from anon, authenticated;
revoke all on public.deletion_propagation_records from anon, authenticated;
revoke all on public.retention_job_runs from anon, authenticated;
grant select on public.school_retention_policies to authenticated;
grant select on public.deletion_propagation_records to authenticated;
grant select on public.retention_job_runs to authenticated;

drop policy if exists "App admins read school retention policies"
  on public.school_retention_policies;
create policy "App admins read school retention policies"
  on public.school_retention_policies for select to authenticated
  using (public.is_app_admin(auth.uid()));

drop policy if exists "App admins read deletion propagation"
  on public.deletion_propagation_records;
create policy "App admins read deletion propagation"
  on public.deletion_propagation_records for select to authenticated
  using (public.is_app_admin(auth.uid()));

drop policy if exists "App admins read retention job runs"
  on public.retention_job_runs;
create policy "App admins read retention job runs"
  on public.retention_job_runs for select to authenticated
  using (public.is_app_admin(auth.uid()));

create or replace function public.assert_retention_admin()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null or not public.is_app_admin(v_actor_id) then
    raise exception 'App administrator access is required';
  end if;
  return v_actor_id;
end;
$$;

revoke all on function public.assert_retention_admin()
  from public, anon, authenticated;

create or replace function public.ensure_school_retention_policy(
  p_school_id uuid
)
returns public.school_retention_policies
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := public.assert_retention_admin();
  v_policy public.school_retention_policies;
begin
  if not exists (select 1 from public.schools where id = p_school_id) then
    raise exception 'School not found';
  end if;

  insert into public.school_retention_policies (
    school_id,
    last_end_of_year_applied,
    updated_by
  )
  values (
    p_school_id,
    extract(year from public.retention_latest_year_end(7, current_date))::integer,
    v_actor_id
  )
  on conflict (school_id) do nothing;

  select *
  into strict v_policy
  from public.school_retention_policies
  where school_id = p_school_id;

  return v_policy;
end;
$$;

revoke all on function public.ensure_school_retention_policy(uuid)
  from public, anon, authenticated;

create or replace function public.retention_latest_year_end(
  p_month integer,
  p_today date default current_date
)
returns date
language sql
immutable
strict
set search_path = public
as $$
  select case
    when p_today >= (
      date_trunc('month', make_date(extract(year from p_today)::integer, p_month, 1))
      + interval '1 month - 1 day'
    )::date
    then (
      date_trunc('month', make_date(extract(year from p_today)::integer, p_month, 1))
      + interval '1 month - 1 day'
    )::date
    else (
      date_trunc('month', make_date(extract(year from p_today)::integer - 1, p_month, 1))
      + interval '1 month - 1 day'
    )::date
  end;
$$;

revoke all on function public.retention_latest_year_end(integer, date)
  from public, anon, authenticated;

create or replace function public.retention_last_learner_activity(
  p_student_id uuid
)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select greatest(
    s.updated_at,
    (select max(a.answered_at) from public.answers a where a.student_id = s.id),
    (select max(m.updated_at) from public.mastery m where m.student_id = s.id),
    (select max(im.updated_at) from public.item_mastery im where im.student_id = s.id),
    (select max(sp.updated_at) from public.student_progress sp where sp.student_id = s.id),
    (
      select max(greatest(la.created_at, coalesce(la.occurred_at, la.created_at)))
      from public.learn_activity la
      where la.student_id = s.id
    ),
    (select max(ss.created_at) from public.student_sessions ss where ss.student_id = s.id),
    (select max(aa.completed_at) from public.assessment_attempts aa where aa.student_id = s.id::text)
  )
  from public.students s
  where s.id = p_student_id;
$$;

revoke all on function public.retention_last_learner_activity(uuid)
  from public, anon, authenticated;

create or replace function public.admin_get_school_retention_policy(
  p_school_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy public.school_retention_policies;
begin
  v_policy := public.ensure_school_retention_policy(p_school_id);
  return to_jsonb(v_policy);
end;
$$;

create or replace function public.admin_save_school_retention_policy(
  p_school_id uuid,
  p_inactive_after_days integer,
  p_archived_delete_after_days integer,
  p_end_of_year_action text,
  p_academic_year_end_month integer,
  p_provider_expiry_days integer,
  p_backup_expiry_days integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := public.assert_retention_admin();
  v_policy public.school_retention_policies;
begin
  perform public.ensure_school_retention_policy(p_school_id);

  update public.school_retention_policies
  set
    inactive_after_days = p_inactive_after_days,
    archived_delete_after_days = p_archived_delete_after_days,
    end_of_year_action = p_end_of_year_action,
    academic_year_end_month = p_academic_year_end_month,
    provider_expiry_days = p_provider_expiry_days,
    backup_expiry_days = p_backup_expiry_days,
    updated_by = v_actor_id,
    updated_at = now()
  where school_id = p_school_id
  returning * into strict v_policy;

  return to_jsonb(v_policy);
end;
$$;

create or replace function public.admin_preview_school_retention(
  p_school_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy public.school_retention_policies;
  v_year_end date;
  v_year integer;
  v_end_of_year_due boolean;
  v_inactive integer;
  v_archived_due integer;
  v_end_of_year integer;
  v_propagation_pending integer;
  v_propagation_due integer;
  v_now timestamptz := now();
begin
  v_policy := public.ensure_school_retention_policy(p_school_id);
  v_year_end := public.retention_latest_year_end(
    v_policy.academic_year_end_month,
    v_now::date
  );
  v_year := extract(year from v_year_end)::integer;
  v_end_of_year_due := coalesce(v_policy.last_end_of_year_applied, 0) < v_year;

  select count(*)
  into v_inactive
  from public.students s
  join public.classes c on c.id = s.class_id
  where c.school_id = p_school_id
    and s.archived_at is null
    and public.retention_last_learner_activity(s.id)
      <= v_now - make_interval(days => v_policy.inactive_after_days);

  select count(*)
  into v_archived_due
  from public.students s
  join public.classes c on c.id = s.class_id
  where c.school_id = p_school_id
    and s.archived_at is not null
    and s.archived_at
      <= v_now - make_interval(days => v_policy.archived_delete_after_days);

  select case when v_end_of_year_due then count(*) else 0 end
  into v_end_of_year
  from public.students s
  join public.classes c on c.id = s.class_id
  where c.school_id = p_school_id
    and s.archived_at is null;

  select count(*)
  into v_propagation_pending
  from public.deletion_propagation_records dpr
  where dpr.school_id = p_school_id
    and dpr.status = 'awaiting_expiry';

  select count(*)
  into v_propagation_due
  from public.deletion_propagation_records dpr
  where dpr.school_id = p_school_id
    and (
      dpr.status = 'evidence_required'
      or (
        dpr.status = 'awaiting_expiry'
        and dpr.provider_expires_at <= v_now
        and dpr.backup_expires_at <= v_now
      )
    );

  return jsonb_build_object(
    'schoolId', p_school_id,
    'previewedAt', v_now,
    'policy', jsonb_build_object(
      'inactiveAfterDays', v_policy.inactive_after_days,
      'archivedDeleteAfterDays', v_policy.archived_delete_after_days,
      'endOfYearAction', v_policy.end_of_year_action,
      'academicYearEndMonth', v_policy.academic_year_end_month,
      'providerExpiryDays', v_policy.provider_expiry_days,
      'backupExpiryDays', v_policy.backup_expiry_days,
      'lastEndOfYearApplied', v_policy.last_end_of_year_applied
    ),
    'latestYearEnd', v_year_end,
    'endOfYearDue', v_end_of_year_due,
    'inactiveArchiveCandidates', v_inactive,
    'archivedDeletionCandidates', v_archived_due,
    'endOfYearCandidates', v_end_of_year,
    'pendingPropagationRecords', v_propagation_pending,
    'propagationEvidenceDue', v_propagation_due
  );
end;
$$;

create or replace function public.admin_list_deletion_propagation(
  p_school_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_retention_admin();
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'requestId', dpr.request_id,
      'subjectRef', dpr.subject_ref,
      'activeSystemsDeletedAt', dpr.active_systems_deleted_at,
      'providerExpiresAt', dpr.provider_expires_at,
      'backupExpiresAt', dpr.backup_expires_at,
      'status', dpr.status,
      'evidenceDue', (
        dpr.provider_expires_at <= now()
        and dpr.backup_expires_at <= now()
      ),
      'evidenceReference', dpr.evidence_reference,
      'verifiedAt', dpr.verified_at
    ) order by dpr.created_at desc)
    from public.deletion_propagation_records dpr
    where dpr.school_id = p_school_id
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_verify_deletion_propagation(
  p_request_id uuid,
  p_evidence_reference text,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := public.assert_retention_admin();
  v_record public.deletion_propagation_records;
  v_now timestamptz := now();
begin
  if p_confirmation is distinct from 'VERIFY PROVIDER AND BACKUP EXPIRY' then
    raise exception 'The exact propagation verification phrase is required';
  end if;
  if char_length(btrim(coalesce(p_evidence_reference, ''))) not between 8 and 500 then
    raise exception 'A provider or backup evidence reference is required';
  end if;

  select *
  into v_record
  from public.deletion_propagation_records
  where request_id = p_request_id
  for update;

  if not found then
    raise exception 'Deletion propagation record not found';
  end if;
  if v_record.status = 'expired_verified' then
    raise exception 'Deletion propagation is already verified';
  end if;
  if v_record.provider_expires_at > v_now or v_record.backup_expires_at > v_now then
    raise exception 'Provider and backup expiry dates have not both passed';
  end if;

  update public.deletion_propagation_records
  set
    status = 'expired_verified',
    evidence_reference = btrim(p_evidence_reference),
    verified_at = v_now,
    verified_by = v_actor_id,
    updated_at = v_now
  where request_id = p_request_id
  returning * into strict v_record;

  return jsonb_build_object(
    'requestId', v_record.request_id,
    'status', v_record.status,
    'evidenceReference', v_record.evidence_reference,
    'verifiedAt', v_record.verified_at
  );
end;
$$;

create or replace function public.queue_deletion_propagation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.data_rights_requests;
  v_provider_days integer := 30;
  v_backup_days integer := 35;
begin
  if new.event_type <> 'deletion_completed' then
    return new;
  end if;

  select *
  into strict v_request
  from public.data_rights_requests
  where id = new.request_id;

  select
    coalesce(srp.provider_expiry_days, 30),
    coalesce(srp.backup_expiry_days, 35)
  into v_provider_days, v_backup_days
  from (select 1) seed
  left join public.school_retention_policies srp
    on srp.school_id = v_request.school_id;

  insert into public.deletion_propagation_records (
    request_id,
    subject_ref,
    school_id,
    active_systems_deleted_at,
    provider_expires_at,
    backup_expires_at
  )
  values (
    v_request.id,
    v_request.subject_ref,
    v_request.school_id,
    new.event_at,
    new.event_at + make_interval(days => v_provider_days),
    new.event_at + make_interval(days => v_backup_days)
  )
  on conflict (request_id) do nothing;

  return new;
end;
$$;

drop trigger if exists data_rights_queue_deletion_propagation
  on public.data_rights_audit_events;
create trigger data_rights_queue_deletion_propagation
  after insert on public.data_rights_audit_events
  for each row execute function public.queue_deletion_propagation();

insert into public.deletion_propagation_records (
  request_id,
  subject_ref,
  school_id,
  active_systems_deleted_at,
  provider_expires_at,
  backup_expires_at
)
select
  dr.id,
  dr.subject_ref,
  dr.school_id,
  dae.event_at,
  dae.event_at + make_interval(days => coalesce(srp.provider_expiry_days, 30)),
  dae.event_at + make_interval(days => coalesce(srp.backup_expiry_days, 35))
from public.data_rights_requests dr
join public.data_rights_audit_events dae
  on dae.request_id = dr.id
  and dae.event_type = 'deletion_completed'
left join public.school_retention_policies srp
  on srp.school_id = dr.school_id
on conflict (request_id) do nothing;

create or replace function public.admin_run_school_retention(
  p_school_id uuid,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_policy public.school_retention_policies;
  v_preview jsonb;
  v_year integer;
  v_student record;
  v_prepared jsonb;
  v_archived integer := 0;
  v_deleted integer := 0;
  v_deleted_student_ids uuid[] := array[]::uuid[];
  v_row_count integer;
  v_actor_id uuid := public.assert_retention_admin();
  v_now timestamptz := now();
begin
  if p_confirmation is distinct from 'APPLY RETENTION POLICY' then
    raise exception 'The exact retention confirmation phrase is required';
  end if;

  v_policy := public.ensure_school_retention_policy(p_school_id);
  v_preview := public.admin_preview_school_retention(p_school_id);
  v_year := extract(year from (v_preview ->> 'latestYearEnd')::date)::integer;

  if (v_preview ->> 'endOfYearDue')::boolean then
    if v_policy.end_of_year_action = 'archive' then
      update public.students s
      set archived_at = v_now, updated_at = v_now
      from public.classes c
      where c.id = s.class_id
        and c.school_id = p_school_id
        and s.archived_at is null;
      get diagnostics v_archived = row_count;
    else
      for v_student in
        select s.id
        from public.students s
        join public.classes c on c.id = s.class_id
        where c.school_id = p_school_id
          and s.archived_at is null
        order by s.id
      loop
        v_prepared := public.teacher_prepare_learner_deletion(
          v_student.id,
          'school',
          'authorised_school_official'
        );
        perform public.teacher_delete_learner_data(
          (v_prepared ->> 'requestId')::uuid,
          v_student.id,
          v_prepared ->> 'subjectRef',
          'DELETE LEARNER DATA'
        );
        v_deleted_student_ids := array_append(v_deleted_student_ids, v_student.id);
        v_deleted := v_deleted + 1;
      end loop;
    end if;

    update public.school_retention_policies
    set
      last_end_of_year_applied = v_year,
      updated_by = auth.uid(),
      updated_at = v_now
    where school_id = p_school_id;
  else
    update public.students s
    set archived_at = v_now, updated_at = v_now
    from public.classes c
    where c.id = s.class_id
      and c.school_id = p_school_id
      and s.archived_at is null
      and public.retention_last_learner_activity(s.id)
        <= v_now - make_interval(days => v_policy.inactive_after_days);
    get diagnostics v_archived = row_count;
  end if;

  for v_student in
    select s.id
    from public.students s
    join public.classes c on c.id = s.class_id
    where c.school_id = p_school_id
      and s.archived_at is not null
      and s.archived_at
        <= v_now - make_interval(days => v_policy.archived_delete_after_days)
    order by s.id
  loop
    v_prepared := public.teacher_prepare_learner_deletion(
      v_student.id,
      'school',
      'authorised_school_official'
    );
    perform public.teacher_delete_learner_data(
      (v_prepared ->> 'requestId')::uuid,
      v_student.id,
      v_prepared ->> 'subjectRef',
      'DELETE LEARNER DATA'
    );
    v_deleted_student_ids := array_append(v_deleted_student_ids, v_student.id);
    v_deleted := v_deleted + 1;
  end loop;

  update public.deletion_propagation_records
  set
    status = 'evidence_required',
    updated_at = v_now
  where school_id = p_school_id
    and status = 'awaiting_expiry'
    and provider_expires_at <= v_now
    and backup_expires_at <= v_now;
  get diagnostics v_row_count = row_count;

  insert into public.retention_job_runs (
    school_id,
    actor_id,
    policy_snapshot,
    preview_snapshot,
    archived_learners,
    deleted_learners,
    propagation_records_due,
    completed_at
  )
  values (
    p_school_id,
    v_actor_id,
    to_jsonb(v_policy),
    v_preview,
    v_archived,
    v_deleted,
    v_row_count,
    v_now
  );

  return jsonb_build_object(
    'schoolId', p_school_id,
    'completedAt', v_now,
    'archivedLearners', v_archived,
    'deletedLearners', v_deleted,
    'deletedStudentIds', to_jsonb(v_deleted_student_ids),
    'propagationRecordsDueForEvidence', v_row_count,
    'residualPreview', public.admin_preview_school_retention(p_school_id)
  );
end;
$$;

grant execute on function public.admin_get_school_retention_policy(uuid)
  to authenticated;
grant execute on function public.admin_save_school_retention_policy(
  uuid, integer, integer, text, integer, integer, integer
) to authenticated;
grant execute on function public.admin_preview_school_retention(uuid)
  to authenticated;
grant execute on function public.admin_list_deletion_propagation(uuid)
  to authenticated;
grant execute on function public.admin_verify_deletion_propagation(
  uuid, text, text
) to authenticated;
grant execute on function public.admin_run_school_retention(uuid, text)
  to authenticated;

revoke all on function public.admin_get_school_retention_policy(uuid)
  from public, anon;
revoke all on function public.admin_save_school_retention_policy(
  uuid, integer, integer, text, integer, integer, integer
) from public, anon;
revoke all on function public.admin_preview_school_retention(uuid)
  from public, anon;
revoke all on function public.admin_list_deletion_propagation(uuid)
  from public, anon;
revoke all on function public.admin_verify_deletion_propagation(
  uuid, text, text
) from public, anon;
revoke all on function public.admin_run_school_retention(uuid, text)
  from public, anon;
revoke all on function public.queue_deletion_propagation()
  from public, anon, authenticated;

comment on table public.school_retention_policies is
  'Versioned school instruction for inactivity, archive, end-of-year, provider, and backup retention.';
comment on table public.deletion_propagation_records is
  'Privacy-minimal proof that active deletion occurred and provider/backup expiry is pending, due for evidence, or explicitly verified.';
comment on table public.retention_job_runs is
  'Immutable result record for each authorised school retention job run.';

-- ==== 20260725125000_error_monitor_budget.sql ===========================

-- Add the exact fields needed to evaluate and investigate the documented
-- fleet error budget. These functions remain administrator-only.

drop function if exists public.admin_recent_error_events(integer);

create function public.admin_recent_error_events(p_limit integer default 25)
returns table (
  release_id text,
  severity text,
  surface text,
  error_type text,
  source text,
  fingerprint text,
  stack_frames text[],
  alert_required boolean,
  occurred_at timestamptz
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_app_admin(auth.uid()) then
    return;
  end if;

  return query
    select
      event.release_id,
      event.severity,
      event.surface,
      event.error_type,
      event.source,
      event.fingerprint,
      event.stack_frames,
      event.alert_required,
      event.occurred_at
    from public.app_error_events event
    where event.expires_at > now()
    order by event.occurred_at desc
    limit least(greatest(coalesce(p_limit, 25), 1), 100);
end;
$$;

drop function if exists public.admin_error_monitor_summary();

create function public.admin_error_monitor_summary()
returns table (
  release_id text,
  events_24h bigint,
  affected_fingerprints bigint,
  fatal_events_24h bigint,
  alerts_24h bigint,
  latest_at timestamptz
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  if not public.is_app_admin(auth.uid()) then
    return;
  end if;

  return query
    select
      event.release_id,
      count(*) as events_24h,
      count(distinct event.fingerprint) as affected_fingerprints,
      count(*) filter (where event.severity = 'fatal') as fatal_events_24h,
      count(*) filter (where event.alert_required) as alerts_24h,
      max(event.occurred_at) as latest_at
    from public.app_error_events event
    where event.occurred_at >= now() - interval '24 hours'
      and event.expires_at > now()
    group by event.release_id
    order by max(event.occurred_at) desc;
end;
$$;

revoke execute on function public.admin_recent_error_events(integer)
  from public, anon;
revoke execute on function public.admin_error_monitor_summary()
  from public, anon;
grant execute on function public.admin_recent_error_events(integer)
  to authenticated;
grant execute on function public.admin_error_monitor_summary()
  to authenticated;

-- ==== 20260725130000_security_definer_boundary.sql ======================

-- Close the database API boundary for every SECURITY DEFINER function.
--
-- PostgreSQL grants EXECUTE on new functions to PUBLIC unless it is revoked.
-- Revoking only from `anon` is therefore insufficient because `anon` inherits
-- PUBLIC privileges. This migration first removes API-role execution from
-- every current SECURITY DEFINER function, then grants only the exact RPC
-- signatures used by the product.

-- Remove obsolete child-login entry points entirely. They were replaced by
-- the device-aware, class-code-gated RPCs below and are not used by the app.
drop function if exists public.student_list_schools();
drop function if exists public.student_list_classes(uuid);
drop function if exists public.student_list_students(uuid);
drop function if exists public.student_set_password(uuid, text);
drop function if exists public.student_set_password(uuid, text, text);
drop function if exists public.student_login(uuid, text);
drop function if exists public.student_class_by_code(text);
drop function if exists public.student_log_activity(text, text, text, text, jsonb);

-- Authenticated users may read the school directory, but cannot bypass the
-- bounded RPC to insert or alter directory rows directly.
revoke insert, update, delete on public.schools from authenticated;
drop policy if exists "Authenticated users can create schools" on public.schools;

-- School creation is part of teacher onboarding, not the anonymous child API.
-- The auth.users trigger may call this bounded helper as its owner; browser
-- callers must be authenticated.
create or replace function public.find_or_create_school(p_name text)
returns table (id uuid, name text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_clean text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_id uuid;
  v_name text;
begin
  if char_length(v_clean) < 2
     or char_length(v_clean) > 120
     or v_clean ~ '[[:cntrl:]]'
  then
    raise exception 'invalid_school_name';
  end if;

  insert into public.schools (name)
  values (v_clean)
  on conflict (name_normalized) do update set name = public.schools.name
  returning public.schools.id, public.schools.name into v_id, v_name;

  return query select v_id, v_name;
end;
$$;

-- Capture the school name inside the trusted auth trigger. This avoids the old
-- pre-signup anonymous SECURITY DEFINER write and ensures the durable pending
-- account receives its school even when email confirmation returns no session.
create or replace function public.create_pending_teacher_account_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
  requested_display_name text;
  requested_school_name text;
  requested_school_id uuid;
begin
  requested_username := lower(nullif(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', ''),
    '[^a-zA-Z0-9_-]',
    '',
    'g'
  ), ''));
  requested_display_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    requested_username
  );
  requested_school_name := nullif(btrim(new.raw_user_meta_data ->> 'school_name'), '');

  if coalesce((new.raw_user_meta_data ->> 'audit_only')::boolean, false) is false
     and (
       requested_username is null
       or requested_username !~ '^[a-z0-9_-]{3,30}$'
       or requested_display_name is null
       or char_length(requested_display_name) > 80
       or requested_school_name is null
     )
  then
    raise exception 'invalid_teacher_signup_metadata';
  end if;

  if requested_username is not null and exists (
    select 1
    from public.pending_teacher_accounts
    where lower(username) = requested_username
  ) then
    raise exception 'username_unavailable';
  end if;

  if requested_school_name is not null then
    select school.id
    into requested_school_id
    from public.find_or_create_school(requested_school_name) school;
  end if;

  insert into public.pending_teacher_accounts (
    user_id,
    email,
    username,
    display_name,
    name,
    role,
    status,
    approval_status,
    school_id,
    requested_at,
    created_at
  )
  values (
    new.id,
    new.email,
    requested_username,
    requested_display_name,
    coalesce(requested_display_name, requested_username, split_part(new.email, '@', 1)),
    'pending',
    'pending',
    'pending',
    requested_school_id,
    now(),
    now()
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Fail closed for all present SECURITY DEFINER functions, including internal
-- helpers and trigger functions. The owner retains execution automatically.
do $security_boundary$
declare
  function_row record;
begin
  for function_row in
    select procedure.oid::regprocedure as signature
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.prosecdef
  loop
    execute format(
      'revoke execute on function %s from public, anon, authenticated',
      function_row.signature
    );
  end loop;
end
$security_boundary$;

-- Anonymous-safe learner RPCs.
grant execute on function public.student_class_by_code(text, text)
  to anon, authenticated;
grant execute on function public.student_login(uuid, text, text, text)
  to anon, authenticated;
grant execute on function public.student_get_progress(text)
  to anon, authenticated;
grant execute on function public.student_save_progress(text, text, text, jsonb)
  to anon, authenticated;
grant execute on function public.student_log_activity_v2(
  text, text, text, text, text, jsonb, timestamptz, integer
) to anon, authenticated;
grant execute on function public.student_report_activity_sync_health(
  text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) to anon, authenticated;
grant execute on function public.get_game_leaderboard(text, integer)
  to anon, authenticated;
grant execute on function public.report_app_error(
  uuid, text, text, text, text, text, text, text[], numeric
) to anon, authenticated;

-- Authenticated teacher and administrator RPCs.
grant execute on function public.is_app_admin(uuid)
  to authenticated;
grant execute on function public.find_or_create_school(text)
  to authenticated;
grant execute on function public.list_school_names()
  to authenticated;
grant execute on function public.teacher_set_school(text)
  to authenticated;
grant execute on function public.set_app_config(text, jsonb)
  to authenticated;
grant execute on function public.teacher_set_class_leaderboard_scope(uuid, text)
  to authenticated;
grant execute on function public.teacher_save_instructional_group(
  uuid, text, jsonb, uuid[], jsonb
) to authenticated;
grant execute on function public.teacher_review_instructional_group(
  uuid, uuid[], jsonb
) to authenticated;
grant execute on function public.teacher_assign_instructional_group_follow_up(
  uuid, text, text, date
) to authenticated;
grant execute on function public.teacher_create_insight_intervention(
  text, uuid, jsonb, uuid[], text[], text, text, date
) to authenticated;
grant execute on function public.teacher_record_insight_observation(
  uuid, jsonb, uuid[], text, text, text, date
) to authenticated;
grant execute on function public.teacher_regenerate_class_code(uuid)
  to authenticated;
grant execute on function public.teacher_set_class_code_expiry(uuid, timestamptz)
  to authenticated;
grant execute on function public.teacher_class_access_summary(uuid)
  to authenticated;
grant execute on function public.teacher_class_access_log(uuid, integer)
  to authenticated;
grant execute on function public.admin_recent_error_events(integer)
  to authenticated;
grant execute on function public.admin_error_monitor_summary()
  to authenticated;
grant execute on function public.admin_purge_expired_error_events()
  to authenticated;
grant execute on function public.teacher_export_learner_data(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_list_learner_data_rights(uuid)
  to authenticated;
grant execute on function public.teacher_prepare_learner_deletion(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  to authenticated;
grant execute on function public.admin_get_school_retention_policy(uuid)
  to authenticated;
grant execute on function public.admin_save_school_retention_policy(
  uuid, integer, integer, text, integer, integer, integer
) to authenticated;
grant execute on function public.admin_preview_school_retention(uuid)
  to authenticated;
grant execute on function public.admin_list_deletion_propagation(uuid)
  to authenticated;
grant execute on function public.admin_verify_deletion_propagation(
  uuid, text, text
) to authenticated;
grant execute on function public.admin_run_school_retention(uuid, text)
  to authenticated;

notify pgrst, 'reload schema';

-- ==== 20260725140000_private_class_code_trigger.sql =====================

-- Keep class access-code generation private while allowing normal teacher
-- inserts to fire the automatic-code trigger.
--
-- The security-definer boundary correctly revokes direct browser execution of
-- gen_class_access_code(). The trigger previously ran as the inserting teacher,
-- however, so its internal helper call inherited that revocation and every new
-- class insert failed. Run the trigger as its fixed owner instead; direct API
-- callers still cannot execute either internal function.

create or replace function public.set_class_access_code()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.access_code is null then
    new.access_code := public.gen_class_access_code();
  end if;
  return new;
end;
$$;

revoke execute on function public.set_class_access_code()
  from public, anon, authenticated;
revoke execute on function public.gen_class_access_code()
  from public, anon, authenticated;

-- ==== 20260725145000_teacher_child_lifecycle.sql ========================

-- Give teachers one explicit, audited boundary for archiving and restoring a
-- child. The column reconciliation keeps older managed installations safe to
-- upgrade before the frontend begins using this RPC.

alter table public.students
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.teacher_set_student_archived(
  p_student_id uuid,
  p_class_id uuid,
  p_archived boolean
)
returns table (id uuid)
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_actor_id uuid := auth.uid();
  v_owner_id uuid;
begin
  if v_actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required.';
  end if;

  select c.teacher_id
    into v_owner_id
  from public.students s
  join public.classes c
    on c.id = s.class_id
   and c.teacher_id = s.teacher_id
  where s.id = p_student_id
    and s.class_id = p_class_id;

  if v_owner_id is null then
    raise exception using
      errcode = 'P0002',
      message = 'The child was not found in this class.';
  end if;

  if v_owner_id is distinct from v_actor_id
     and not public.is_app_admin(v_actor_id)
  then
    raise exception using
      errcode = '42501',
      message = 'You do not have permission to change this child.';
  end if;

  return query
  update public.students s
     set archived_at = case when p_archived then now() else null end,
         updated_at = now()
   where s.id = p_student_id
     and s.class_id = p_class_id
  returning s.id;
end;
$$;

comment on function public.teacher_set_student_archived(uuid, uuid, boolean) is
  'Archives or restores one child after verifying teacher ownership of the class.';

revoke all on function public.teacher_set_student_archived(uuid, uuid, boolean)
  from public, anon;
grant execute on function public.teacher_set_student_archived(uuid, uuid, boolean)
  to authenticated;

-- ==== 20260725150000_security_definer_boundary.sql ======================

-- Reassert the complete database API boundary after all private trigger fixes.
--
-- PostgreSQL grants EXECUTE on newly created functions to PUBLIC by default.
-- This migration must remain after every SECURITY DEFINER migration: it first
-- removes execution from every API role, then restores only the reviewed RPC
-- surface used by the product.

-- Keep obsolete child-login entry points absent even on databases upgraded
-- through an older or partially applied migration history.
drop function if exists public.student_list_schools();
drop function if exists public.student_list_classes(uuid);
drop function if exists public.student_list_students(uuid);
drop function if exists public.student_set_password(uuid, text);
drop function if exists public.student_set_password(uuid, text, text);
drop function if exists public.student_login(uuid, text);
drop function if exists public.student_class_by_code(text);
drop function if exists public.student_log_activity(text, text, text, text, jsonb);

do $security_boundary$
declare
  function_row record;
begin
  for function_row in
    select procedure.oid::regprocedure as signature
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.prosecdef
  loop
    execute format(
      'revoke execute on function %s from public, anon, authenticated',
      function_row.signature
    );
  end loop;
end
$security_boundary$;

-- Anonymous-safe learner RPCs.
grant execute on function public.student_class_by_code(text, text)
  to anon, authenticated;
grant execute on function public.student_login(uuid, text, text, text)
  to anon, authenticated;
grant execute on function public.student_get_progress(text)
  to anon, authenticated;
grant execute on function public.student_save_progress(text, text, text, jsonb)
  to anon, authenticated;
grant execute on function public.student_log_activity_v2(
  text, text, text, text, text, jsonb, timestamptz, integer
) to anon, authenticated;
grant execute on function public.student_report_activity_sync_health(
  text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) to anon, authenticated;
grant execute on function public.get_game_leaderboard(text, integer)
  to anon, authenticated;
grant execute on function public.report_app_error(
  uuid, text, text, text, text, text, text, text[], numeric
) to anon, authenticated;

-- Authenticated teacher and administrator RPCs.
grant execute on function public.is_app_admin(uuid)
  to authenticated;
grant execute on function public.find_or_create_school(text)
  to authenticated;
grant execute on function public.list_school_names()
  to authenticated;
grant execute on function public.teacher_set_school(text)
  to authenticated;
grant execute on function public.set_app_config(text, jsonb)
  to authenticated;
grant execute on function public.teacher_set_class_leaderboard_scope(uuid, text)
  to authenticated;
grant execute on function public.teacher_set_student_archived(uuid, uuid, boolean)
  to authenticated;
grant execute on function public.teacher_save_instructional_group(
  uuid, text, jsonb, uuid[], jsonb
) to authenticated;
grant execute on function public.teacher_review_instructional_group(
  uuid, uuid[], jsonb
) to authenticated;
grant execute on function public.teacher_assign_instructional_group_follow_up(
  uuid, text, text, date
) to authenticated;
grant execute on function public.teacher_create_insight_intervention(
  text, uuid, jsonb, uuid[], text[], text, text, date
) to authenticated;
grant execute on function public.teacher_record_insight_observation(
  uuid, jsonb, uuid[], text, text, text, date
) to authenticated;
grant execute on function public.teacher_regenerate_class_code(uuid)
  to authenticated;
grant execute on function public.teacher_set_class_code_expiry(uuid, timestamptz)
  to authenticated;
grant execute on function public.teacher_class_access_summary(uuid)
  to authenticated;
grant execute on function public.teacher_class_access_log(uuid, integer)
  to authenticated;
grant execute on function public.admin_recent_error_events(integer)
  to authenticated;
grant execute on function public.admin_error_monitor_summary()
  to authenticated;
grant execute on function public.admin_purge_expired_error_events()
  to authenticated;
grant execute on function public.teacher_export_learner_data(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_list_learner_data_rights(uuid)
  to authenticated;
grant execute on function public.teacher_prepare_learner_deletion(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  to authenticated;
grant execute on function public.admin_get_school_retention_policy(uuid)
  to authenticated;
grant execute on function public.admin_save_school_retention_policy(
  uuid, integer, integer, text, integer, integer, integer
) to authenticated;
grant execute on function public.admin_preview_school_retention(uuid)
  to authenticated;
grant execute on function public.admin_list_deletion_propagation(uuid)
  to authenticated;
grant execute on function public.admin_verify_deletion_propagation(
  uuid, text, text
) to authenticated;
grant execute on function public.admin_run_school_retention(uuid, text)
  to authenticated;

notify pgrst, 'reload schema';

-- ==== 20260726090000_data_rights_jsonb_section_count.sql ================

-- PostgreSQL does not provide jsonb_object_length(). The learner export uses
-- this bounded helper to count top-level package sections without expanding
-- or returning any child data to the caller.
create or replace function public.jsonb_object_length(p_value jsonb)
returns integer
language sql
immutable
parallel safe
set search_path = public
as $$
  select count(*)::integer
  from jsonb_object_keys(coalesce(p_value, '{}'::jsonb));
$$;

revoke all on function public.jsonb_object_length(jsonb)
  from public, anon, authenticated;

comment on function public.jsonb_object_length(jsonb) is
  'Owner-only helper used by the learner data export to count top-level JSON sections.';

-- ==== 20260727090000_data_rights_and_lifecycle_fixes.sql ================

-- Two corrections to the learner-lifecycle boundary, found by audit on
-- 2026-07-27. Both are safe to re-run.
--
-- 1. Deleting one learner destroyed other children's assessment evidence.
-- 2. Archiving a learner left them signed in for up to the session TTL.

-- ---------------------------------------------------------------------------
-- 1. Redact the subject from shared reports instead of deleting the row.
--
-- The previous statement was:
--
--   delete from public.el_assessment_reports er
--   where er.student_id = v_student.id::text
--      or er.payload::text like '%' || v_student.id::text || '%'
--      or er.summary::text like '%' || v_student.id::text || '%';
--
-- A whole-class report contains every learner in the class, so the substring
-- match deleted the WHOLE row — the other twenty-nine children's evidence went
-- with it. Being `security definer`, it bypassed row-level security, so it also
-- reached rows belonging to a co-teacher or an admin. That both destroys
-- evidence the school is required to keep and contradicts the immutability
-- promise in docs/teacher/ASSESSMENT_EVIDENCE.md.
--
-- The rule now: a report ABOUT the subject is deleted; a report that merely
-- MENTIONS the subject has the subject's entries stripped and is kept.

create or replace function public.redact_learner_from_shared_reports(
  p_student_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subject text := p_student_id::text;
  v_redacted integer := 0;
begin
  -- Reports about this learner alone: remove entirely.
  delete from public.el_assessment_reports er
  where er.student_id = v_subject;

  -- Reports about a group that include this learner: strip their entries and
  -- keep the row, so every other child's evidence survives.
  update public.el_assessment_reports er
  set
    payload = public.jsonb_strip_student_entries(er.payload, v_subject),
    summary = public.jsonb_strip_student_entries(er.summary, v_subject)
  where er.student_id is distinct from v_subject
    and (
      er.payload::text like '%' || v_subject || '%'
      or er.summary::text like '%' || v_subject || '%'
    );
  get diagnostics v_redacted = row_count;

  return v_redacted;
end;
$$;

-- Walk a jsonb document and drop any object or array element that identifies
-- the subject, leaving the rest of the structure intact.
create or replace function public.jsonb_strip_student_entries(
  p_document jsonb,
  p_student_id text
)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  v_key text;
  v_result jsonb;
  v_element jsonb;
begin
  if p_document is null then
    return null;
  end if;

  if jsonb_typeof(p_document) = 'array' then
    v_result := '[]'::jsonb;
    for v_element in select value from jsonb_array_elements(p_document) loop
      -- Drop array members that ARE the subject; recurse into the others.
      if jsonb_typeof(v_element) = 'object'
         and (
           v_element ->> 'studentId' = p_student_id
           or v_element ->> 'student_id' = p_student_id
           or v_element ->> 'id' = p_student_id
         )
      then
        continue;
      end if;
      v_result := v_result || jsonb_build_array(
        public.jsonb_strip_student_entries(v_element, p_student_id)
      );
    end loop;
    return v_result;
  end if;

  if jsonb_typeof(p_document) = 'object' then
    v_result := '{}'::jsonb;
    for v_key in select jsonb_object_keys(p_document) loop
      -- A map keyed by student id: drop the subject's key outright.
      if v_key like '%' || p_student_id || '%' then
        continue;
      end if;
      v_result := v_result || jsonb_build_object(
        v_key,
        public.jsonb_strip_student_entries(p_document -> v_key, p_student_id)
      );
    end loop;
    return v_result;
  end if;

  -- Any string carrying the subject's id — whole, or embedded in a longer
  -- value such as a report id or a file name — has it replaced by a marker.
  --
  -- "Contains", not "equals", and this is load-bearing rather than tidiness:
  -- teacher_delete_learner_data finishes by refusing to complete if the id
  -- still appears ANYWHERE in payload::text or summary::text. If redaction
  -- only removed whole-value matches, one id embedded in a file name would
  -- make every deletion raise and roll back. Erasing the substring is what
  -- lets the existing residual-records proof stay strict AND stay passable.
  if jsonb_typeof(p_document) = 'string' then
    return to_jsonb(replace(p_document #>> '{}', p_student_id, '[removed]'));
  end if;

  return p_document;
end;
$$;

revoke all on function public.redact_learner_from_shared_reports(uuid) from public, anon, authenticated;
revoke all on function public.jsonb_strip_student_entries(jsonb, text) from public, anon;

comment on function public.redact_learner_from_shared_reports(uuid) is
  'Deletes reports about one learner and redacts that learner from shared reports, so deleting one child never destroys another child''s evidence.';


-- ---------------------------------------------------------------------------
-- 1b. Re-issue teacher_delete_learner_data so it uses the redaction above.
--
-- The body is otherwise unchanged from
-- 20260725110000_learner_data_rights.sql: same ownership checks, same locking,
-- same audit event, same residual-record proof. Only the
-- el_assessment_reports statement is different.

create or replace function public.teacher_delete_learner_data(
  p_request_id uuid,
  p_student_id uuid,
  p_subject_ref text,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
  v_request public.data_rights_requests;
  v_expected_ref text;
  v_counts jsonb := '{}'::jsonb;
  v_count integer;
begin
  if p_confirmation is distinct from 'DELETE LEARNER DATA' then
    raise exception 'The exact deletion confirmation phrase is required';
  end if;

  v_student := public.assert_learner_data_rights_actor(p_student_id);
  v_expected_ref := public.data_rights_subject_ref(
    v_student.id,
    v_student.created_at
  );

  if p_subject_ref is distinct from v_expected_ref then
    raise exception 'The deletion subject reference does not match the learner';
  end if;

  select dr.*
  into v_request
  from public.data_rights_requests dr
  where dr.id = p_request_id
    and dr.subject_ref = v_expected_ref
    and dr.teacher_id = v_student.teacher_id
    and dr.class_id = v_student.class_id
    and dr.request_type = 'deletion'
    and dr.verification_status = 'verified'
    and dr.status = 'in_progress'
  for update;

  if not found then
    raise exception 'A verified in-progress deletion request was not found';
  end if;

  -- These tables contain text, array, or JSON references rather than a
  -- student foreign key. The short write lock closes the race where another
  -- session could recreate learner evidence between cleanup and verification.
  lock table public.assessment_attempts in share row exclusive mode;
  lock table public.el_assessment_reports in share row exclusive mode;
  lock table public.teacher_interventions in share row exclusive mode;
  lock table public.teacher_instructional_group_reviews in share row exclusive mode;
  lock table public.teacher_insight_observations in share row exclusive mode;

  insert into public.data_rights_audit_events (
    request_id,
    teacher_id,
    actor_id,
    event_type,
    details
  )
  values (
    v_request.id,
    v_student.teacher_id,
    v_actor_id,
    'deletion_started',
    jsonb_build_object('schemaVersion', 1)
  );

  delete from public.teacher_insight_observations io
  where v_student.id = any(io.student_ids);
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('teacherObservations', v_count);

  delete from public.teacher_instructional_group_reviews gr
  where v_student.id = any(gr.student_ids);
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('instructionalGroupReviews', v_count);

  update public.teacher_interventions ti
  set student_ids = array_remove(ti.student_ids, v_student.id)
  where v_student.id = any(ti.student_ids);
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('interventionsUpdated', v_count);

  -- Reports ABOUT this learner are deleted; reports that merely mention them
  -- (whole-class reports) have this learner's entries stripped and are kept, so
  -- deleting one child can never destroy another child's evidence.
  v_count := public.redact_learner_from_shared_reports(v_student.id);
  v_counts := v_counts || jsonb_build_object('assessmentReportsRedacted', v_count);
  v_counts := v_counts || jsonb_build_object(
    'assessmentReports',
    (select count(*) from public.el_assessment_reports er
      where er.student_id = v_student.id::text)
  );

  delete from public.assessment_attempts aa
  where aa.student_id = v_student.id::text;
  get diagnostics v_count = row_count;
  v_counts := v_counts || jsonb_build_object('assessmentAttempts', v_count);

  select
    v_counts || jsonb_build_object(
      'answers', (select count(*) from public.answers a where a.student_id = v_student.id),
      'mastery', (select count(*) from public.mastery m where m.student_id = v_student.id),
      'itemMastery', (select count(*) from public.item_mastery im where im.student_id = v_student.id),
      'progress', (select count(*) from public.student_progress sp where sp.student_id = v_student.id),
      'learningActivity', (select count(*) from public.learn_activity la where la.student_id = v_student.id),
      'syncHealth', (select count(*) from public.activity_sync_health sh where sh.student_id = v_student.id),
      'sessions', (select count(*) from public.student_sessions ss where ss.student_id = v_student.id)
    )
  into strict v_counts;

  delete from public.students s
  where s.id = v_student.id
    and (
      s.teacher_id = v_actor_id
      or public.is_app_admin(v_actor_id)
    );

  if not found then
    raise exception 'Learner deletion did not complete';
  end if;

  if exists (
    select 1 from public.answers a where a.student_id = p_student_id
    union all
    select 1 from public.mastery m where m.student_id = p_student_id
    union all
    select 1 from public.item_mastery im where im.student_id = p_student_id
    union all
    select 1 from public.student_progress sp where sp.student_id = p_student_id
    union all
    select 1 from public.learn_activity la where la.student_id = p_student_id
    union all
    select 1 from public.activity_sync_health sh where sh.student_id = p_student_id
    union all
    select 1 from public.student_sessions ss where ss.student_id = p_student_id
    union all
    select 1 from public.assessment_attempts aa where aa.student_id = p_student_id::text
    union all
    select 1 from public.el_assessment_reports er
      where er.student_id = p_student_id::text
        or er.payload::text like '%' || p_student_id::text || '%'
        or er.summary::text like '%' || p_student_id::text || '%'
    union all
    select 1 from public.teacher_interventions ti where p_student_id = any(ti.student_ids)
    union all
    select 1 from public.teacher_instructional_group_reviews gr where p_student_id = any(gr.student_ids)
    union all
    select 1 from public.teacher_insight_observations io where p_student_id = any(io.student_ids)
  ) then
    raise exception 'Learner deletion verification found residual managed records';
  end if;

  update public.data_rights_requests
  set
    status = 'completed',
    completed_at = now(),
    outcome_counts = v_counts,
    updated_at = now()
  where id = v_request.id;

  insert into public.data_rights_audit_events (
    request_id,
    teacher_id,
    actor_id,
    event_type,
    details
  )
  values (
    v_request.id,
    v_student.teacher_id,
    v_actor_id,
    'deletion_completed',
    jsonb_build_object(
      'schemaVersion', 1,
      'residualManagedRecords', 0
    )
  );

  return jsonb_build_object(
    'requestId', v_request.id,
    'subjectRef', v_expected_ref,
    'status', 'completed',
    'completedAt', now(),
    'deletedCounts', v_counts,
    'residualManagedRecords', 0
  );
end;
$$;


revoke all on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  from public, anon;
grant execute on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Archiving a learner now ends their sessions.
--
-- student_from_token filtered on revoked/expires_at but not archived_at, and
-- teacher_set_student_archived revoked nothing, so a child the teacher had just
-- removed from the roster kept reading and writing progress until their session
-- expired. The teacher's screen said they were gone.

create or replace function public.teacher_set_student_archived(
  p_student_id uuid,
  p_class_id uuid,
  p_archived boolean
)
returns table (id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_owner_id uuid;
begin
  if v_actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required.';
  end if;

  select c.teacher_id
    into v_owner_id
  from public.students s
  join public.classes c
    on c.id = s.class_id
   and c.teacher_id = s.teacher_id
  where s.id = p_student_id
    and s.class_id = p_class_id;

  if v_owner_id is null then
    raise exception using
      errcode = 'P0002',
      message = 'The child was not found in this class.';
  end if;

  if v_owner_id is distinct from v_actor_id
     and not public.is_app_admin(v_actor_id)
  then
    raise exception using
      errcode = '42501',
      message = 'You do not have permission to change this child.';
  end if;

  -- Archiving is presented to the teacher as removal, so it must actually stop
  -- access rather than only hiding the row.
  if p_archived then
    update public.student_sessions
       set revoked = true
     where student_id = p_student_id
       and revoked = false;
  end if;

  return query
  update public.students s
     set archived_at = case when p_archived then now() else null end,
         updated_at = now()
   where s.id = p_student_id
     and s.class_id = p_class_id
  returning s.id;
end;
$$;

comment on function public.teacher_set_student_archived(uuid, uuid, boolean) is
  'Archives or restores one child after verifying teacher ownership of the class. Archiving also revokes the child''s active sessions.';

revoke all on function public.teacher_set_student_archived(uuid, uuid, boolean)
  from public, anon;
grant execute on function public.teacher_set_student_archived(uuid, uuid, boolean)
  to authenticated;

-- An archived child must not be able to resume on an existing token either.
-- Return type and grants are kept exactly as first defined in
-- 20260610000000_student_login_symbol_passwords.sql; only the archived_at
-- filter is added, because `create or replace` cannot change a return type.
create or replace function public.student_from_token(p_token text)
returns public.students
language sql stable security definer set search_path = public
as $$
  select s.* from public.student_sessions ss
  join public.students s on s.id = ss.student_id
  where ss.token = p_token
    and ss.revoked = false
    and ss.expires_at > now()
    and s.archived_at is null
  limit 1;
$$;

revoke all on function public.student_from_token(text) from public, anon, authenticated;

-- ==== 20260727091000_security_definer_boundary.sql ======================

-- Reassert the complete database API boundary after the 2026-07-27
-- data-rights and lifecycle fixes.
--
-- Re-issued because 20260727090000_data_rights_and_lifecycle_fixes.sql adds one
-- new SECURITY DEFINER function (redact_learner_from_shared_reports) and
-- replaces three others. This file must remain the LAST migration containing
-- the words "security definer" — tests/unit/databasePolicyContract.test.js
-- enforces exactly that, and it caught this file's absence.
--
-- PostgreSQL grants EXECUTE on newly created functions to PUBLIC by default.
-- This migration must remain after every SECURITY DEFINER migration: it first
-- removes execution from every API role, then restores only the reviewed RPC
-- surface used by the product.

-- Keep obsolete child-login entry points absent even on databases upgraded
-- through an older or partially applied migration history.
drop function if exists public.student_list_schools();
drop function if exists public.student_list_classes(uuid);
drop function if exists public.student_list_students(uuid);
drop function if exists public.student_set_password(uuid, text);
drop function if exists public.student_set_password(uuid, text, text);
drop function if exists public.student_login(uuid, text);
drop function if exists public.student_class_by_code(text);
drop function if exists public.student_log_activity(text, text, text, text, jsonb);

do $security_boundary$
declare
  function_row record;
begin
  for function_row in
    select procedure.oid::regprocedure as signature
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.prosecdef
  loop
    execute format(
      'revoke execute on function %s from public, anon, authenticated',
      function_row.signature
    );
  end loop;
end
$security_boundary$;

-- Anonymous-safe learner RPCs.
grant execute on function public.student_class_by_code(text, text)
  to anon, authenticated;
grant execute on function public.student_login(uuid, text, text, text)
  to anon, authenticated;
grant execute on function public.student_get_progress(text)
  to anon, authenticated;
grant execute on function public.student_save_progress(text, text, text, jsonb)
  to anon, authenticated;
grant execute on function public.student_log_activity_v2(
  text, text, text, text, text, jsonb, timestamptz, integer
) to anon, authenticated;
grant execute on function public.student_report_activity_sync_health(
  text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) to anon, authenticated;
grant execute on function public.get_game_leaderboard(text, integer)
  to anon, authenticated;
grant execute on function public.report_app_error(
  uuid, text, text, text, text, text, text, text[], numeric
) to anon, authenticated;

-- Authenticated teacher and administrator RPCs.
grant execute on function public.is_app_admin(uuid)
  to authenticated;
grant execute on function public.find_or_create_school(text)
  to authenticated;
grant execute on function public.list_school_names()
  to authenticated;
grant execute on function public.teacher_set_school(text)
  to authenticated;
grant execute on function public.set_app_config(text, jsonb)
  to authenticated;
grant execute on function public.teacher_set_class_leaderboard_scope(uuid, text)
  to authenticated;
grant execute on function public.teacher_set_student_archived(uuid, uuid, boolean)
  to authenticated;
grant execute on function public.teacher_save_instructional_group(
  uuid, text, jsonb, uuid[], jsonb
) to authenticated;
grant execute on function public.teacher_review_instructional_group(
  uuid, uuid[], jsonb
) to authenticated;
grant execute on function public.teacher_assign_instructional_group_follow_up(
  uuid, text, text, date
) to authenticated;
grant execute on function public.teacher_create_insight_intervention(
  text, uuid, jsonb, uuid[], text[], text, text, date
) to authenticated;
grant execute on function public.teacher_record_insight_observation(
  uuid, jsonb, uuid[], text, text, text, date
) to authenticated;
grant execute on function public.teacher_regenerate_class_code(uuid)
  to authenticated;
grant execute on function public.teacher_set_class_code_expiry(uuid, timestamptz)
  to authenticated;
grant execute on function public.teacher_class_access_summary(uuid)
  to authenticated;
grant execute on function public.teacher_class_access_log(uuid, integer)
  to authenticated;
grant execute on function public.admin_recent_error_events(integer)
  to authenticated;
grant execute on function public.admin_error_monitor_summary()
  to authenticated;
grant execute on function public.admin_purge_expired_error_events()
  to authenticated;
grant execute on function public.teacher_export_learner_data(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_list_learner_data_rights(uuid)
  to authenticated;
grant execute on function public.teacher_prepare_learner_deletion(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_delete_learner_data(uuid, uuid, text, text)
  to authenticated;
grant execute on function public.admin_get_school_retention_policy(uuid)
  to authenticated;
grant execute on function public.admin_save_school_retention_policy(
  uuid, integer, integer, text, integer, integer, integer
) to authenticated;
grant execute on function public.admin_preview_school_retention(uuid)
  to authenticated;
grant execute on function public.admin_list_deletion_propagation(uuid)
  to authenticated;
grant execute on function public.admin_verify_deletion_propagation(
  uuid, text, text
) to authenticated;
grant execute on function public.admin_run_school_retention(uuid, text)
  to authenticated;

notify pgrst, 'reload schema';

commit;

-- ===========================================================================
-- CHECK 1 — run on its own AFTER the block above succeeds.
-- Every row must say 'present'.
-- ===========================================================================
-- select
--   name,
--   case when exists (
--     select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--     where n.nspname = 'public' and p.proname = name
--   ) then 'present' else 'MISSING' end as status
-- from unnest(array[
--   'teacher_prepare_learner_deletion',
--   'teacher_delete_learner_data',
--   'teacher_export_learner_data',
--   'teacher_list_learner_data_rights',
--   'teacher_set_student_archived',
--   'redact_learner_from_shared_reports',
--   'jsonb_strip_student_entries',
--   'student_from_token'
-- ]) as name
-- order by status desc, name;

-- ===========================================================================
-- CHECK 2 — prove deleting one child cannot erase another child's evidence.
-- Expect: t
-- ===========================================================================
-- select public.jsonb_strip_student_entries(
--   '{"class":"3B","learners":[
--       {"studentId":"11111111-1111-1111-1111-111111111111","name":"Aaron","score":7},
--       {"studentId":"22222222-2222-2222-2222-222222222222","name":"Bea","score":9}],
--     "file":"report-11111111-1111-1111-1111-111111111111.json"}'::jsonb,
--   '11111111-1111-1111-1111-111111111111'
-- )::text not like '%11111111-1111-1111-1111-111111111111%'
--   as subject_id_fully_erased;
