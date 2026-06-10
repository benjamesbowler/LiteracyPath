-- ============================================================
-- DIAGNOSE CHILD LOGIN part 3
-- Shows the session table's real shape, then performs a real
-- password save. If it errors, the red error message is exactly
-- what I need - copy it back to Claude either way.
-- NOTE: if it succeeds, the first student (alphabetically) gets
-- the test password Cat, Cat, Cat.
-- ============================================================

select
  (select string_agg(column_name || ' ' || data_type
                     || case when is_nullable = 'NO' then ' NOT NULL' else '' end,
                     ' | ' order by ordinal_position)
   from information_schema.columns
   where table_schema = 'public' and table_name = 'student_sessions') as session_table_shape,
  (select string_agg(column_name || ' ' || data_type
                     || case when is_nullable = 'NO' then ' NOT NULL' else '' end,
                     ' | ' order by ordinal_position)
   from information_schema.columns
   where table_schema = 'public' and table_name = 'student_progress') as progress_table_shape,
  public.student_set_password(
    (select id from public.students where symbol_password is null order by name limit 1),
    '111'
  ) as real_password_save_test;
