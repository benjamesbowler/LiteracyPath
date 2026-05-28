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
