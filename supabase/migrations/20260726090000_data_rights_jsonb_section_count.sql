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
