-- Re-assert the complete callable-function boundary after the school-linked
-- guardian portal. Family access stays invitation-bound and separate from the
-- approved-teacher RPC surface.
-- Every SECURITY DEFINER function is private first, then only the reviewed
-- anonymous and authenticated RPC surface is granted back.

begin;

drop function if exists public.list_school_names();
drop function if exists public.student_list_schools();
drop function if exists public.student_list_classes(uuid);
drop function if exists public.student_list_students(uuid);
drop function if exists public.student_set_password(uuid, text);
drop function if exists public.student_set_password(uuid, text, text);
drop function if exists public.student_login(uuid, text);
drop function if exists public.student_class_by_code(text);
drop function if exists public.student_log_activity(text, text, text, text, jsonb);

do $security_boundary$
declare
  function_row record;
begin
  for function_row in
    select procedure.oid::regprocedure as signature
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.prosecdef
  loop
    execute format(
      'revoke execute on function %s from public, anon, authenticated',
      function_row.signature
    );
  end loop;
end
$security_boundary$;

revoke all on table public.teacher_intervention_events
  from public, anon, authenticated;
grant select on table public.teacher_intervention_events to authenticated;
revoke all on table public.teacher_interventions
  from public, anon, authenticated;
grant select on table public.teacher_interventions to authenticated;
revoke all on table public.teacher_account_decision_events
  from public, anon, authenticated;
grant select on table public.teacher_account_decision_events to authenticated;
create or replace function public.assert_current_actor_teacher_access()
returns void
language plpgsql volatile
set search_path = public
as $$
begin
  if not public.current_actor_has_teacher_access() then
    raise exception using
      errcode = '42501',
      message = 'An approved teacher account is required.';
  end if;
end;
$$;

revoke all on function public.assert_current_actor_teacher_access()
  from public, anon, authenticated;

