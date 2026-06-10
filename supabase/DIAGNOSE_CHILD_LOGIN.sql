-- ============================================================
-- DIAGNOSE CHILD LOGIN - read-mostly, safe to run.
-- For each student with a saved password, it tries logging in
-- with that exact password using the real login function.
-- Paste the whole result back to Claude.
-- ============================================================

select item, detail from (

  -- 1. Which login-related functions exist (old leftovers show up here)
  select 1 as sort_order,
         'function: ' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as item,
         'exists' as detail
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('student_login', 'student_set_password', 'student_list_students')

  union all

  -- 2. Duplicate student names (taps the wrong copy = wrong password)
  select 2,
         'duplicate name: ' || s.name,
         count(*)::text || ' copies'
  from public.students s
  group by s.name
  having count(*) > 1

  union all

  -- 3. Every saved password: format check + real login test
  select 3,
         'student: ' || s.name,
         'stored=' || coalesce(s.symbol_password, 'none')
         || ' | format_ok=' || coalesce((s.symbol_password ~ '^[1-9]{3}$')::text, '-')
         || ' | login_test=' || coalesce(public.student_login(s.id, s.symbol_password)->>'ok',
                                          public.student_login(s.id, s.symbol_password)->>'error')
  from public.students s
  where s.symbol_password is not null

) report
order by sort_order, item;
