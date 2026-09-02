-- Minimal, local-only bootstrap for the isolated Sound Seekers SQL gate.
-- The runner creates a new socket-only PostgreSQL cluster before loading this
-- file, so no hosted schema or user data is involved.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$$;

create table if not exists public.student_progress (
  id bigint generated always as identity primary key,
  student_id uuid not null,
  area text not null,
  key text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  unique (student_id, area, key)
);