-- Anonymous-safe learner and diagnostic RPCs.
grant execute on function public.guardian_invite_preview(text) to anon, authenticated;
grant execute on function public.search_school_names(text) to anon, authenticated;
grant execute on function public.student_class_by_code(text, text) to anon, authenticated;
grant execute on function public.student_login(uuid, text, text, text) to anon, authenticated;
grant execute on function public.student_get_progress(text) to anon, authenticated;
grant execute on function public.student_save_progress(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.student_log_activity_v2(
  text, text, text, text, text, jsonb, timestamptz, integer
) to anon, authenticated;
grant execute on function public.student_report_activity_sync_health(
  text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) to anon, authenticated;
grant execute on function public.student_get_reading_session(text, integer, boolean)
  to anon, authenticated;
grant execute on function public.student_get_live_lesson(text, integer, boolean)
  to anon, authenticated;
grant execute on function public.student_submit_live_response(text, uuid, text, jsonb, text)
  to anon, authenticated;
grant execute on function public.student_list_press_projects(text) to anon, authenticated;
grant execute on function public.student_save_book_revision(text, uuid, uuid, text, jsonb, jsonb)
  to anon, authenticated;
grant execute on function public.student_submit_book_revision(text, uuid, uuid)
  to anon, authenticated;
grant execute on function public.student_read_class_press_library(text)
  to anon, authenticated;
grant execute on function public.get_game_leaderboard(text, integer) to anon, authenticated;
grant execute on function public.report_app_error(
  uuid, text, text, text, text, text, text, text[], numeric
) to anon, authenticated;
grant execute on function public.report_assessment_question(
  text, uuid, text, uuid, jsonb
) to anon, authenticated;

-- Authenticated teacher and administrator RPCs.
grant execute on function public.guardian_accept_invite(text, text, text, text) to authenticated;
grant execute on function public.guardian_get_portal() to authenticated;
grant execute on function public.guardian_update_preferences(text, boolean) to authenticated;
grant execute on function public.guardian_record_report_event(uuid, text) to authenticated;
grant execute on function public.is_app_admin(uuid) to authenticated;
grant execute on function public.find_or_create_school(text) to authenticated;
grant execute on function public.teacher_set_school(text) to authenticated;
grant execute on function public.teacher_create_guardian_invite(uuid, text, integer) to authenticated;
grant execute on function public.teacher_list_guardian_access(uuid) to authenticated;
grant execute on function public.teacher_cancel_guardian_invite(uuid) to authenticated;
grant execute on function public.teacher_revoke_guardian_access(uuid, uuid) to authenticated;
grant execute on function public.teacher_release_family_report(uuid, text, jsonb) to authenticated;
grant execute on function public.teacher_withdraw_family_report(uuid) to authenticated;
grant execute on function public.set_app_config(text, jsonb) to authenticated;
grant execute on function public.teacher_set_class_leaderboard_scope(uuid, text) to authenticated;
grant execute on function public.teacher_set_student_archived(uuid, uuid, boolean) to authenticated;
grant execute on function public.teacher_transfer_student(uuid, uuid, uuid) to authenticated;
grant execute on function public.teacher_set_student_symbol_password(uuid, text, timestamptz) to authenticated;
grant execute on function public.teacher_reset_student_progress(uuid, timestamptz) to authenticated;
grant execute on function public.teacher_delete_saved_assessment_report(text) to authenticated;
grant execute on function public.teacher_delete_empty_class(uuid) to authenticated;
grant execute on function public.teacher_save_instructional_group(uuid, text, jsonb, uuid[], jsonb) to authenticated;
grant execute on function public.teacher_review_instructional_group(uuid, uuid[], jsonb) to authenticated;
grant execute on function public.teacher_assign_instructional_group_follow_up(uuid, text, text, date) to authenticated;
grant execute on function public.teacher_create_insight_intervention(
  text, uuid, jsonb, uuid[], text[], text, text, date
) to authenticated;
grant execute on function public.teacher_record_insight_observation(
  uuid, jsonb, uuid[], text, text, text, date
) to authenticated;
grant execute on function public.teacher_regenerate_class_code(uuid) to authenticated;
grant execute on function public.teacher_set_class_code_expiry(uuid, timestamptz) to authenticated;
grant execute on function public.teacher_class_access_summary(uuid) to authenticated;
grant execute on function public.teacher_class_access_log(uuid, integer) to authenticated;
grant execute on function public.teacher_create_intervention_plan(
  uuid, text, text, uuid[], text, text, date
) to authenticated;
grant execute on function public.teacher_update_planned_intervention(
  uuid, text, text, uuid[], text, text, date
) to authenticated;
grant execute on function public.teacher_delete_planned_intervention(uuid) to authenticated;
grant execute on function public.teacher_mark_intervention_delivered(uuid) to authenticated;
grant execute on function public.teacher_record_intervention_outcome(uuid, text, text) to authenticated;
grant execute on function public.teacher_review_intervention(uuid, date) to authenticated;
grant execute on function public.teacher_cancel_intervention(uuid, text) to authenticated;
grant execute on function public.teacher_create_intervention_follow_up(
  uuid, text, text, uuid[], text, text, date
) to authenticated;
grant execute on function public.teacher_start_reading_session(
  uuid, text, integer[], uuid[], text
) to authenticated;
grant execute on function public.teacher_set_reading_session_page(uuid, integer) to authenticated;
grant execute on function public.teacher_end_reading_session(uuid) to authenticated;
grant execute on function public.teacher_get_reading_session_presence(uuid) to authenticated;
grant execute on function public.teacher_save_reading_marks(
  uuid, uuid, integer, jsonb, text
) to authenticated;
grant execute on function public.teacher_start_live_lesson(
  uuid, uuid[], text, text, jsonb, text
) to authenticated;
grant execute on function public.teacher_set_live_lesson_slide(uuid, integer, text)
  to authenticated;
grant execute on function public.teacher_get_live_lesson_snapshot(uuid)
  to authenticated;
grant execute on function public.teacher_get_active_live_lesson()
  to authenticated;
grant execute on function public.teacher_end_live_lesson(uuid)
  to authenticated;
grant execute on function public.teacher_create_worksheet_instance(uuid, uuid[], jsonb) to authenticated;
grant execute on function public.teacher_create_press_project(uuid, uuid[], jsonb) to authenticated;
grant execute on function public.teacher_list_press_work(uuid) to authenticated;
grant execute on function public.teacher_review_book_revision(uuid, uuid, text, jsonb) to authenticated;
grant execute on function public.teacher_resolve_worksheet_code(text) to authenticated;
grant execute on function public.teacher_record_worksheet_observation(uuid, text, jsonb, text, uuid) to authenticated;
grant execute on function public.teacher_read_worksheet_history(uuid) to authenticated;
grant execute on function public.teacher_close_worksheet_instance(uuid) to authenticated;
grant execute on function public.teacher_create_lesson_plan(
  uuid, uuid, uuid[], jsonb, jsonb, timestamptz
) to authenticated;
grant execute on function public.teacher_read_lesson_plan(uuid) to authenticated;
grant execute on function public.teacher_update_draft_lesson_plan(
  uuid, integer, uuid[], jsonb, timestamptz
) to authenticated;
grant execute on function public.teacher_record_lesson_delivery(
  uuid, text, uuid[], text, text, jsonb
) to authenticated;
grant execute on function public.admin_recent_error_events(integer) to authenticated;
grant execute on function public.admin_error_monitor_summary() to authenticated;
grant execute on function public.admin_purge_expired_error_events() to authenticated;
grant execute on function public.admin_review_assessment_question_report(uuid, text, text) to authenticated;
grant execute on function public.admin_set_teacher_account_status(uuid, text, text) to authenticated;
grant execute on function public.teacher_export_learner_data(uuid, text, text) to authenticated;
grant execute on function public.teacher_list_learner_data_rights(uuid) to authenticated;
grant execute on function public.teacher_prepare_learner_deletion(uuid, text, text) to authenticated;
grant execute on function public.teacher_delete_learner_data_staged(uuid, uuid, text, text) to authenticated;
grant execute on function public.teacher_complete_learner_deletion(uuid, text, jsonb) to authenticated;
grant execute on function public.teacher_get_learner_deletion_status(uuid, text) to authenticated;
grant execute on function public.admin_get_school_retention_policy(uuid) to authenticated;
grant execute on function public.admin_save_school_retention_policy(
  uuid, integer, integer, text, integer, integer, integer
) to authenticated;
grant execute on function public.admin_preview_school_retention(uuid) to authenticated;
grant execute on function public.admin_list_deletion_propagation(uuid) to authenticated;
grant execute on function public.admin_verify_deletion_propagation(uuid, text, text) to authenticated;
grant execute on function public.admin_run_school_retention(uuid, text) to authenticated;

-- The inventory is exact. Every authenticated teacher RPC must also execute
-- the approved-account guard as its first PL/pgSQL statement.
do $guard_teacher_rpcs$
declare
  v_expected constant text[] := array[
    'teacher_assign_instructional_group_follow_up(uuid,text,text,date)',
    'teacher_cancel_guardian_invite(uuid)',
    'teacher_cancel_intervention(uuid,text)',
    'teacher_class_access_log(uuid,integer)',
    'teacher_class_access_summary(uuid)',
    'teacher_close_worksheet_instance(uuid)',
    'teacher_complete_learner_deletion(uuid,text,jsonb)',
    'teacher_create_insight_intervention(text,uuid,jsonb,uuid[],text[],text,text,date)',
    'teacher_create_guardian_invite(uuid,text,integer)',
    'teacher_create_intervention_follow_up(uuid,text,text,uuid[],text,text,date)',
    'teacher_create_intervention_plan(uuid,text,text,uuid[],text,text,date)',
    'teacher_create_lesson_plan(uuid,uuid,uuid[],jsonb,jsonb,timestamp with time zone)',
    'teacher_create_press_project(uuid,uuid[],jsonb)',
    'teacher_create_worksheet_instance(uuid,uuid[],jsonb)',
    'teacher_delete_empty_class(uuid)',
    'teacher_delete_learner_data_staged(uuid,uuid,text,text)',
    'teacher_delete_planned_intervention(uuid)',
    'teacher_delete_saved_assessment_report(text)',
    'teacher_end_live_lesson(uuid)',
    'teacher_end_reading_session(uuid)',
    'teacher_export_learner_data(uuid,text,text)',
    'teacher_get_active_live_lesson()',
    'teacher_get_learner_deletion_status(uuid,text)',
    'teacher_get_live_lesson_snapshot(uuid)',
    'teacher_get_reading_session_presence(uuid)',
    'teacher_list_learner_data_rights(uuid)',
    'teacher_list_guardian_access(uuid)',
    'teacher_list_press_work(uuid)',
    'teacher_mark_intervention_delivered(uuid)',
    'teacher_prepare_learner_deletion(uuid,text,text)',
    'teacher_read_lesson_plan(uuid)',
    'teacher_read_worksheet_history(uuid)',
    'teacher_record_insight_observation(uuid,jsonb,uuid[],text,text,text,date)',
    'teacher_record_intervention_outcome(uuid,text,text)',
    'teacher_record_lesson_delivery(uuid,text,uuid[],text,text,jsonb)',
    'teacher_record_worksheet_observation(uuid,text,jsonb,text,uuid)',
    'teacher_regenerate_class_code(uuid)',
    'teacher_release_family_report(uuid,text,jsonb)',
    'teacher_reset_student_progress(uuid,timestamp with time zone)',
    'teacher_resolve_worksheet_code(text)',
    'teacher_review_book_revision(uuid,uuid,text,jsonb)',
    'teacher_review_instructional_group(uuid,uuid[],jsonb)',
    'teacher_review_intervention(uuid,date)',
    'teacher_revoke_guardian_access(uuid,uuid)',
    'teacher_save_instructional_group(uuid,text,jsonb,uuid[],jsonb)',
    'teacher_save_reading_marks(uuid,uuid,integer,jsonb,text)',
    'teacher_set_class_code_expiry(uuid,timestamp with time zone)',
    'teacher_set_class_leaderboard_scope(uuid,text)',
    'teacher_set_live_lesson_slide(uuid,integer,text)',
    'teacher_set_reading_session_page(uuid,integer)',
    'teacher_set_school(text)',
    'teacher_set_student_archived(uuid,uuid,boolean)',
    'teacher_set_student_symbol_password(uuid,text,timestamp with time zone)',
    'teacher_start_live_lesson(uuid,uuid[],text,text,jsonb,text)',
    'teacher_start_reading_session(uuid,text,integer[],uuid[],text)',
    'teacher_transfer_student(uuid,uuid,uuid)',
    'teacher_update_draft_lesson_plan(uuid,integer,uuid[],jsonb,timestamp with time zone)',
    'teacher_update_planned_intervention(uuid,text,text,uuid[],text,text,date)',
    'teacher_withdraw_family_report(uuid)'
  ];
  v_expected_sorted text[];
  v_actual text[];
  v_signature text;
  v_function regprocedure;
  v_definition text;
  v_entry_marker constant text := E'\nbegin\n';
  v_guarded_entry constant text :=
    E'\nbegin\n  perform public.assert_current_actor_teacher_access();\n';
  v_entry_at integer;
begin
  select array_agg(signature order by signature)
  into v_expected_sorted
  from unnest(v_expected) signature;

  select coalesce(
    array_agg(procedure.oid::regprocedure::text order by procedure.oid::regprocedure::text),
    '{}'::text[]
  ) into v_actual
  from pg_proc procedure
  join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.prosecdef
    and procedure.proname like 'teacher\_%' escape '\'
    and has_function_privilege('authenticated', procedure.oid, 'EXECUTE');

  if v_actual is distinct from v_expected_sorted then
    raise exception 'Authenticated teacher RPC inventory drift. Expected %, found %.',
      v_expected_sorted, v_actual;
  end if;

  foreach v_signature in array v_expected loop
    if v_signature = 'teacher_delete_learner_data_staged(uuid,uuid,text,text)' then
      continue;
    end if;
    v_function := to_regprocedure('public.' || v_signature);
    v_definition := pg_get_functiondef(v_function);
    if position(v_guarded_entry in v_definition) > 0 then
      continue;
    end if;
    v_entry_at := position(v_entry_marker in v_definition);
    if v_entry_at = 0 then
      raise exception 'Teacher RPC % has no unambiguous entry block.', v_signature;
    end if;
    v_definition := overlay(
      v_definition placing v_guarded_entry
      from v_entry_at for char_length(v_entry_marker)
    );
    execute v_definition;
  end loop;

  v_function := to_regprocedure(
    'public.perform_verified_learner_deletion(uuid,uuid,text,text,boolean)'
  );
  v_definition := pg_get_functiondef(v_function);
  if position(v_guarded_entry in v_definition) = 0 then
    v_entry_at := position(v_entry_marker in v_definition);
    if v_entry_at = 0 then
      raise exception 'Verified learner deletion has no unambiguous entry block.';
    end if;
    v_definition := overlay(
      v_definition placing v_guarded_entry
      from v_entry_at for char_length(v_entry_marker)
    );
    execute v_definition;
  end if;
end
$guard_teacher_rpcs$;

notify pgrst, 'reload schema';

commit;
