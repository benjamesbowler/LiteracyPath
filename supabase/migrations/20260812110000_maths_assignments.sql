begin;

create table public.maths_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  skill_id text not null check (char_length(skill_id) between 1 and 80),
  activity_type text not null check (activity_type in ('lesson', 'skills_check', 'game', 'number_story')),
  activity_id text not null check (char_length(activity_id) between 1 and 120),
  title text not null check (char_length(title) between 1 and 160),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create index maths_assignments_class_active_idx
  on public.maths_assignments (class_id, created_at desc)
  where archived_at is null;

create table public.maths_assignment_students (
  assignment_id uuid not null references public.maths_assignments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (assignment_id, student_id)
);

create index maths_assignment_students_student_idx
  on public.maths_assignment_students (student_id, assigned_at desc);

alter table public.maths_assignments enable row level security;
alter table public.maths_assignment_students enable row level security;
revoke all on table public.maths_assignments from public, anon, authenticated;
revoke all on table public.maths_assignment_students from public, anon, authenticated;

create function public.teacher_create_maths_assignment(
  p_class_id uuid,
  p_skill_id text,
  p_activity_type text,
  p_activity_id text,
  p_title text,
  p_student_ids uuid[],
  p_due_at timestamptz default null
)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_assignment public.maths_assignments;
  v_unique_count integer;
begin
  perform public.assert_current_actor_teacher_access();
  if p_class_id is null
    or nullif(btrim(coalesce(p_skill_id, '')), '') is null
    or char_length(p_skill_id) > 80
    or p_activity_type not in ('lesson', 'skills_check', 'game', 'number_story')
    or nullif(btrim(coalesce(p_activity_id, '')), '') is null
    or char_length(p_activity_id) > 120
    or nullif(btrim(coalesce(p_title, '')), '') is null
    or char_length(p_title) > 160
    or coalesce(array_length(p_student_ids, 1), 0) < 1
    or coalesce(array_length(p_student_ids, 1), 0) > 200
    or (p_due_at is not null and p_due_at < now() - interval '5 minutes')
  then
    return jsonb_build_object('ok', false, 'error', 'invalid_payload');
  end if;
  if not exists (
    select 1 from public.classes class
    where class.id = p_class_id and class.teacher_id = auth.uid()
  ) then
    return jsonb_build_object('ok', false, 'error', 'class_not_found');
  end if;
  select count(distinct student_id) into v_unique_count
  from unnest(p_student_ids) student_id;
  if v_unique_count <> array_length(p_student_ids, 1)
    or exists (
      select 1 from unnest(p_student_ids) requested(student_id)
      left join public.students student on student.id = requested.student_id
        and student.class_id = p_class_id
        and student.teacher_id = auth.uid()
        and student.archived_at is null
      where student.id is null
    )
  then
    return jsonb_build_object('ok', false, 'error', 'learner_not_in_owned_class');
  end if;

  insert into public.maths_assignments (
    teacher_id, class_id, skill_id, activity_type, activity_id, title, due_at
  ) values (
    auth.uid(), p_class_id, btrim(p_skill_id), p_activity_type,
    btrim(p_activity_id), btrim(p_title), p_due_at
  ) returning * into v_assignment;

  insert into public.maths_assignment_students (assignment_id, student_id)
  select v_assignment.id, requested.student_id
  from unnest(p_student_ids) requested(student_id);

  return jsonb_build_object(
    'ok', true,
    'assignmentId', v_assignment.id,
    'assignedCount', v_unique_count
  );
end;
$$;

create function public.teacher_list_maths_assignments(
  p_class_id uuid,
  p_include_archived boolean default false
)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_rows jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  if not exists (
    select 1 from public.classes class
    where class.id = p_class_id and class.teacher_id = auth.uid()
  ) then
    return jsonb_build_object('ok', false, 'error', 'class_not_found');
  end if;
  select coalesce(jsonb_agg(payload order by created_at desc), '[]'::jsonb) into v_rows
  from (
    select assignment.created_at,
      jsonb_build_object(
        'id', assignment.id,
        'skillId', assignment.skill_id,
        'activityType', assignment.activity_type,
        'activityId', assignment.activity_id,
        'title', assignment.title,
        'dueAt', assignment.due_at,
        'createdAt', assignment.created_at,
        'archivedAt', assignment.archived_at,
        'assignedCount', count(link.student_id),
        'completedCount', count(link.student_id) filter (where link.completed_at is not null)
      ) payload
    from public.maths_assignments assignment
    join public.maths_assignment_students link on link.assignment_id = assignment.id
    where assignment.teacher_id = auth.uid()
      and assignment.class_id = p_class_id
      and (p_include_archived or assignment.archived_at is null)
    group by assignment.id
  ) rows;
  return jsonb_build_object('ok', true, 'assignments', v_rows);
