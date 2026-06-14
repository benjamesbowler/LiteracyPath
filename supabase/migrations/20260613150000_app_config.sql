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
