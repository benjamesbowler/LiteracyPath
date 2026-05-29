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
