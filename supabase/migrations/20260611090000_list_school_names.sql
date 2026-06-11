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
