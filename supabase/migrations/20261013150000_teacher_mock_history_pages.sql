-- Read-only keyset history. Ownership remains derived from the authenticated
-- teacher; selected students filter historical membership, including archives.
create function public.teacher_list_literacy_mock_history_page(
  p_class_id uuid,
  p_student_id uuid default null,
  p_before_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 20
) returns json language plpgsql stable security definer set search_path = '' as $$
declare v_rows jsonb; v_more boolean; v_cursor jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  if not exists (select 1 from public.classes where id = p_class_id and teacher_id = auth.uid()) then
    return json_build_object('ok', false, 'error', 'class_not_found');
  end if;
  if p_limit is null or p_limit not between 1 and 50 or (p_before_at is null) <> (p_before_id is null) then
    return json_build_object('ok', false, 'error', 'invalid_page');
  end if;
  with candidates as (
    select s.*, to_jsonb(m) - 'session_id' as mock_snapshot from public.student_focus_sessions s
    join public.literacy_mock_sessions m on m.session_id = s.id
    where s.class_id = p_class_id and s.teacher_id = auth.uid()
      and (p_student_id is null or exists (
        select 1 from public.student_focus_session_members member
        where member.session_id = s.id and member.student_id = p_student_id
      ))
      and (p_before_at is null or (s.started_at, s.id) < (p_before_at, p_before_id))
    order by s.started_at desc, s.id desc limit p_limit + 1
  ), page as (
    select * from candidates order by started_at desc, id desc limit p_limit
  )
  select coalesce((select jsonb_agg(jsonb_build_object(
    'id', s.id, 'class_id', s.class_id, 'started_at', s.started_at,
    'status', s.status, 'selection_scope', s.selection_scope,
    'member_student_ids', coalesce((select jsonb_agg(member.student_id order by member.student_id)
      from public.student_focus_session_members member where member.session_id = s.id), '[]'::jsonb),
    -- History is a stored snapshot. Opening a report reconciles its live clock.
    'mock', s.mock_snapshot || jsonb_build_object('snapshot_only', true)
  ) order by s.started_at desc, s.id desc) from page s), '[]'::jsonb),
  (select count(*) > p_limit from candidates),
  (select jsonb_build_object('startedAt', started_at, 'id', id) from page order by started_at, id limit 1)
  into v_rows, v_more, v_cursor;
  return json_build_object('ok', true, 'sessions', v_rows, 'hasMore', v_more,
    'nextCursor', case when v_more then v_cursor else null end);
end;
$$;

revoke all on function public.teacher_list_literacy_mock_history_page(uuid, uuid, timestamptz, uuid, integer) from public, anon, authenticated;
grant execute on function public.teacher_list_literacy_mock_history_page(uuid, uuid, timestamptz, uuid, integer) to authenticated;
notify pgrst, 'reload schema';
