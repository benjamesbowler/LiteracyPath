import { FACADE_RPCS } from "../src/data/boundaries/facade.js";

/**
 * Parameter names for every PostgREST function the browser is allowed to call.
 *
 * PostgREST resolves functions by the supplied JSON keys, so these names are
 * part of the live API contract. The verifier sends null values deliberately:
 * input validation or permission denial proves that the function is visible
 * without allowing the check to make a successful state-changing call.
 */
export const LIVE_DATABASE_FUNCTIONS = Object.freeze({
  admin_error_monitor_summary: [],
  admin_get_school_retention_policy: ["p_school_id"],
  admin_list_deletion_propagation: ["p_school_id"],
  admin_preview_school_retention: ["p_school_id"],
  admin_recent_error_events: ["p_limit"],
  admin_review_assessment_question_report: ["p_report_id", "p_decision", "p_notes"],
  admin_run_school_retention: ["p_school_id", "p_confirmation"],
  admin_save_school_retention_policy: [
    "p_school_id",
    "p_inactive_after_days",
    "p_archived_delete_after_days",
    "p_end_of_year_action",
    "p_academic_year_end_month",
    "p_provider_expiry_days",
    "p_backup_expiry_days"
  ],
  admin_set_teacher_account_status: ["p_account_id", "p_status", "p_rejection_reason"],
  admin_verify_deletion_propagation: ["p_request_id", "p_evidence_reference", "p_confirmation"],
  find_or_create_school: ["p_name"],
  get_game_leaderboard: ["p_student_token", "p_limit"],
  guardian_accept_invite: ["p_token", "p_display_name", "p_terms_version", "p_privacy_version"],
  guardian_get_portal: [],
  guardian_invite_preview: ["p_token"],
  guardian_record_report_event: ["p_report_id", "p_event_type"],
  guardian_update_preferences: ["p_preferred_language", "p_report_notifications"],
  report_app_error: ["p_client_event_id", "p_release_id", "p_fingerprint", "p_severity", "p_surface", "p_error_type", "p_source", "p_stack_frames", "p_sample_rate"],
  report_assessment_question: ["p_student_token", "p_student_id", "p_flag_type", "p_report_id", "p_question_snapshot"],
  search_school_names: ["p_prefix"],
  set_app_config: ["p_key", "p_value"],
  student_class_by_code: ["p_code", "p_device_id"],
  student_complete_focus_assessment: ["p_token", "p_session_id", "p_attempt"],
  student_complete_focus_session: ["p_token", "p_session_id"],
  student_get_focus_session: ["p_token", "p_current_view", "p_content_ok"],
  student_get_progress: ["p_token"],
  student_get_reading_session: ["p_token", "p_page_index", "p_content_ok"],
  student_log_activity_v2: ["p_token", "p_client_event_id", "p_area", "p_item_id", "p_event", "p_payload", "p_occurred_at", "p_delivery_attempts"],
  student_login: ["p_student_id", "p_sequence", "p_device_id", "p_code"],
  student_report_activity_sync_health: ["p_token", "p_device_id", "p_attempted", "p_delivered", "p_recovered", "p_storage_failures", "p_pending", "p_lost", "p_oldest_pending_at"],
  student_save_focus_assessment_answer: ["p_token", "p_session_id", "p_answer"],
  student_save_focus_item_mastery: ["p_token", "p_session_id", "p_item_mastery"],
  student_save_progress: ["p_token", "p_area", "p_key", "p_payload"],
  teacher_assign_instructional_group_follow_up: ["p_group_id", "p_owner_label", "p_activity", "p_planned_for"],
  teacher_cancel_guardian_invite: ["p_invite_id"],
  teacher_cancel_intervention: ["p_intervention_id", "p_reason"],
  teacher_class_access_log: ["p_class_id", "p_limit"],
  teacher_class_access_summary: ["p_class_id"],
  teacher_complete_learner_deletion: ["p_request_id", "p_subject_ref", "p_cleanup_proof"],
  teacher_create_demo_class: [],
  teacher_create_guardian_invite: ["p_student_id", "p_guardian_email", "p_expires_days"],
  teacher_create_insight_intervention: ["p_action_type", "p_class_id", "p_insight", "p_student_ids", "p_targets", "p_owner_label", "p_activity", "p_planned_for"],
  teacher_create_intervention_follow_up: ["p_parent_intervention_id", "p_owner_label", "p_group_label", "p_student_ids", "p_focus", "p_activity", "p_planned_for"],
  teacher_create_intervention_plan: ["p_class_id", "p_owner_label", "p_group_label", "p_student_ids", "p_focus", "p_activity", "p_planned_for"],
  teacher_create_lesson_plan: ["p_class_id", "p_intervention_id", "p_learner_ids", "p_recipe", "p_evidence_source", "p_scheduled_for"],
  teacher_delete_empty_class: ["p_class_id"],
  teacher_delete_learner_data_staged: ["p_request_id", "p_student_id", "p_subject_ref", "p_confirmation"],
  teacher_delete_planned_intervention: ["p_intervention_id"],
  teacher_delete_saved_assessment_report: ["p_report_id"],
  teacher_end_reading_session: ["p_session_id"],
  teacher_end_student_focus_session: ["p_session_id", "p_end_action"],
  teacher_export_learner_data: ["p_student_id", "p_requester_role", "p_verification_method"],
  teacher_get_learner_deletion_status: ["p_request_id", "p_subject_ref"],
  teacher_get_reading_session_presence: ["p_session_id"],
  teacher_get_student_focus_session: ["p_session_id"],
  teacher_list_learner_data_rights: ["p_student_id"],
  teacher_list_guardian_access: ["p_student_id"],
  teacher_mark_intervention_delivered: ["p_intervention_id"],
  teacher_prepare_learner_deletion: ["p_student_id", "p_requester_role", "p_verification_method"],
  teacher_read_lesson_plan: ["p_plan_id"],
  teacher_record_insight_observation: ["p_class_id", "p_insight", "p_student_ids", "p_note", "p_owner_label", "p_follow_up_activity", "p_follow_up_on"],
  teacher_record_intervention_outcome: ["p_intervention_id", "p_outcome", "p_outcome_note"],
  teacher_record_lesson_delivery: ["p_plan_id", "p_client_event_id", "p_learner_ids", "p_completion_state", "p_notes", "p_observed_support"],
  teacher_regenerate_class_code: ["p_class_id"],
  teacher_release_family_report: ["p_student_id", "p_title", "p_snapshot"],
  teacher_reset_student_progress: ["p_student_id", "p_reset_at"],
  teacher_review_instructional_group: ["p_group_id", "p_student_ids", "p_evidence_snapshot"],
  teacher_review_intervention: ["p_intervention_id", "p_next_review_on"],
  teacher_revoke_guardian_access: ["p_student_id", "p_guardian_user_id"],
  teacher_save_instructional_group: ["p_class_id", "p_name", "p_criteria", "p_student_ids", "p_evidence_snapshot"],
  teacher_save_reading_marks: ["p_session_id", "p_student_id", "p_page_index", "p_marks", "p_client_event_id"],
  teacher_set_class_code_expiry: ["p_class_id", "p_expires_at"],
  teacher_set_class_leaderboard_scope: ["p_class_id", "p_scope"],
  teacher_set_reading_session_page: ["p_session_id", "p_page_index"],
  teacher_set_school: ["p_school_name"],
  teacher_set_student_archived: ["p_student_id", "p_class_id", "p_archived"],
  teacher_set_student_symbol_password: ["p_student_id", "p_sequence", "p_set_at"],
  teacher_start_reading_session: ["p_class_id", "p_book_id", "p_page_numbers", "p_student_ids", "p_content_version"],
  teacher_start_student_focus_session: ["p_class_id", "p_target", "p_student_ids", "p_assignments", "p_duration_minutes", "p_content_version", "p_whole_class"],
  teacher_transfer_student: ["p_student_id", "p_source_class_id", "p_target_class_id"],
  teacher_update_draft_lesson_plan: ["p_plan_id", "p_expected_revision", "p_learner_ids", "p_recipe", "p_scheduled_for"],
  teacher_update_planned_intervention: ["p_intervention_id", "p_owner_label", "p_group_label", "p_student_ids", "p_focus", "p_activity", "p_planned_for"],
  teacher_withdraw_family_report: ["p_report_id"]
});

export function compareLiveContractToFacade() {
  const facade = new Set(FACADE_RPCS);
  const contract = new Set(Object.keys(LIVE_DATABASE_FUNCTIONS));
  return {
    missing: FACADE_RPCS.filter(name => !contract.has(name)),
    stale: Object.keys(LIVE_DATABASE_FUNCTIONS).filter(name => !facade.has(name))
  };
}

const drift = compareLiveContractToFacade();
if (drift.missing.length || drift.stale.length) {
  throw new Error(
    `Live database contract drift. Missing: ${drift.missing.join(", ") || "none"}. `
    + `Stale: ${drift.stale.join(", ") || "none"}.`
  );
}
