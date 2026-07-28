-- Reassert the complete database API boundary after the owned student-transfer
-- RPC. PostgreSQL grants EXECUTE on new functions to PUBLIC by default, so the
-- last SECURITY DEFINER migration always revokes every role first and restores
-- only the explicitly reviewed product surface.

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

-- Anonymous-safe learner RPCs.
grant execute on function public.student_class_by_code(text, text)
  to anon, authenticated;
grant execute on function public.student_login(uuid, text, text, text)
  to anon, authenticated;
grant execute on function public.student_get_progress(text)
  to anon, authenticated;
grant execute on function public.student_save_progress(text, text, text, jsonb)
  to anon, authenticated;
grant execute on function public.student_log_activity_v2(
  text, text, text, text, text, jsonb, timestamptz, integer
) to anon, authenticated;
grant execute on function public.student_report_activity_sync_health(
  text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamptz
) to anon, authenticated;
grant execute on function public.get_game_leaderboard(text, integer)
  to anon, authenticated;
grant execute on function public.report_app_error(
  uuid, text, text, text, text, text, text, text[], numeric
) to anon, authenticated;
grant execute on function public.list_school_names()
  to anon, authenticated;

-- Authenticated teacher and administrator RPCs.
grant execute on function public.is_app_admin(uuid)
  to authenticated;
grant execute on function public.find_or_create_school(text)
  to authenticated;
grant execute on function public.teacher_set_school(text)
  to authenticated;
grant execute on function public.set_app_config(text, jsonb)
  to authenticated;
grant execute on function public.teacher_set_class_leaderboard_scope(uuid, text)
  to authenticated;
grant execute on function public.teacher_set_student_archived(uuid, uuid, boolean)
  to authenticated;
grant execute on function public.teacher_transfer_student(uuid, uuid, uuid)
  to authenticated;
grant execute on function public.teacher_set_student_symbol_password(
  uuid, text, timestamptz
) to authenticated;
grant execute on function public.teacher_reset_student_progress(uuid, timestamptz)
  to authenticated;
grant execute on function public.teacher_delete_saved_assessment_report(text)
  to authenticated;
grant execute on function public.teacher_delete_empty_class(uuid)
  to authenticated;
grant execute on function public.teacher_save_instructional_group(
  uuid, text, jsonb, uuid[], jsonb
) to authenticated;
grant execute on function public.teacher_review_instructional_group(
  uuid, uuid[], jsonb
) to authenticated;
grant execute on function public.teacher_assign_instructional_group_follow_up(
  uuid, text, text, date
) to authenticated;
grant execute on function public.teacher_create_insight_intervention(
  text, uuid, jsonb, uuid[], text[], text, text, date
) to authenticated;
grant execute on function public.teacher_record_insight_observation(
  uuid, jsonb, uuid[], text, text, text, date
) to authenticated;
grant execute on function public.teacher_regenerate_class_code(uuid)
  to authenticated;
grant execute on function public.teacher_set_class_code_expiry(uuid, timestamptz)
  to authenticated;
grant execute on function public.teacher_class_access_summary(uuid)
  to authenticated;
grant execute on function public.teacher_class_access_log(uuid, integer)
  to authenticated;
grant execute on function public.admin_recent_error_events(integer)
  to authenticated;
grant execute on function public.admin_error_monitor_summary()
  to authenticated;
grant execute on function public.admin_purge_expired_error_events()
  to authenticated;
grant execute on function public.teacher_export_learner_data(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_list_learner_data_rights(uuid)
  to authenticated;
grant execute on function public.teacher_prepare_learner_deletion(uuid, text, text)
  to authenticated;
grant execute on function public.teacher_delete_learner_data_staged(
  uuid, uuid, text, text
) to authenticated;
grant execute on function public.teacher_complete_learner_deletion(uuid, text, jsonb)
  to authenticated;
grant execute on function public.teacher_get_learner_deletion_status(uuid, text)
  to authenticated;
grant execute on function public.admin_get_school_retention_policy(uuid)
  to authenticated;
grant execute on function public.admin_save_school_retention_policy(
  uuid, integer, integer, text, integer, integer, integer
) to authenticated;
grant execute on function public.admin_preview_school_retention(uuid)
  to authenticated;
grant execute on function public.admin_list_deletion_propagation(uuid)
  to authenticated;
grant execute on function public.admin_verify_deletion_propagation(
  uuid, text, text
) to authenticated;
grant execute on function public.admin_run_school_retention(uuid, text)
  to authenticated;

notify pgrst, 'reload schema';
