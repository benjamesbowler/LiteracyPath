-- HARDENING: the app's answer inserts rely on the database stamping
-- answered_at. This guarantees the default exists and backfills any rows
-- that were ever saved without one (they would otherwise sort wrongly in
-- teacher reports and the class dashboard's "last active").
--
-- HOW TO APPLY: paste this whole file into the Supabase SQL editor and Run.
-- Safe to run more than once.

alter table public.answers
  alter column answered_at set default now();

update public.answers
  set answered_at = coalesce(answered_at, now())
  where answered_at is null;
