-- ============================================================
-- FIX SCHOOL SAVING - safe to run as many times as you like.
-- Creates anything that's missing, then prints a status report.
-- ============================================================

create extension if not exists pgcrypto;

-- 1. Schools table (in case the earlier migration never ran)
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

do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_app_admin'
  ) then
    drop policy if exists "App admins can update schools" on public.schools;
    create policy "App admins can update schools"
      on public.schools for update to authenticated
      using (public.is_app_admin(auth.uid()));
  end if;
end $$;

-- 2. School columns on accounts and classes
alter table public.pending_teacher_accounts
  add column if not exists school_id uuid references public.schools(id);

alter table public.classes
  add column if not exists school_id uuid references public.schools(id);

-- 3. Helper that finds or creates a school by name
create or replace function public.find_or_create_school(p_name text)
returns table (id uuid, name text)
language plpgsql security definer set search_path = public
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

-- 4. The save-school function the app calls
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
    select u.email into v_email from auth.users u where u.id = v_user;
    insert into public.pending_teacher_accounts
      (user_id, email, role, status, approval_status, school_id, approved_at)
    values
      (v_user, coalesce(v_email, ''), 'teacher', 'approved', 'approved', v_id, now())
    on conflict (user_id) do update
      set school_id = excluded.school_id, updated_at = now();
  end if;

  update public.classes
  set school_id = v_id
  where teacher_id = v_user;

  return query select v_id, v_name;
end;
$$;

revoke all on function public.teacher_set_school(text) from public, anon;
grant execute on function public.teacher_set_school(text) to authenticated;
revoke all on function public.find_or_create_school(text) from public, anon;
grant execute on function public.find_or_create_school(text) to authenticated;

-- 5. Tell Supabase's API layer to notice the new functions immediately.
--    (A stale cache here is a common cause of saves silently failing.)
notify pgrst, 'reload schema';

-- 6. Status report - everything below should say true
select
  exists(select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = 'teacher_set_school') as save_function_ready,
  exists(select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = 'find_or_create_school') as school_lookup_ready,
  exists(select 1 from information_schema.tables
         where table_schema = 'public' and table_name = 'schools') as schools_table_ready,
  exists(select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'pending_teacher_accounts'
           and column_name = 'school_id') as account_column_ready,
  exists(select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'classes'
           and column_name = 'school_id') as class_column_ready,
  (select count(*) from public.schools) as schools_saved_so_far;
