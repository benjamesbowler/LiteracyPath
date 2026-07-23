-- Atomic, teacher-owned sample data for first-run onboarding.
--
-- Demo learners carry login pictures so teachers can safely explore child
-- sign-in, but they carry no answers, mastery, attempts, or progress. The
-- "(sample)" label keeps the data unmistakable in every downstream view.

create or replace function public.teacher_create_demo_class()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
  v_school_id uuid;
  v_class public.classes;
begin
  if v_teacher_id is null then
    raise exception 'Authentication required';
  end if;

  select school_id
  into v_school_id
  from public.pending_teacher_accounts
  where user_id = v_teacher_id
    and role = 'teacher'
    and status = 'approved'
    and approval_status = 'approved'
  limit 1;

  if not found then
    raise exception 'Approved teacher account required';
  end if;

  if exists (
    select 1
    from public.classes
    where teacher_id = v_teacher_id
  ) then
    raise exception 'Sample class is only available before the first class is created';
  end if;

  insert into public.classes (teacher_id, school_id, name)
  values (v_teacher_id, v_school_id, 'Demo Class (sample)')
  returning * into v_class;

  insert into public.students (
    class_id,
    teacher_id,
    name,
    symbol_password,
    password_set_at,
    password_updated_by
  )
  values
    (v_class.id, v_teacher_id, 'Demo Ava', '123', now(), v_teacher_id),
    (v_class.id, v_teacher_id, 'Demo Ben', '456', now(), v_teacher_id),
    (v_class.id, v_teacher_id, 'Demo Chen', '789', now(), v_teacher_id);

  return jsonb_build_object(
    'class_id', v_class.id,
    'class_name', v_class.name,
    'learner_count', 3,
    'contains_assessment_evidence', false
  );
end;
$$;

revoke all on function public.teacher_create_demo_class() from public;
grant execute on function public.teacher_create_demo_class() to authenticated;
