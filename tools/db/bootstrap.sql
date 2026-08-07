create schema if not exists auth;
create schema if not exists extensions;
-- `email_confirmed_at` mirrors the real Supabase auth.users column. The
-- 2026-08-07 migrations read it to decide whether an account may be approved,
-- so a fixture without it cannot exercise them.
create table if not exists auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
alter table auth.users add column if not exists email_confirmed_at timestamptz;
create or replace function auth.uid() returns uuid language sql stable as $x$ select null::uuid $x$;
create or replace function auth.role() returns text language sql stable as $x$ select 'authenticated'::text $x$;
create or replace function auth.jwt() returns jsonb language sql stable as $x$ select '{}'::jsonb $x$;
do $x$ begin create role anon; exception when duplicate_object then null; end $x$;
do $x$ begin create role authenticated; exception when duplicate_object then null; end $x$;
do $x$ begin create role service_role; exception when duplicate_object then null; end $x$;
create extension if not exists pgcrypto;
