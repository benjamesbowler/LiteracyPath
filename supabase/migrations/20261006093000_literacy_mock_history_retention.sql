-- Mock reports are learner assessment history. The existing school retention
-- policy and learner deletion own their lifetime, not 30-day operational cleanup.
begin;
create index literacy_mock_runs_student_history_idx on public.literacy_mock_runs(student_id,updated_at desc);

create or replace function public.admin_purge_expired_error_events()
returns bigint language plpgsql volatile security definer set search_path='' as $$
declare v_deleted bigint:=0; v_count bigint:=0;
begin
  if not public.is_app_admin(auth.uid()) then raise exception 'forbidden'; end if;
  delete from public.student_focus_sessions f
    where f.status='ended' and f.ended_at<now()-interval '30 days'
      and (not exists(select 1 from public.literacy_mock_sessions m where m.session_id=f.id)
        or not exists(select 1 from public.student_focus_session_members m where m.session_id=f.id));
  get diagnostics v_count=row_count; v_deleted:=v_deleted+v_count;
  delete from public.reading_sessions where status='ended' and ended_at<now()-interval '30 days';
  get diagnostics v_count=row_count; v_deleted:=v_deleted+v_count;
  delete from public.app_error_events where expires_at<=now();
  get diagnostics v_count=row_count; v_deleted:=v_deleted+v_count;
  return v_deleted;
end; $$;

alter function public.retention_last_learner_activity(uuid) rename to retention_last_learner_activity_before_mock;
create function public.retention_last_learner_activity(p_student_id uuid)
returns timestamptz language sql stable security definer set search_path='' as $$
  select greatest(public.retention_last_learner_activity_before_mock(p_student_id),
    (select max((response->>'serverReceivedAt')::timestamptz) from public.literacy_mock_runs r,
      jsonb_array_elements(r.responses||r.media_failures) response where r.student_id=p_student_id));
$$;

alter function public.teacher_export_learner_data(uuid,text,text) rename to teacher_export_learner_data_before_mock;
create function public.teacher_export_learner_data(p_student_id uuid,p_requester_role text,p_verification_method text)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare v_package jsonb;
begin
  -- Existing verified identity, requester authority, and audit path executes
  -- first. Only this pupil's evidence is appended: no classmates or raw tokens.
  v_package:=public.teacher_export_learner_data_before_mock(p_student_id,p_requester_role,p_verification_method);
  return v_package||jsonb_build_object('literacyMockAssessments',coalesce((select jsonb_agg(jsonb_build_object(
    'sessionId',f.id,'classId',f.class_id,'teacherId',f.teacher_id,'preparedAt',f.started_at,
    'state',w.state,'itemCount',w.item_count,'durationSeconds',w.duration_seconds,
    'startedAt',w.started_at,'endedAt',w.ended_at,'endReason',w.end_reason,
    'run',public.lp_literacy_mock_run_json(f.id,p_student_id)) order by f.started_at)
    from public.student_focus_sessions f join public.literacy_mock_sessions w on w.session_id=f.id
    join public.student_focus_session_members m on m.session_id=f.id where m.student_id=p_student_id),'[]'::jsonb));
end; $$;

revoke all on function public.retention_last_learner_activity_before_mock(uuid),public.retention_last_learner_activity(uuid),
  public.teacher_export_learner_data_before_mock(uuid,text,text) from public,anon,authenticated;
revoke all on function public.teacher_export_learner_data(uuid,text,text),public.admin_purge_expired_error_events() from public,anon,authenticated;
grant execute on function public.teacher_export_learner_data(uuid,text,text),public.admin_purge_expired_error_events() to authenticated;
notify pgrst,'reload schema';
commit;
