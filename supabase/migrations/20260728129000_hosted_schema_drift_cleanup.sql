-- Reconcile historical hosted-schema drift without deleting retained records.
-- The named policies pre-date the current account-status boundary and are
-- permissive, so PostgreSQL combines them with newer policies using OR.

begin;

do $drop_historical_policies$
declare
  policy_row record;
begin
  for policy_row in
    select *
    from (values
      ('answers', 'Admins can delete answers'),
      ('answers', 'Admins can read all answers'),
      ('answers', 'Teachers can delete own answers'),
      ('answers', 'Teachers can insert own answers'),
      ('answers', 'Teachers can read own answers'),
      ('answers', 'Teachers can update own answers'),
      ('classes', 'Admins can delete classes'),
      ('classes', 'Admins can read all classes'),
      ('classes', 'Teachers can delete own classes'),
      ('classes', 'Teachers can insert own classes'),
      ('classes', 'Teachers can read own classes'),
      ('classes', 'Teachers can update own classes'),
      ('item_mastery', 'Admins can delete item mastery'),
      ('item_mastery', 'Admins can read all item mastery'),
      ('item_mastery', 'Teachers can delete own item mastery'),
      ('item_mastery', 'Teachers can insert own item mastery'),
      ('item_mastery', 'Teachers can read own item mastery'),
      ('item_mastery', 'Teachers can update own item mastery'),
      ('mastery', 'Admins can delete mastery'),
      ('mastery', 'Admins can read all mastery'),
      ('mastery', 'Teachers can delete own mastery'),
      ('mastery', 'Teachers can insert own mastery'),
      ('mastery', 'Teachers can read own mastery'),
      ('mastery', 'Teachers can update own mastery'),
      ('students', 'Admins can delete students'),
      ('students', 'Admins can read all students'),
      ('students', 'Teachers can delete own students'),
      ('students', 'Teachers can insert own students'),
      ('students', 'Teachers can read own students'),
      ('students', 'Teachers can update own students'),
      ('pending_teacher_accounts', 'Admins can update pending teacher accounts'),
      ('pending_teacher_accounts', 'Admins can view pending teacher accounts'),
      ('pending_teacher_accounts', 'Teachers can create own pending teacher account'),
      ('pending_teacher_accounts', 'Teachers can view own pending teacher account'),
      ('app_admins', 'Users can read own app admin row'),
      ('app_user_roles', 'Admins can insert app user roles'),
      ('app_user_roles', 'Admins can update all app user roles'),
      ('app_user_roles', 'Admins can view all app user roles'),
      ('app_user_roles', 'Users can view own app role'),
      ('child_mode_answers', 'Teachers can delete own child mode answers'),
      ('child_mode_answers', 'Teachers can insert own child mode answers'),
      ('child_mode_answers', 'Teachers can read own child mode answers'),
      ('media_qa_records', 'Teachers can insert media QA records'),
      ('media_qa_records', 'Teachers can read media QA records'),
      ('media_qa_records', 'Teachers can update media QA records'),
      ('question_flags', 'Admins can delete question flags'),
      ('question_flags', 'Admins can update question flags'),
      ('question_flags', 'Teachers can insert own question flags'),
      ('question_flags', 'Teachers can read own question flags')
    ) as historical_policy(table_name, policy_name)
  loop
    if to_regclass(format('public.%I', policy_row.table_name)) is not null then
      execute format(
        'drop policy if exists %I on public.%I',
        policy_row.policy_name,
        policy_row.table_name
      );
    end if;
  end loop;
end
$drop_historical_policies$;

-- These hosted-only tables may contain evidence worth reconciling. Preserve
-- every row, but remove all browser access and any remaining historical policy.
do $lock_retained_hosted_tables$
declare
  v_table text;
  v_policy text;
begin
  foreach v_table in array array[
    'app_user_roles',
    'child_mode_answers',
    'media_qa_records',
    'question_flags'
  ]
  loop
    if to_regclass(format('public.%I', v_table)) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', v_table);

    for v_policy in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = v_table
    loop
      execute format('drop policy if exists %I on public.%I', v_policy, v_table);
    end loop;

    execute format(
      'revoke all privileges on table public.%I from public, anon, authenticated',
      v_table
    );
  end loop;
end
$lock_retained_hosted_tables$;

-- Remove obsolete zero-argument authority helpers after their dependent
-- policies have gone. The canonical is_app_admin(uuid) function is retained.
drop function if exists public.is_literacypath_admin();
drop function if exists public.is_app_admin();

-- Reset browser table privileges, including latent TRUNCATE, REFERENCES,
-- TRIGGER, and MAINTAIN grants, then restore the minimum application surface.
revoke all on table public.activity_sync_health from public, anon, authenticated;
grant select on table public.activity_sync_health to authenticated;

revoke all on table public.app_admins from public, anon, authenticated;
grant select on table public.app_admins to authenticated;

revoke all on table public.app_error_events from public, anon, authenticated;
grant select on table public.app_error_events to authenticated;

revoke all on table public.class_access_events from public, anon, authenticated;
grant select on table public.class_access_events to authenticated;

revoke all on table public.schools from public, anon, authenticated;
grant select on table public.schools to authenticated;

revoke all on table public.answers from public, anon, authenticated;
grant select, insert, update on table public.answers to authenticated;

revoke all on table public.assessment_attempts from public, anon, authenticated;
grant select, insert, update on table public.assessment_attempts to authenticated;

revoke all on table public.classes from public, anon, authenticated;
grant select, insert, update on table public.classes to authenticated;

revoke all on table public.el_assessment_reports from public, anon, authenticated;
grant select, insert, update on table public.el_assessment_reports to authenticated;

revoke all on table public.item_mastery from public, anon, authenticated;
grant select, insert, update on table public.item_mastery to authenticated;

revoke all on table public.mastery from public, anon, authenticated;
grant select, insert, update on table public.mastery to authenticated;

revoke all on table public.pending_teacher_accounts from public, anon, authenticated;
grant select, insert, update on table public.pending_teacher_accounts to authenticated;

revoke all on table public.student_progress from public, anon, authenticated;
grant select, insert, update on table public.student_progress to authenticated;

revoke all on table public.students from public, anon, authenticated;
grant select, insert, update on table public.students to authenticated;

revoke all on table public.learn_activity from public, anon, authenticated;
grant select, insert on table public.learn_activity to authenticated;

revoke all on table public.worksheet_bank from public, anon, authenticated;
grant select, insert, delete on table public.worksheet_bank to authenticated;

-- Browser roles never need sequence access; inserts into the audit table are
-- owned by reviewed functions.
revoke all on sequence public.data_rights_audit_events_id_seq
  from public, anon, authenticated;

-- The sample-class helper is teacher-only. Reassert this explicitly because
-- older hosted function ACLs retained the PostgreSQL PUBLIC default.
revoke execute on function public.teacher_create_demo_class()
  from public, anon;
grant execute on function public.teacher_create_demo_class()
  to authenticated;

notify pgrst, 'reload schema';

commit;
