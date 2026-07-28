-- Move one learner between two classes owned by the same teacher.
--
-- The previous frontend updated students.class_id directly. That write was
-- ownership-protected by RLS, but it left an existing classroom session active:
-- a device admitted through the old class could immediately continue in the
-- destination class without using its code. The owned RPC makes the class
-- change and session revocation one transaction.
--
-- Historical evidence deliberately keeps the class_id recorded when the work
-- happened. Individual progress is keyed by student_id and still follows the
-- learner; class reports retain their original provenance.

create or replace function public.teacher_transfer_student(
  p_student_id uuid,
  p_source_class_id uuid,
  p_target_class_id uuid
)
returns table (id uuid, class_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_owner_id uuid;
  v_moved_id uuid;
  v_moved_class_id uuid;
begin
  if v_actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required.';
  end if;

  if p_student_id is null
     or p_source_class_id is null
     or p_target_class_id is null
     or p_source_class_id = p_target_class_id
  then
    raise exception using
      errcode = '22023',
      message = 'Choose a different destination class.';
  end if;

  select s.teacher_id
    into v_owner_id
  from public.students s
  join public.classes source_class
    on source_class.id = s.class_id
   and source_class.teacher_id = s.teacher_id
  where s.id = p_student_id
    and s.class_id = p_source_class_id;

  if v_owner_id is null then
    raise exception using
      errcode = 'P0002',
      message = 'The student was not found in the source class.';
  end if;

  if v_owner_id is distinct from v_actor_id
     and not public.is_app_admin(v_actor_id)
  then
    raise exception using
      errcode = '42501',
      message = 'You do not have permission to move this student.';
  end if;

  if not exists (
    select 1
    from public.classes target_class
    where target_class.id = p_target_class_id
      and target_class.teacher_id = v_owner_id
  ) then
    raise exception using
      errcode = '22023',
      message = 'The destination class is not available to this account.';
  end if;

  -- A class code admits the classroom device into a specific class context.
  -- End every old learner session before changing that context.
  update public.student_sessions
     set revoked = true
   where student_id = p_student_id
     and revoked = false;

  update public.students s
     set class_id = p_target_class_id,
         updated_at = now()
   where s.id = p_student_id
     and s.class_id = p_source_class_id
     and s.teacher_id = v_owner_id
  returning s.id, s.class_id
       into v_moved_id, v_moved_class_id;

  if v_moved_id is null then
    raise exception using
      errcode = 'P0002',
      message = 'The student was not found in the source class.';
  end if;

  return query
  select v_moved_id, v_moved_class_id;
end;
$$;

comment on function public.teacher_transfer_student(uuid, uuid, uuid) is
  'Moves one owned student to another class owned by the same teacher, revokes old learner sessions, and preserves historical evidence class provenance.';

revoke all on function public.teacher_transfer_student(uuid, uuid, uuid)
  from public, anon;
grant execute on function public.teacher_transfer_student(uuid, uuid, uuid)
  to authenticated;

notify pgrst, 'reload schema';
