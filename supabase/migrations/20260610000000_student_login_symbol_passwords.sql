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
language plpgsql security definer set search_path = public
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
    'class_id', v_student.class_id, 'teacher_id', v_student.teacher_id
  );
end;
$$;

create or replace function public.student_login(p_student_id uuid, p_sequence text)
returns json
language plpgsql security definer set search_path = public
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
    'class_id', v_student.class_id, 'teacher_id', v_student.teacher_id
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
language plpgsql security definer set search_path = public
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
language plpgsql security definer set search_path = public
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
grant execute on function public.student_list_classes(uuid) to anon, authenticated;
grant execute on function public.student_list_students(uuid) to anon, authenticated;
grant execute on function public.student_set_password(uuid, text) to anon, authenticated;
grant execute on function public.student_login(uuid, text) to anon, authenticated;
grant execute on function public.student_get_progress(text) to anon, authenticated;
grant execute on function public.student_save_progress(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.student_log_activity(text, text, text, text, jsonb) to anon, authenticated;