end;
$$;

create function public.student_list_maths_assignments(p_token text)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_student public.students;
  v_rows jsonb;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_student_session');
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', assignment.id,
    'skillId', assignment.skill_id,
    'activityType', assignment.activity_type,
    'activityId', assignment.activity_id,
    'title', assignment.title,
    'dueAt', assignment.due_at,
    'assignedAt', link.assigned_at,
    'completedAt', link.completed_at
  ) order by link.completed_at nulls first, assignment.due_at nulls last, link.assigned_at desc), '[]'::jsonb)
  into v_rows
  from public.maths_assignment_students link
  join public.maths_assignments assignment on assignment.id = link.assignment_id
  where link.student_id = v_student.id
    and assignment.class_id = v_student.class_id
    and assignment.archived_at is null;
  return jsonb_build_object('ok', true, 'assignments', v_rows);
end;
$$;

create function public.student_complete_maths_assignment(
  p_token text,
  p_assignment_id uuid
)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_student public.students;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_student_session');
  end if;
  update public.maths_assignment_students link
  set completed_at = coalesce(link.completed_at, now())
  from public.maths_assignments assignment
  where link.assignment_id = p_assignment_id
    and link.student_id = v_student.id
    and assignment.id = link.assignment_id
    and assignment.class_id = v_student.class_id
    and assignment.archived_at is null;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'assignment_not_found');
  end if;
  return jsonb_build_object('ok', true, 'assignmentId', p_assignment_id);
end;
$$;

-- Assignments and completion timestamps are learner data, even though they do
-- not carry a score or mastery claim. Keep them in the verified export chain.
alter function public.teacher_export_learner_data(uuid, text, text)
  rename to teacher_export_learner_data_without_maths_assignments;
revoke all on function public.teacher_export_learner_data_without_maths_assignments(uuid, text, text)
  from public, anon, authenticated;

create function public.teacher_export_learner_data(
  p_student_id uuid,
  p_requester_role text,
  p_verification_method text
)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_package jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  v_package := public.teacher_export_learner_data_without_maths_assignments(
    p_student_id,
    p_requester_role,
    p_verification_method
  );
  return v_package || jsonb_build_object(
    'mathsAssignments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'assignmentId', assignment.id,
        'classId', assignment.class_id,
        'skillId', assignment.skill_id,
        'activityType', assignment.activity_type,
        'activityId', assignment.activity_id,
        'title', assignment.title,
        'dueAt', assignment.due_at,
        'assignedAt', link.assigned_at,
        'completedAt', link.completed_at,
        'createdAt', assignment.created_at,
        'archivedAt', assignment.archived_at
      ) order by link.assigned_at, assignment.id)
      from public.maths_assignment_students link
      join public.maths_assignments assignment on assignment.id = link.assignment_id
      where link.student_id = p_student_id
        and assignment.teacher_id = auth.uid()
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.teacher_create_maths_assignment(uuid, text, text, text, text, uuid[], timestamptz) from public, anon, authenticated;
revoke all on function public.teacher_list_maths_assignments(uuid, boolean) from public, anon, authenticated;
revoke all on function public.student_list_maths_assignments(text) from public, anon, authenticated;
revoke all on function public.student_complete_maths_assignment(text, uuid) from public, anon, authenticated;
revoke all on function public.teacher_export_learner_data(uuid, text, text) from public, anon, authenticated;
grant execute on function public.teacher_create_maths_assignment(uuid, text, text, text, text, uuid[], timestamptz) to authenticated;
grant execute on function public.teacher_list_maths_assignments(uuid, boolean) to authenticated;
grant execute on function public.student_list_maths_assignments(text) to anon, authenticated;
grant execute on function public.student_complete_maths_assignment(text, uuid) to anon, authenticated;
grant execute on function public.teacher_export_learner_data(uuid, text, text) to authenticated;

commit;
