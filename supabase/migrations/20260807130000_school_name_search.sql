-- The school directory stops being a one-request customer-list export.
--
-- WHY. public.list_school_names() is SECURITY DEFINER, granted to anon, and
-- returns EVERY school name, unbounded and unpaginated
-- (20260611090000_list_school_names.sql). Any unauthenticated visitor could
-- read the complete list of schools using this product in a single call. It was
-- written for a good reason — the signup form offers existing names so teachers
-- join "Basis" instead of creating "Basis", "basis" and "Basis." — but the
-- shape does far more than that job needs.
--
-- A prefix search does the same job. A teacher typing "Oakri" still finds their
-- school; somebody typing nothing gets nothing. Enumerating the directory now
-- costs a dictionary attack across every prefix instead of one request, and the
-- per-call cap means each of those requests returns almost nothing.
--
-- The dropdown still works without signing in, because it has to: requiring a
-- session would leave new teachers typing free text with no suggestions, and
-- the duplicate schools this function exists to prevent would come straight
-- back.

begin;

-- Three characters is the shortest prefix that is worth a lookup and long
-- enough to be useless for enumeration: 'a' would return a slice of the whole
-- directory, 'oak' returns the schools someone already knows they are looking
-- for. Twenty results is well past what a datalist can usefully show.
create or replace function public.search_school_names(p_prefix text)
returns table (name text)
language sql
stable
security definer
set search_path = public
as $$
  select s.name
  from public.schools s
  where char_length(btrim(coalesce(p_prefix, ''))) >= 3
    and s.name ilike btrim(p_prefix) || '%'
  order by lower(s.name)
  limit 20;
$$;

comment on function public.search_school_names(text) is
  'Prefix search over the school directory for the signed-out signup form. Returns nothing under three characters and at most twenty matches, so the directory cannot be exported in one call.';

-- The old shape is removed, not merely superseded. Leaving it in place would
-- mean the leak stayed open and only the client had moved on.
drop function if exists public.list_school_names();

revoke all on function public.search_school_names(text) from public;
grant execute on function public.search_school_names(text) to anon, authenticated;

-- Case-insensitive prefix matching cannot use a plain b-tree index. This is the
-- one that makes `ilike 'oak%'` an index scan rather than a sequential read of
-- every school on every keystroke.
create index if not exists schools_name_prefix_idx
  on public.schools (lower(name) text_pattern_ops);

notify pgrst, 'reload schema';

commit;
