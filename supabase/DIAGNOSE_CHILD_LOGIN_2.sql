-- ============================================================
-- DIAGNOSE CHILD LOGIN part 2 - read-only, safe to run.
-- Shows what is actually stored for every class and student.
-- Paste the whole result back to Claude.
-- ============================================================

select item, detail from (

  select 1 as sort_order, 'total students' as item, count(*)::text as detail
  from public.students

  union all

  select 2, 'students with password saved', count(*)::text
  from public.students where symbol_password is not null

  union all

  select 3, 'login sessions ever created', count(*)::text
  from public.student_sessions

  union all

  select 4,
         'student: ' || s.name,
         'class=' || coalesce(c.name, 'NO CLASS')
         || ' | school=' || coalesce(sc.name, 'NO SCHOOL')
         || ' | password=' || coalesce(s.symbol_password, 'NOT SET')
         || ' | password_set_at=' || coalesce(s.password_set_at::text, '-')
         || ' | set_by_teacher=' || coalesce(s.password_updated_by::text, 'child/none')
  from public.students s
  left join public.classes c on c.id = s.class_id
  left join public.schools sc on sc.id = c.school_id

  union all

  select 5,
         'students table column: ' || column_name,
         data_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'students'
    and column_name in ('symbol_password', 'password_set_at', 'failed_login_count', 'class_id', 'teacher_id')

  union all

  select 6,
         'students update policy: ' || polname,
         pg_get_expr(polqual, polrelid)
  from pg_policy
  where polrelid = 'public.students'::regclass and polcmd in ('w', '*')

) report
order by sort_order, item;
