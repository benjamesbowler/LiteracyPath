-- Explicit teacher recovery refreshes only an existing owned active session.
-- Book, membership, marks and event ids are unchanged; ended sessions stay ended.
create function public.teacher_resume_reading_session(p_session_id uuid)
returns json language plpgsql volatile security definer set search_path = '' as $$
declare v_session public.reading_sessions;
begin
  perform public.assert_current_actor_teacher_access();
  select * into v_session from public.reading_sessions where id = p_session_id and teacher_id = auth.uid();
  if v_session.id is null then return json_build_object('ok', false, 'error', 'session_not_found'); end if;
  -- Match launch lock order so a concurrent assignment cannot take a member
  -- between the conflict check and recovery acknowledgement.
  perform 1 from public.students where id = any(v_session.student_ids) order by id for update;
  select * into v_session from public.reading_sessions where id = p_session_id and teacher_id = auth.uid() for update;
  if v_session.status <> 'active' then return json_build_object('ok', false, 'error', 'session_ended'); end if;
  if not exists (select 1 from public.classes where id = v_session.class_id and teacher_id = auth.uid())
    or exists (select 1 from unnest(v_session.student_ids) member_id where not exists (
      select 1 from public.students student where student.id = member_id and student.class_id = v_session.class_id
        and student.teacher_id = auth.uid() and student.archived_at is null
    )) then return json_build_object('ok', false, 'error', 'student_not_in_class'); end if;
  if exists (select 1 from public.reading_sessions other where other.id <> v_session.id and other.status = 'active'
      and (other.teacher_id = auth.uid() or other.student_ids && v_session.student_ids))
    or exists (select 1 from public.student_focus_session_members member
      join public.student_focus_sessions focus on focus.id = member.session_id
      where member.student_id = any(v_session.student_ids) and member.active and focus.status = 'active'
        and focus.expires_at > now())
    then return json_build_object('ok', false, 'error', 'student_busy'); end if;
  update public.reading_sessions set updated_at = now() where id = v_session.id returning * into v_session;
  return json_build_object('ok', true, 'session', to_jsonb(v_session));
end;
$$;
revoke all on function public.teacher_resume_reading_session(uuid) from public, anon, authenticated;
grant execute on function public.teacher_resume_reading_session(uuid) to authenticated;
notify pgrst, 'reload schema';
