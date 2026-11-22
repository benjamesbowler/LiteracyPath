begin;

-- Live controls only need the current revision, counts and open help requests.
-- Historical responses and canonical question snapshots belong to the report.
create function public.teacher_get_literacy_mock_status(p_session_id uuid)
returns json language plpgsql volatile security definer set search_path = '' as $$
declare
  v_session public.student_focus_sessions;
  v_mock jsonb;
  v_members jsonb;
  v_pending integer;
  v_received integer;
  v_expired integer;
  v_now timestamptz;
begin
  perform public.assert_current_actor_teacher_access();
  select * into v_session from public.student_focus_sessions
    where id = p_session_id and teacher_id = auth.uid();
  if not found then return json_build_object('ok', false, 'error', 'session_not_found'); end if;

  v_mock := public.lp_literacy_mock_state(p_session_id);
  if v_mock is null then return json_build_object('ok', false, 'error', 'mock_not_found'); end if;
  select * into v_session from public.student_focus_sessions where id = p_session_id;
  v_now := clock_timestamp();

  with per_device as (
    select m.student_id, m.content_ok, m.last_seen_at, r.status as run_status,
      case
        when r.student_id is null then 'not_started'
        when r.offline_lease_id is null then 'server_record'
        when r.collection_ack_id is not null and r.collection_ack_id = v_mock->>'collection_id' then 'received'
        when r.status = 'completed' and r.completed_at < r.offline_lease_expires_at then 'received'
        when r.offline_lease_expires_at <= v_now then 'expired'
        when v_mock->>'collection_id' is not null then 'awaiting_connection'
        else 'device_open'
      end as receipt_state,
      r.offline_lease_expires_at as receipt_deadline,
      coalesce((select count(*) from jsonb_array_elements(r.responses) answer
        where answer->>'responseStatus' = 'answered'), 0) as answered,
      case when jsonb_typeof(r.plan->'itemIds') = 'array' then jsonb_array_length(r.plan->'itemIds') end as planned,
      coalesce(jsonb_array_length(r.media_failures), 0) as media_failures,
      coalesce(help.pending, '[]'::jsonb) as pending_help
    from public.student_focus_session_members m
    left join public.literacy_mock_runs r on r.session_id = m.session_id and r.student_id = m.student_id
    left join lateral (
      select jsonb_agg(jsonb_build_object('questionId', q.question_id, 'prompt', q.prompt) order by q.question_id) as pending
      from (
        select request.question_id,
          (select p.payload#>>'{itemSnapshot,prompt}' from public.literacy_mock_events p
           where p.session_id = p_session_id and p.student_id = m.student_id and p.question_id = request.question_id
             and p.event_type = 'presented' order by p.event_id limit 1) as prompt
        from (select distinct e.question_id from public.literacy_mock_events e
          where e.session_id = p_session_id and e.student_id = m.student_id and e.event_type = 'help_requested') request
        where public.lp_literacy_mock_help(p_session_id, m.student_id, request.question_id)->>'pending' = 'true'
      ) q
    ) help on r.student_id is not null and v_mock->>'state' <> 'completed'
    where m.session_id = p_session_id
  )
  select coalesce(jsonb_agg(to_jsonb(device) || jsonb_build_object('connected',
           coalesce(device.last_seen_at > v_now - interval '6 seconds', false)) order by device.student_id), '[]'::jsonb),
    count(*) filter (where receipt_state in ('awaiting_connection','device_open')),
    count(*) filter (where receipt_state = 'received'), count(*) filter (where receipt_state = 'expired')
    into v_members, v_pending, v_received, v_expired from per_device device;

  return json_build_object('ok', true, 'session', json_build_object(
    'id', v_session.id, 'class_id', v_session.class_id, 'content_version', v_session.content_version,
    'started_at', v_session.started_at, 'expires_at', v_session.expires_at, 'status', v_session.status,
    'mock', v_mock || jsonb_build_object('collection_pending_count', v_pending,
      'collection_received_count', v_received, 'collection_expired_count', v_expired)), 'members', v_members);
end;
$$;

revoke all on function public.teacher_get_literacy_mock_status(uuid) from public, anon, authenticated;
grant execute on function public.teacher_get_literacy_mock_status(uuid) to authenticated;

commit;
