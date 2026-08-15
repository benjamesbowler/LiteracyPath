import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import {
  AUTHENTICATED_ONLY_SECURITY_DEFINER_RPCS,
  TEACHER_ACCOUNT_GUARDED_SECURITY_DEFINER_RPCS,
  auditSecurityDefinerCatalog
} from "./databasePolicyContract.mjs";
import { auditHostedSchemaDriftCatalog } from "./hostedSchemaDriftContract.mjs";
import { isApprovedAuditDatabaseUrl } from "./seedAuditSchool.mjs";
import { verifyAuditSchoolLive } from "./verifyAuditSchoolLive.mjs";
import { verifyLeaderboardPrivacyLive } from "./verifyLeaderboardPrivacyLive.mjs";

const EXPECTED = Object.freeze({
  schoolId: "20000000-0000-4000-8000-000000000001",
  schoolName: "[AUDIT ONLY] LiteracyPath Seed School",
  teacherA: {
    userId: "10000000-0000-4000-8000-000000000001",
    email: "audit-teacher-a@literacypath.invalid",
    classId: "30000000-0000-4000-8000-000000000001",
    studentId: "40000000-0000-4000-8000-000000000001"
  },
  teacherB: {
    email: "audit-teacher-b@literacypath.invalid",
    classId: "30000000-0000-4000-8000-000000000002",
    studentId: "40000000-0000-4000-8000-000000000014"
  },
  adminEmail: "audit-admin@literacypath.invalid",
  adminUserId: "12000000-0000-4000-8000-000000000001",
  studentPassword: "111"
});

export const AUTH_ONLY_PROBE_ARGS = Object.freeze({
  "admin_error_monitor_summary()": {},
  "admin_get_school_retention_policy(uuid)": { p_school_id: EXPECTED.schoolId },
  "admin_list_deletion_propagation(uuid)": { p_school_id: EXPECTED.schoolId },
  "admin_preview_school_retention(uuid)": { p_school_id: EXPECTED.schoolId },
  "admin_purge_expired_error_events()": {},
  "admin_recent_error_events(integer)": { p_limit: 1 },
  "admin_review_assessment_question_report(uuid, text, text)": {
    p_report_id: "00000000-0000-0000-0000-000000000000",
    p_decision: "no_change_needed",
    p_notes: "Anonymous access probe"
  },
  "admin_run_school_retention(uuid, text)": {
    p_school_id: EXPECTED.schoolId,
    p_confirmation: "DO NOT RUN"
  },
  "admin_save_school_retention_policy(uuid, integer, integer, text, integer, integer, integer)": {
    p_school_id: EXPECTED.schoolId,
    p_inactive_after_days: 365,
    p_archived_delete_after_days: 365,
    p_end_of_year_action: "archive",
    p_academic_year_end_month: 7,
    p_provider_expiry_days: 30,
    p_backup_expiry_days: 90
  },
  "admin_set_teacher_account_status(uuid, text, text)": {
    p_account_id: "00000000-0000-0000-0000-000000000000",
    p_status: "approved",
    p_rejection_reason: null
  },
  "admin_verify_deletion_propagation(uuid, text, text)": {
    p_request_id: "00000000-0000-0000-0000-000000000000",
    p_evidence_reference: "none",
    p_confirmation: "DO NOT VERIFY"
  },
  "find_or_create_school(text)": { p_name: "Audit forbidden school" },
  "is_app_admin(uuid)": { check_user_id: EXPECTED.teacherA.studentId },
  "set_app_config(text, jsonb)": { p_key: "audit-forbidden", p_value: {} },
  "teacher_assign_instructional_group_follow_up(uuid, text, text, date)": {
    p_group_id: "00000000-0000-0000-0000-000000000000",
    p_owner_label: "Audit",
    p_activity: "Audit",
    p_planned_for: "2026-07-25"
  },
  "teacher_archive_maths_assignment(uuid, uuid)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_assignment_id: "00000000-0000-0000-0000-000000000000"
  },
  "teacher_duplicate_maths_assignment(uuid, uuid, timestamp with time zone)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_assignment_id: "00000000-0000-0000-0000-000000000000",
    p_due_at: null
  },
  "teacher_class_access_log(uuid, integer)": { p_class_id: EXPECTED.teacherA.classId, p_limit: 1 },
  "teacher_class_access_summary(uuid)": { p_class_id: EXPECTED.teacherA.classId },
  "teacher_close_worksheet_instance(uuid)": { p_instance_id: "00000000-0000-0000-0000-000000000000" },
  "teacher_create_insight_intervention(text, uuid, jsonb, uuid[], text[], text, text, date)": {
    p_action_type: "plan_small_group",
    p_class_id: EXPECTED.teacherA.classId,
    p_insight: {},
    p_student_ids: [],
    p_targets: [],
    p_owner_label: "Audit",
    p_activity: "Audit",
    p_planned_for: "2026-07-25"
  },
  "teacher_create_intervention_follow_up(uuid, text, text, uuid[], text, text, date)": {
    p_parent_intervention_id: "00000000-0000-0000-0000-000000000000",
    p_owner_label: "Audit",
    p_group_label: "Audit",
    p_student_ids: [],
    p_focus: "Audit",
    p_activity: "Audit",
    p_planned_for: "2026-07-25"
  },
  "teacher_create_intervention_plan(uuid, text, text, uuid[], text, text, date)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_owner_label: "Audit",
    p_group_label: "Audit",
    p_student_ids: [],
    p_focus: "Audit",
    p_activity: "Audit",
    p_planned_for: "2026-07-25"
  },
  "teacher_create_lesson_plan(uuid, uuid, uuid[], jsonb, jsonb, timestamp with time zone)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_intervention_id: null,
    p_learner_ids: [EXPECTED.teacherA.studentId],
    p_recipe: {},
    p_evidence_source: {},
    p_scheduled_for: null
  },
  "teacher_create_maths_assignment(uuid, text, text, text, text, uuid[], timestamp with time zone)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_skill_id: "F-N-COUNT-10",
    p_activity_type: "lesson",
    p_activity_id: "anonymous-probe",
    p_title: "Anonymous access probe",
    p_student_ids: [EXPECTED.teacherA.studentId],
    p_due_at: null
  },
  "teacher_create_press_project(uuid, uuid[], jsonb)": { p_class_id: EXPECTED.teacherA.classId, p_learner_ids: [EXPECTED.teacherA.studentId], p_project_rules: {} },
  "teacher_create_worksheet_instance(uuid, uuid[], jsonb)": { p_class_id: EXPECTED.teacherA.classId, p_learner_ids: [EXPECTED.teacherA.studentId], p_recipe: {} },
  "teacher_complete_learner_deletion(uuid, text, jsonb)": {
    p_request_id: "00000000-0000-0000-0000-000000000000",
    p_subject_ref: "0".repeat(64),
    p_cleanup_proof: {}
  },
  "teacher_delete_empty_class(uuid)": {
    p_class_id: EXPECTED.teacherA.classId
  },
  "teacher_delete_learner_data_staged(uuid, uuid, text, text)": {
    p_student_id: EXPECTED.teacherA.studentId,
    p_request_id: "00000000-0000-0000-0000-000000000000",
    p_subject_ref: "0".repeat(64),
    p_confirmation: "DO NOT DELETE"
  },
  "teacher_delete_planned_intervention(uuid)": {
    p_intervention_id: "00000000-0000-0000-0000-000000000000"
  },
  "teacher_delete_saved_assessment_report(text)": {
    p_report_id: "audit-forbidden"
  },
  "teacher_end_reading_session(uuid)": {
    p_session_id: "00000000-0000-0000-0000-000000000000"
  },
  "teacher_end_live_lesson(uuid)": {
    p_session_id: "00000000-0000-0000-0000-000000000000"
  },
  "teacher_export_learner_data(uuid, text, text)": {
    p_student_id: EXPECTED.teacherA.studentId,
    p_requester_role: "school",
    p_verification_method: "authorised_school_official"
  },
  "teacher_get_learner_deletion_status(uuid, text)": {
    p_request_id: "00000000-0000-0000-0000-000000000000",
    p_subject_ref: "0".repeat(64)
  },
  "teacher_get_active_live_lesson()": {},
  "teacher_get_reading_session_presence(uuid)": {
    p_session_id: "00000000-0000-0000-0000-000000000000"
  },
  "teacher_get_live_lesson_snapshot(uuid)": {
    p_session_id: "00000000-0000-0000-0000-000000000000"
  },
  "teacher_list_learner_data_rights(uuid)": { p_student_id: EXPECTED.teacherA.studentId },
  "teacher_list_maths_assignments(uuid, boolean)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_include_archived: false
  },
  "teacher_list_maths_media_issues(uuid, boolean)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_include_resolved: false
  },
  "teacher_list_press_work(uuid)": { p_class_id: EXPECTED.teacherA.classId },
  "teacher_mark_intervention_delivered(uuid)": {
    p_intervention_id: "00000000-0000-0000-0000-000000000000"
  },
  "teacher_prepare_learner_deletion(uuid, text, text)": {
    p_student_id: EXPECTED.teacherA.studentId,
    p_requester_role: "school",
    p_verification_method: "authorised_school_official"
  },
  "teacher_read_lesson_plan(uuid)": {
    p_plan_id: "00000000-0000-0000-0000-000000000000"
  },
  "teacher_read_maths_evidence(uuid, uuid, integer)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_student_id: EXPECTED.teacherA.studentId,
    p_limit: 1
  },
  "teacher_read_maths_evidence_page(uuid, uuid, integer, timestamp with time zone, uuid)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_student_id: EXPECTED.teacherA.studentId,
    p_limit: 1,
    p_before_occurred_at: null,
    p_before_id: null
  },
  "teacher_read_maths_evidence_filtered_page(uuid, uuid, timestamp with time zone, text, integer, timestamp with time zone, uuid)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_student_id: EXPECTED.teacherA.studentId,
    p_since: null,
    p_source: null,
    p_limit: 1,
    p_before_occurred_at: null,
    p_before_id: null
  },
  "teacher_read_worksheet_history(uuid)": { p_instance_id: "00000000-0000-0000-0000-000000000000" },
  "teacher_record_insight_observation(uuid, jsonb, uuid[], text, text, text, date)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_insight: {},
    p_student_ids: [],
    p_note: "Audit",
    p_owner_label: "Audit",
    p_follow_up_activity: "Audit",
    p_follow_up_on: "2026-07-25"
  },
  "teacher_record_intervention_outcome(uuid, text, text)": {
    p_intervention_id: "00000000-0000-0000-0000-000000000000",
    p_outcome: "effective",
    p_outcome_note: "Anonymous access probe"
  },
  "teacher_record_lesson_delivery(uuid, text, uuid[], text, text, jsonb)": {
    p_plan_id: "00000000-0000-0000-0000-000000000000",
    p_client_event_id: "anonymous-access-probe",
    p_learner_ids: [EXPECTED.teacherA.studentId],
    p_completion_state: "not_delivered",
    p_notes: "Anonymous access probe",
    p_observed_support: {}
  },
  "teacher_record_maths_evidence(uuid, uuid, text, text, text, jsonb, timestamp with time zone, text)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_student_id: EXPECTED.teacherA.studentId,
    p_client_event_id: "anonymous-maths-probe",
    p_skill_id: "F-N-COUNT-10",
    p_event_type: "teacher_observation",
    p_evidence: { schemaVersion: 1, observed: "anonymous probe" },
    p_occurred_at: "2026-08-12T00:00:00.000Z",
    p_content_version: "maths-audit-v1"
  },
  "teacher_report_maths_media_issue(text, text)": {
    p_audio_id: "anonymous-probe",
    p_reason: "playback_or_content_issue"
  },
  "teacher_read_maths_sync_health(uuid)": {
    p_class_id: EXPECTED.teacherA.classId
  },
  "teacher_record_worksheet_observation(uuid, text, jsonb, text, uuid)": { p_instance_id: "00000000-0000-0000-0000-000000000000", p_client_event_id: "anonymous-access-probe", p_marks: [], p_note: "", p_supersedes_batch_id: null },
  "teacher_regenerate_class_code(uuid)": { p_class_id: EXPECTED.teacherA.classId },
  "teacher_reset_student_progress(uuid, timestamp with time zone)": {
    p_student_id: EXPECTED.teacherA.studentId,
    p_reset_at: "2026-07-27T00:00:00.000Z"
  },
  "teacher_resolve_maths_media_issue(uuid, text)": {
    p_issue_id: "00000000-0000-0000-0000-000000000000",
    p_resolution: "not_reproducible"
  },
  "teacher_resolve_worksheet_code(text)": { p_code: "AAAAAAAA" },
  "teacher_review_instructional_group(uuid, uuid[], jsonb)": {
    p_group_id: "00000000-0000-0000-0000-000000000000",
    p_student_ids: [],
    p_evidence_snapshot: {}
  },
  "teacher_review_book_revision(uuid, uuid, text, jsonb)": { p_book_id: "00000000-0000-0000-0000-000000000000", p_revision_id: "00000000-0000-0000-0000-000000000000", p_decision: "approved", p_review: {} },
  "teacher_review_intervention(uuid, date)": {
    p_intervention_id: "00000000-0000-0000-0000-000000000000",
    p_next_review_on: "2026-07-25"
  },
  "teacher_save_instructional_group(uuid, text, jsonb, uuid[], jsonb)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_name: "Audit",
    p_criteria: {},
    p_student_ids: [],
    p_evidence_snapshot: {}
  },
  "teacher_save_reading_marks(uuid, uuid, integer, jsonb, text)": {
    p_session_id: "00000000-0000-0000-0000-000000000000",
    p_student_id: EXPECTED.teacherA.studentId,
    p_page_index: 0,
    p_marks: {},
    p_client_event_id: "anonymous-access-probe"
  },
  "teacher_set_reading_session_page(uuid, integer)": {
    p_session_id: "00000000-0000-0000-0000-000000000000",
    p_page_index: 0
  },
  "teacher_set_live_lesson_slide(uuid, integer, text)": {
    p_session_id: "00000000-0000-0000-0000-000000000000",
    p_slide_index: 0,
    p_client_event_id: "anonymous-access-probe"
  },
  "teacher_start_reading_session(uuid, text, integer[], uuid[], text)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_book_id: "audit-probe",
    p_page_numbers: [1],
    p_student_ids: [EXPECTED.teacherA.studentId],
    p_content_version: "audit-probe"
  },
  "teacher_start_live_lesson(uuid, uuid[], text, text, jsonb, text)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_student_ids: [EXPECTED.teacherA.studentId],
    p_cycle_id: "cycle-1",
    p_day_key: "monday",
    p_content: {},
    p_content_version: "audit-probe"
  },
  "teacher_cancel_intervention(uuid, text)": {
    p_intervention_id: "00000000-0000-0000-0000-000000000000",
    p_reason: "Anonymous access probe"
  },
  "teacher_set_class_code_expiry(uuid, timestamp with time zone)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_expires_at: null
  },
  "teacher_set_class_leaderboard_scope(uuid, text)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_scope: "class"
  },
  "teacher_set_student_archived(uuid, uuid, boolean)": {
    p_student_id: EXPECTED.teacherA.studentId,
    p_class_id: EXPECTED.teacherA.classId,
    p_archived: true
  },
  "teacher_transfer_student(uuid, uuid, uuid)": {
    p_student_id: EXPECTED.teacherA.studentId,
    p_source_class_id: EXPECTED.teacherA.classId,
    // Same source and destination is rejected before any write. This live
    // policy probe checks exposure without moving the seeded student.
    p_target_class_id: EXPECTED.teacherA.classId
  },
  "teacher_set_student_symbol_password(uuid, text, timestamp with time zone)": {
    p_student_id: EXPECTED.teacherA.studentId,
    p_sequence: "123",
    p_set_at: "2026-07-27T00:00:00.000Z"
  },
  "teacher_set_school(text)": { p_school_name: EXPECTED.schoolName },
  "teacher_update_draft_lesson_plan(uuid, integer, uuid[], jsonb, timestamp with time zone)": {
    p_plan_id: "00000000-0000-0000-0000-000000000000",
    p_expected_revision: 1,
    p_learner_ids: [EXPECTED.teacherA.studentId],
    p_recipe: {},
    p_scheduled_for: null
  },
  "teacher_update_maths_assignment_due_at(uuid, uuid, timestamp with time zone)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_assignment_id: "00000000-0000-0000-0000-000000000000",
    p_due_at: null
  },
  "teacher_update_planned_intervention(uuid, text, text, uuid[], text, text, date)": {
    p_intervention_id: "00000000-0000-0000-0000-000000000000",
    p_owner_label: "Audit",
    p_group_label: "Audit",
    p_student_ids: [],
    p_focus: "Audit",
    p_activity: "Audit",
    p_planned_for: "2026-07-25"
  }
});

export const CATALOG_QUERY = String.raw`
select json_build_object(
  'functions',
  coalesce((
    select json_agg(function_row order by function_row.signature)
    from (
      select
        procedure.proname || '(' || oidvectortypes(procedure.proargtypes) || ')' as signature,
        exists (
          select 1
          from aclexplode(coalesce(
            procedure.proacl,
            acldefault('f', procedure.proowner)
          )) privilege
          where privilege.grantee = 0
            and privilege.privilege_type = 'EXECUTE'
        ) as public_execute,
        has_function_privilege('anon', procedure.oid, 'EXECUTE') as anon_execute,
        has_function_privilege('authenticated', procedure.oid, 'EXECUTE') as authenticated_execute,
        procedure.proconfig as settings
      from pg_proc procedure
      join pg_namespace namespace on namespace.oid = procedure.pronamespace
      where namespace.nspname = 'public'
        and procedure.prosecdef
    ) function_row
  ), '[]'::json),
  'all_functions',
  coalesce((
    select json_agg(function_row order by function_row.signature)
    from (
      select
        procedure.proname || '(' || oidvectortypes(procedure.proargtypes) || ')' as signature,
        exists (
          select 1
          from aclexplode(coalesce(
            procedure.proacl,
            acldefault('f', procedure.proowner)
          )) privilege
          where privilege.grantee = 0
            and privilege.privilege_type = 'EXECUTE'
        ) as public_execute,
        has_function_privilege('anon', procedure.oid, 'EXECUTE') as anon_execute,
        has_function_privilege('authenticated', procedure.oid, 'EXECUTE') as authenticated_execute
      from pg_proc procedure
      join pg_namespace namespace on namespace.oid = procedure.pronamespace
      where namespace.nspname = 'public'
    ) function_row
  ), '[]'::json),
  'tables',
  coalesce((
    select json_agg(table_row order by table_row.table_name)
    from (
      select
        class.relname as table_name,
        class.relrowsecurity as rls_enabled,
        has_table_privilege('anon', class.oid, 'SELECT') as anon_select,
        has_table_privilege('anon', class.oid, 'INSERT') as anon_insert,
        has_table_privilege('anon', class.oid, 'UPDATE') as anon_update,
        has_table_privilege('anon', class.oid, 'DELETE') as anon_delete,
        has_table_privilege('anon', class.oid, 'TRUNCATE') as anon_truncate,
        has_table_privilege('anon', class.oid, 'REFERENCES') as anon_references,
        has_table_privilege('anon', class.oid, 'TRIGGER') as anon_trigger,
        has_table_privilege('anon', class.oid, 'MAINTAIN') as anon_maintain,
        has_table_privilege('authenticated', class.oid, 'SELECT') as authenticated_select,
        has_table_privilege('authenticated', class.oid, 'INSERT') as authenticated_insert,
        has_table_privilege('authenticated', class.oid, 'UPDATE') as authenticated_update,
        has_table_privilege('authenticated', class.oid, 'DELETE') as authenticated_delete,
        has_table_privilege('authenticated', class.oid, 'TRUNCATE') as authenticated_truncate,
        has_table_privilege('authenticated', class.oid, 'REFERENCES') as authenticated_references,
        has_table_privilege('authenticated', class.oid, 'TRIGGER') as authenticated_trigger,
        has_table_privilege('authenticated', class.oid, 'MAINTAIN') as authenticated_maintain
      from pg_class class
      join pg_namespace namespace on namespace.oid = class.relnamespace
      where namespace.nspname = 'public'
        and class.relkind in ('r', 'p')
    ) table_row
  ), '[]'::json),
  'policies',
  coalesce((
    select json_agg(
      json_build_object(
        'table_name', policy.tablename,
        'policy_name', policy.policyname,
        'permissive', policy.permissive,
        'roles', policy.roles,
        'command', policy.cmd
      )
      order by policy.tablename, policy.policyname
    )
    from pg_policies policy
    where policy.schemaname = 'public'
  ), '[]'::json),
  'sequences',
  coalesce((
    select json_agg(sequence_row order by sequence_row.sequence_name)
    from (
      select
        class.relname as sequence_name,
        has_sequence_privilege('anon', class.oid, 'SELECT') as anon_select,
        has_sequence_privilege('anon', class.oid, 'USAGE') as anon_usage,
        has_sequence_privilege('anon', class.oid, 'UPDATE') as anon_update,
        has_sequence_privilege('authenticated', class.oid, 'SELECT') as authenticated_select,
        has_sequence_privilege('authenticated', class.oid, 'USAGE') as authenticated_usage,
        has_sequence_privilege('authenticated', class.oid, 'UPDATE') as authenticated_update
      from pg_class class
      join pg_namespace namespace on namespace.oid = class.relnamespace
      where namespace.nspname = 'public'
        and class.relkind = 'S'
        and class.relname = 'data_rights_audit_events_id_seq'
    ) sequence_row
  ), '[]'::json)
);`;

function client(apiUrl, anonKey) {
  return createClient(apiUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

function rpcName(signature) {
  return signature.slice(0, signature.indexOf("("));
}

function requireData(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function signIn(apiUrl, anonKey, email, password) {
  const actor = client(apiUrl, anonKey);
  const login = await actor.auth.signInWithPassword({ email, password });
  requireData(login, `${email} login`);
  return actor;
}

export function databasePolicyPsqlInvocation(
  databaseUrl,
  query,
  environment = process.env
) {
  return {
    command: "psql",
    args: [
      databaseUrl,
      "-X",
      "--no-psqlrc",
      "-v",
      "ON_ERROR_STOP=1",
      "-At",
      "-c",
      query
    ],
    environment: { ...environment }
  };
}

async function runPsqlJson(databaseUrl, query) {
  const invocation = databasePolicyPsqlInvocation(databaseUrl, query);
  return new Promise((resolve, reject) => {
    const child = spawn(
      invocation.command,
      invocation.args,
      {
        env: invocation.environment,
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", chunk => {
      stdout += chunk;
    });
    child.stderr.on("data", chunk => {
      stderr += chunk;
    });
    child.on("error", error => {
      reject(error.code === "ENOENT"
        ? new Error("psql is required for the live database-policy catalogue check.")
        : error);
    });
    child.on("close", code => {
      if (code !== 0) {
        reject(new Error(`psql catalogue query failed: ${stderr.trim() || `exit ${code}`}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch {
        reject(new Error("psql catalogue query did not return valid JSON."));
      }
    });
  });
}

function verifyTableCatalog(rows) {
  const failures = [];
  for (const row of rows) {
    const anonymousPrivileges = [
      row.anon_insert && "INSERT",
      row.anon_update && "UPDATE",
      row.anon_delete && "DELETE",
      row.anon_truncate && "TRUNCATE",
      row.anon_references && "REFERENCES",
      row.anon_trigger && "TRIGGER",
      row.anon_maintain && "MAINTAIN"
    ].filter(Boolean);
    if (anonymousPrivileges.length) {
      failures.push(`${row.table_name}: anon has ${anonymousPrivileges.join("/")}`);
    }
    if (row.anon_select && row.table_name !== "app_config") {
      failures.push(`${row.table_name}: unexpected anonymous SELECT`);
    }
    if (!row.rls_enabled) failures.push(`${row.table_name}: RLS is disabled`);
  }
  return failures;
}

async function verifyAnonymousBoundary(anonymous) {
  const forbiddenTables = [
    "classes",
    "students",
    "student_sessions",
    "student_progress",
    "learn_activity",
    "answers",
    "mastery",
    "item_mastery",
    "assessment_attempts",
    "assessment_question_reports",
    "el_assessment_reports",
    "teacher_interventions",
    "teacher_instructional_groups",
    "teacher_insight_observations",
    "class_access_events",
    "data_rights_requests",
    "school_retention_policies",
    "live_lesson_sessions",
    "live_lesson_participants",
    "live_lesson_presence",
    "live_lesson_responses",
    "maths_evidence_events"
  ];
  for (const table of forbiddenTables) {
    const result = await anonymous.from(table).select("*", { count: "exact", head: true });
    assert(
      result.error || result.count === 0,
      `anonymous direct read returned rows from ${table}`
    );
  }

  for (const signature of AUTHENTICATED_ONLY_SECURITY_DEFINER_RPCS) {
    const args = AUTH_ONLY_PROBE_ARGS[signature];
    assert(args, `missing anonymous denial probe for ${signature}`);
    const result = await anonymous.rpc(rpcName(signature), args);
    assert(result.error, `anonymous caller reached authenticated-only ${signature}`);
  }

  const schoolNames = requireData(
    await anonymous.rpc("search_school_names", { p_prefix: "[AU" }),
    "signed-out school autocomplete"
  );
  assert(Array.isArray(schoolNames), "signed-out school autocomplete did not return a list");
  assert(
    schoolNames.every(row => (
      row
      && typeof row.name === "string"
      && Object.keys(row).length === 1
    )),
    "signed-out school autocomplete returned more than school names"
  );
  assert(
    schoolNames.some(row => row.name === EXPECTED.schoolName),
    "signed-out school autocomplete did not return the seeded school"
  );

  for (const [name, args] of [
    ["student_list_schools", {}],
    ["student_list_classes", { p_school_id: EXPECTED.schoolId }],
    ["student_list_students", { p_class_id: EXPECTED.teacherA.classId }],
    ["student_set_password", {
      p_student_id: EXPECTED.teacherA.studentId,
      p_sequence: "111"
    }]
  ]) {
    const result = await anonymous.rpc(name, args);
    assert(result.error, `obsolete child-login RPC remained callable: ${name}`);
  }

  const invalidRoster = requireData(
    await anonymous.rpc("student_class_by_code", {
      p_code: "ZZ9ZZ9",
      p_device_id: "audit-db-policy-invalid-v1"
    }),
    "invalid class code"
  );
  assert.equal(invalidRoster?.ok, false);

  const invalidTokenChecks = [
    anonymous.rpc("student_get_progress", { p_token: "invalid" }),
    anonymous.rpc("student_save_progress", {
      p_token: "invalid",
      p_area: "audit",
      p_key: "invalid",
      p_payload: {}
    }),
    anonymous.rpc("student_log_activity_v2", {
      p_token: "invalid",
      p_client_event_id: "audit-invalid",
      p_area: "audit",
      p_item_id: "audit",
      p_event: "audit",
      p_payload: {},
      p_delivery_attempts: 1
    }),
    anonymous.rpc("student_report_activity_sync_health", {
      p_token: "invalid",
      p_device_id: "audit-invalid",
      p_attempted: 0,
      p_delivered: 0,
      p_recovered: 0,
      p_storage_failures: 0,
      p_pending: 0,
      p_lost: 0
    }),
    anonymous.rpc("get_game_leaderboard", {
      p_student_token: "invalid",
      p_limit: 5
    }),
    anonymous.rpc("student_get_live_lesson", {
      p_token: "invalid",
      p_slide_index: null,
      p_content_ok: true
    }),
    anonymous.rpc("student_submit_live_response", {
      p_token: "invalid",
      p_session_id: "00000000-0000-0000-0000-000000000000",
      p_prompt_id: "invalid",
      p_response: "invalid",
      p_client_event_id: "audit-invalid-live-response"
    }),
    anonymous.rpc("student_record_maths_evidence", {
      p_token: "invalid",
      p_client_event_id: "audit-invalid-maths-evidence",
      p_skill_id: "F-N-COUNT-10",
      p_event_type: "practice_attempt",
      p_evidence: { schemaVersion: 1, result: "correct" },
      p_occurred_at: new Date().toISOString(),
      p_content_version: "maths-audit-v1"
    })
  ];
  const invalidResults = await Promise.all(invalidTokenChecks);
  assert(
    invalidResults.every(result => result.error || result.data?.ok === false),
    "an invalid learner token reached a token-scoped RPC"
  );

  const sensitiveError = requireData(
    await anonymous.rpc("report_app_error", {
      p_client_event_id: randomUUID(),
      p_release_id: "audit",
      p_fingerprint: "a8e6f001",
      p_severity: "error",
      p_surface: "assessment",
      p_error_type: "AuditError",
      p_source: "release-gate",
      p_stack_frames: ["password=secret"],
      p_sample_rate: 1
    }),
    "sensitive remote error rejection"
  );
  assert.equal(sensitiveError?.ok, false);
}

async function verifyMathsEvidenceBoundary({
  anonymous,
  teacherA,
  teacherB,
  databaseUrl
}) {
  const childClientEventId = `maths-audit-child-${randomUUID()}`;
  const teacherClientEventId = `maths-audit-teacher-${randomUUID()}`;
  const occurredAt = new Date().toISOString();
  let studentToken = "";

  const masteryBefore = await runPsqlJson(
    databaseUrl,
    `select json_build_object('count', count(*)) from public.mastery `
      + `where student_id = '${EXPECTED.teacherA.studentId}'::uuid `
      + `and skill_id = 'F-N-COUNT-10';`
  );

  try {
    const directRead = await teacherA.from("maths_evidence_events")
      .select("id", { count: "exact", head: true });
    assert(directRead.error, "teacher received direct Maths evidence table access");

    const login = requireData(
      await anonymous.rpc("student_login", {
        p_student_id: EXPECTED.teacherA.studentId,
        p_sequence: EXPECTED.studentPassword,
        p_device_id: `maths-audit-${randomUUID()}`,
        p_code: "QA7M2K"
      }),
      "Maths evidence child login"
    );
    assert.equal(login?.ok, true, "active audit learner could not sign in");
    studentToken = login.token;

    const childArgs = {
      p_token: studentToken,
      p_client_event_id: childClientEventId,
      p_skill_id: "F-N-COUNT-10",
      p_event_type: "practice_attempt",
      p_evidence: { schemaVersion: 1, result: "correct", representation: "counter_tray" },
      p_occurred_at: occurredAt,
      p_content_version: "maths-foundation-v1"
    };
    const childWrite = requireData(
      await anonymous.rpc("student_record_maths_evidence", childArgs),
      "child Maths evidence write"
    );
    assert.equal(childWrite?.ok, true);
    assert.equal(childWrite?.idempotent, false);

    const childRetry = requireData(
      await anonymous.rpc("student_record_maths_evidence", childArgs),
      "idempotent child Maths evidence retry"
    );
    assert.equal(childRetry?.ok, true);
    assert.equal(childRetry?.id, childWrite?.id);
    assert.equal(childRetry?.idempotent, true);

    const conflictingRetry = requireData(
      await anonymous.rpc("student_record_maths_evidence", {
        ...childArgs,
        p_evidence: { schemaVersion: 1, result: "incorrect", representation: "counter_tray" }
      }),
      "conflicting child Maths evidence retry"
    );
    assert.equal(conflictingRetry?.ok, false);
    assert.equal(conflictingRetry?.error, "client_event_id_conflict");

    const teacherWrite = requireData(
      await teacherA.rpc("teacher_record_maths_evidence", {
        p_class_id: EXPECTED.teacherA.classId,
        p_student_id: EXPECTED.teacherA.studentId,
        p_client_event_id: teacherClientEventId,
        p_skill_id: "F-N-COUNT-10",
        p_event_type: "teacher_observation",
        p_evidence: { schemaVersion: 1, observed: "counted ten objects one-to-one" },
        p_occurred_at: occurredAt,
        p_content_version: "maths-foundation-v1"
      }),
      "teacher Maths evidence write"
    );
    assert.equal(teacherWrite?.ok, true);

    const crossWrite = requireData(
      await teacherA.rpc("teacher_record_maths_evidence", {
        p_class_id: EXPECTED.teacherB.classId,
        p_student_id: EXPECTED.teacherB.studentId,
        p_client_event_id: `maths-audit-cross-${randomUUID()}`,
        p_skill_id: "F-N-COUNT-10",
        p_event_type: "teacher_observation",
        p_evidence: { schemaVersion: 1, observed: "must not persist" },
        p_occurred_at: occurredAt,
        p_content_version: "maths-foundation-v1"
      }),
      "cross-tenant Maths evidence write"
    );
    assert.equal(crossWrite?.ok, false);
    assert.equal(crossWrite?.error, "learner_not_in_owned_class");

    const crossRead = requireData(
      await teacherB.rpc("teacher_read_maths_evidence", {
        p_class_id: EXPECTED.teacherA.classId,
        p_student_id: EXPECTED.teacherA.studentId,
        p_limit: 10
      }),
      "cross-tenant Maths evidence read"
    );
    assert.equal(crossRead?.ok, false);
    assert.equal(crossRead?.error, "class_not_found");

    const ownerRead = requireData(
      await teacherA.rpc("teacher_read_maths_evidence", {
        p_class_id: EXPECTED.teacherA.classId,
        p_student_id: EXPECTED.teacherA.studentId,
        p_limit: 100
      }),
      "owned Maths evidence read"
    );
    assert.equal(ownerRead?.ok, true);
    assert(ownerRead.events.some(event => event.clientEventId === childClientEventId));
    assert(ownerRead.events.some(event => event.clientEventId === teacherClientEventId));

    const exportPackage = requireData(
      await teacherA.rpc("teacher_export_learner_data", {
        p_student_id: EXPECTED.teacherA.studentId,
        p_requester_role: "school",
        p_verification_method: "authorised_school_official"
      }),
      "learner export with Maths evidence"
    );
    assert(Array.isArray(exportPackage?.mathsEvidence));
    assert(exportPackage.mathsEvidence.some(event => event.clientEventId === childClientEventId));
    assert(exportPackage.mathsEvidence.some(event => event.clientEventId === teacherClientEventId));

    await runPsqlJson(
      databaseUrl,
      `with changed as (`
        + `update public.student_sessions set revoked = true `
        + `where token = '${studentToken}' returning token`
        + `) select json_build_object('changed', (select count(*) from changed));`
    );
    const staleTokenWrite = requireData(
      await anonymous.rpc("student_record_maths_evidence", {
        ...childArgs,
        p_client_event_id: `maths-audit-stale-${randomUUID()}`
      }),
      "stale-token Maths evidence write"
    );
    assert.equal(staleTokenWrite?.ok, false);
    assert.equal(staleTokenWrite?.error, "invalid_student_session");

    const archivedLogin = requireData(
      await anonymous.rpc("student_login", {
        p_student_id: "40000000-0000-4000-8000-000000000013",
        p_sequence: "124",
        p_device_id: `maths-audit-archived-${randomUUID()}`,
        p_code: "QA7M2K"
      }),
      "archived learner Maths login"
    );
    assert.equal(archivedLogin?.ok, false);
    assert.equal(archivedLogin?.error, "not_found");

    const masteryAfter = await runPsqlJson(
      databaseUrl,
      `select json_build_object('count', count(*)) from public.mastery `
        + `where student_id = '${EXPECTED.teacherA.studentId}'::uuid `
        + `and skill_id = 'F-N-COUNT-10';`
    );
    assert.equal(
      masteryAfter.count,
      masteryBefore.count,
      "formative Maths evidence changed mastery automatically"
    );

    return {
      childWriteScoped: true,
      idempotentRetry: true,
      conflictingRetryRejected: true,
      staleTokenRejected: true,
      archivedLearnerRejected: true,
      crossTenantWriteRejected: true,
      crossTenantReadRejected: true,
      directTableReadRejected: true,
      exportIncluded: true,
      automaticMasteryBlocked: true
    };
  } finally {
    await runPsqlJson(
      databaseUrl,
      `with deleted_events as (`
        + `delete from public.maths_evidence_events where client_event_id in (`
        + `'${childClientEventId}', '${teacherClientEventId}') returning id`
        + `), deleted_sessions as (`
        + `delete from public.student_sessions where token = '${studentToken}' returning token`
        + `) select json_build_object(`
        + `'events', (select count(*) from deleted_events), `
        + `'sessions', (select count(*) from deleted_sessions));`
    );
  }
}

async function verifyCodeExpiryAndRotation({ anonymous, teacherB, databaseUrl }) {
  const classRow = requireData(
    await teacherB.from("classes")
      .select("access_code")
      .eq("id", EXPECTED.teacherB.classId)
      .single(),
    "teacher B class code"
  );
  const oldCode = classRow.access_code;
  await runPsqlJson(
    databaseUrl,
    `with updated as (`
      + `update public.classes set access_code_expires_at = now() - interval '1 minute' `
      + `where id = '${EXPECTED.teacherB.classId}'::uuid returning id`
      + `) select json_build_object('updated', (select count(*) from updated));`
  );
  const expired = requireData(
    await anonymous.rpc("student_class_by_code", {
      p_code: oldCode,
      p_device_id: "audit-db-policy-expired-v1"
    }),
    "expired class code"
  );
  assert.equal(expired?.error, "code_expired");

  const rotated = requireData(
    await teacherB.rpc("teacher_regenerate_class_code", {
      p_class_id: EXPECTED.teacherB.classId
    }),
    "teacher B code rotation"
  );
  assert(rotated?.ok && rotated?.access_code && rotated.access_code !== oldCode);
  const oldAfterRotation = requireData(
    await anonymous.rpc("student_class_by_code", {
      p_code: oldCode,
      p_device_id: "audit-db-policy-old-code-v1"
    }),
    "old class code after rotation"
  );
  assert.equal(oldAfterRotation?.ok, false);
  const newRoster = requireData(
    await anonymous.rpc("student_class_by_code", {
      p_code: rotated.access_code,
      p_device_id: "audit-db-policy-new-code-v1"
    }),
    "rotated class code"
  );
  assert.equal(newRoster?.ok, true);
  assert.equal(newRoster?.students?.length, 13);
  return { expiredRejected: true, rotatedRejected: true };
}

async function verifyDeletesAndTenantScope({ teacherA, teacherB }) {
  const crossDelete = await teacherA.from("students")
    .delete()
    .eq("id", EXPECTED.teacherB.studentId)
    .select("id");
  assert(
    crossDelete.error,
    "teacher A reached the direct learner-delete path for teacher B's learner"
  );
  const stillPresent = requireData(
    await teacherB.from("students")
      .select("id")
      .eq("id", EXPECTED.teacherB.studentId)
      .single(),
    "teacher B learner after cross-delete"
  );
  assert.equal(stillPresent.id, EXPECTED.teacherB.studentId);

  const temporaryId = randomUUID();
  requireData(
    await teacherA.from("students").insert({
      id: temporaryId,
      class_id: EXPECTED.teacherA.classId,
      teacher_id: "10000000-0000-4000-8000-000000000001",
      name: "Audit disposable learner"
    }),
    "owned learner insert"
  );
  const ownedDelete = await teacherA.from("students")
    .delete()
    .eq("id", temporaryId)
    .select("id");
  assert(
    ownedDelete.error,
    "a teacher bypassed the verified privacy workflow with a direct learner delete"
  );

  const prepared = requireData(
    await teacherA.rpc("teacher_prepare_learner_deletion", {
      p_student_id: temporaryId,
      p_requester_role: "school",
      p_verification_method: "authorised_school_official"
    }),
    "prepare verified learner deletion"
  );
  const staged = requireData(
    await teacherA.rpc("teacher_delete_learner_data_staged", {
      p_request_id: prepared.requestId,
      p_student_id: temporaryId,
      p_subject_ref: prepared.subjectRef,
      p_confirmation: prepared.confirmationPhrase
    }),
    "run verified learner deletion"
  );
  assert.equal(staged.status, "awaiting_local_cleanup");
  const completed = requireData(
    await teacherA.rpc("teacher_complete_learner_deletion", {
      p_request_id: prepared.requestId,
      p_subject_ref: prepared.subjectRef,
      p_cleanup_proof: {
        schemaVersion: 1,
        subjectRef: prepared.subjectRef,
        studentId: temporaryId,
        checkedAt: new Date().toISOString(),
        storageAvailable: true,
        residualCount: 0,
        storesChecked: [
          "assessment_attempts",
          "assessment_write_queue",
          "el_benchmark_drafts",
          "el_reports",
          "guided_reading_assessment",
          "manual_assessment_drafts",
          "maths_evidence_queue",
          "progress",
          "student_session",
          "teacher_profile"
        ]
      }
    }),
    "complete verified learner deletion"
  );
  assert.equal(completed.status, "completed");

  const removed = requireData(
    await teacherA.from("students")
      .select("id")
      .eq("id", temporaryId)
      .maybeSingle(),
    "learner after verified deletion"
  );
  assert.equal(removed, null, "verified learner deletion left the learner row behind");
  return {
    crossTenantDeleteRejected: true,
    directOwnedDeleteRejected: true,
    verifiedDeletionAllowed: true
  };
}

async function verifyAdminBoundary({ teacherA, admin }) {
  const directSchoolInsert = await teacherA.from("schools").insert({
    name: "Audit direct insert must fail"
  });
  assert(directSchoolInsert.error, "teacher bypassed the bounded school RPC with a direct insert");
  const boundedSchool = requireData(
    await teacherA.rpc("find_or_create_school", { p_name: EXPECTED.schoolName }),
    "authenticated bounded school lookup"
  );
  assert.equal(boundedSchool?.[0]?.name, EXPECTED.schoolName);
  const invalidSchool = await teacherA.rpc("find_or_create_school", { p_name: " " });
  assert(invalidSchool.error, "bounded school RPC accepted an invalid name");
  const teacherAdminCall = await teacherA.rpc("admin_get_school_retention_policy", {
    p_school_id: EXPECTED.schoolId
  });
  assert(teacherAdminCall.error, "ordinary teacher reached an administrator retention RPC");
  const adminCheck = requireData(
    await admin.rpc("is_app_admin", { check_user_id: "12000000-0000-4000-8000-000000000001" }),
    "administrator identity"
  );
  assert.equal(adminCheck, true);
  const teacherCheck = requireData(
    await teacherA.rpc("is_app_admin", {
      check_user_id: "10000000-0000-4000-8000-000000000001"
    }),
    "teacher non-admin identity"
  );
  assert.equal(teacherCheck, false);
  requireData(
    await admin.rpc("admin_error_monitor_summary"),
    "administrator monitor summary"
  );
  requireData(
    await admin.rpc("admin_get_school_retention_policy", {
      p_school_id: EXPECTED.schoolId
    }),
    "administrator retention policy"
  );
  const teacherAccount = requireData(
    await admin.from("pending_teacher_accounts")
      .select("id")
      .eq("user_id", EXPECTED.teacherA.userId)
      .single(),
    "teacher account decision target"
  );
  const directDecision = await admin.from("pending_teacher_accounts")
    .update({
      reviewed_at: "2001-01-01T00:00:00.000Z",
      reviewed_by: EXPECTED.teacherA.userId
    })
    .eq("id", teacherAccount.id)
    .select("id");
  assert(
    directDecision.error,
    "administrator bypassed the server-owned teacher-account decision RPC"
  );
  const decidedAccount = requireData(
    await admin.rpc("admin_set_teacher_account_status", {
      p_account_id: teacherAccount.id,
      p_status: "approved",
      p_rejection_reason: null
    }),
    "server-owned teacher-account decision"
  );
  assert.equal(decidedAccount?.[0]?.status, "approved");
  assert.equal(decidedAccount?.[0]?.reviewed_by, EXPECTED.adminUserId);
  return {
    teacherRejected: true,
    adminAccepted: true,
    directSchoolWriteRejected: true,
    directAccountDecisionRejected: true,
    serverAccountDecisionAccepted: true
  };
}

async function setAuditTeacherAccountState(
  databaseUrl,
  { status, approvalStatus }
) {
  return runPsqlJson(
    databaseUrl,
    `with changed as (`
      + `update public.pending_teacher_accounts `
      + `set status = '${status}', approval_status = '${approvalStatus}' `
      + `where user_id = '${EXPECTED.teacherA.userId}'::uuid `
      + `returning user_id`
      + `) select json_build_object('changed', (select count(*) from changed));`
  );
}

async function verifyTeacherAccountStatusBoundary({ teacherA, databaseUrl }) {
  const originalClass = requireData(
    await teacherA.from("classes")
      .select("id, name")
      .eq("id", EXPECTED.teacherA.classId)
      .single(),
    "approved teacher class before status boundary"
  );
  const blockedStates = [
    { status: "pending", approvalStatus: "pending" },
    { status: "rejected", approvalStatus: "rejected" },
    { status: "disabled", approvalStatus: "approved" }
  ];
  const guardedRpcCount = TEACHER_ACCOUNT_GUARDED_SECURITY_DEFINER_RPCS.length;

  try {
    const approvedUpdate = requireData(
      await teacherA.from("classes")
        .update({ name: originalClass.name })
        .eq("id", EXPECTED.teacherA.classId)
        .select("id"),
      "approved teacher update"
    );
    assert.equal(approvedUpdate.length, 1, "approved teacher could not update an owned class");

    for (const state of blockedStates) {
      const changed = await setAuditTeacherAccountState(databaseUrl, state);
      assert.equal(changed.changed, 1, `could not set audit account to ${state.status}`);

      const reads = await Promise.all([
        teacherA.from("classes").select("id").eq("teacher_id", EXPECTED.teacherA.userId),
        teacherA.from("students").select("id").eq("teacher_id", EXPECTED.teacherA.userId),
        teacherA.from("answers").select("id").eq("teacher_id", EXPECTED.teacherA.userId),
        teacherA.from("mastery").select("id").eq("teacher_id", EXPECTED.teacherA.userId),
        teacherA.from("item_mastery").select("id").eq("teacher_id", EXPECTED.teacherA.userId)
      ]);
      reads.forEach((result, index) => {
        assert.equal(
          result.error,
          null,
          `${state.status} account read ${index + 1} returned an unexpected API error`
        );
        assert.deepEqual(
          result.data,
          [],
          `${state.status} account could still read owned learning data`
        );
      });

      const forbiddenInsert = await teacherA.from("classes").insert({
        id: randomUUID(),
        teacher_id: EXPECTED.teacherA.userId,
        name: `Status boundary ${state.status}`
      });
      assert(
        forbiddenInsert.error,
        `${state.status} account inserted an owned class through the API`
      );

      const forbiddenUpdate = await teacherA.from("classes")
        .update({ name: `Blocked ${state.status} update` })
        .eq("id", EXPECTED.teacherA.classId)
        .select("id");
      assert.equal(
        forbiddenUpdate.error,
        null,
        `${state.status} account update returned an unexpected API error`
      );
      assert.deepEqual(
        forbiddenUpdate.data,
        [],
        `${state.status} account updated an owned class through the API`
      );

      for (const signature of TEACHER_ACCOUNT_GUARDED_SECURITY_DEFINER_RPCS) {
        const result = await teacherA.rpc(
          rpcName(signature),
          AUTH_ONLY_PROBE_ARGS[signature]
        );
        assert(
          result.error,
          `${state.status} account reached guarded teacher RPC ${signature}`
        );
        assert.equal(
          result.error.code,
          "42501",
          `${state.status} account reached ${signature} before the approval guard: `
            + `${result.error.code || "unknown"} ${result.error.message || ""}`
        );
        assert.match(
          result.error.message || "",
          /approved teacher account/i,
          `${state.status} account received a non-boundary error from ${signature}`
        );
      }
    }
  } finally {
    await setAuditTeacherAccountState(databaseUrl, {
      status: "approved",
      approvalStatus: "approved"
    });
  }

  const restoredClass = requireData(
    await teacherA.from("classes")
      .select("id")
      .eq("id", EXPECTED.teacherA.classId)
      .single(),
    "restored approved teacher class"
  );
  assert.equal(restoredClass.id, EXPECTED.teacherA.classId);
  return {
    pendingRejected: true,
    rejectedRejected: true,
    disabledRejected: true,
    approvedRestored: true,
    guardedRpcCount
  };
}

export async function verifyDatabasePoliciesLive({
  apiUrl,
  anonKey,
  databaseUrl,
  password
}) {
  if (!apiUrl || !anonKey || !databaseUrl || !password) {
    throw new Error(
      "LP_AUDIT_SUPABASE_URL, LP_AUDIT_SUPABASE_ANON_KEY, "
      + "LP_AUDIT_DATABASE_URL, and LP_AUDIT_TEACHER_PASSWORD are required."
    );
  }
  const approval = isApprovedAuditDatabaseUrl(databaseUrl);
  if (!approval.approved) throw new Error(approval.reason);

  const catalog = await runPsqlJson(databaseUrl, CATALOG_QUERY);
  const functionReport = auditSecurityDefinerCatalog(catalog.functions || []);
  const tableFailures = verifyTableCatalog(catalog.tables || []);
  const hostedDriftReport = auditHostedSchemaDriftCatalog({
    tables: catalog.tables || [],
    policies: catalog.policies || [],
    allFunctions: catalog.all_functions || [],
    sequences: catalog.sequences || []
  });
  const catalogFailures = [
    ...functionReport.failures,
    ...tableFailures,
    ...hostedDriftReport.failures
  ];
  if (catalogFailures.length) {
    throw new Error(`Live database catalogue failed:\n- ${catalogFailures.join("\n- ")}`);
  }

  const anonymous = client(apiUrl, anonKey);
  const [teacherA, teacherB, admin] = await Promise.all([
    signIn(apiUrl, anonKey, EXPECTED.teacherA.email, password),
    signIn(apiUrl, anonKey, EXPECTED.teacherB.email, password),
    signIn(apiUrl, anonKey, EXPECTED.adminEmail, password)
  ]);

  try {
    const isolation = await verifyAuditSchoolLive({ apiUrl, anonKey, password });
    await verifyAnonymousBoundary(anonymous);
    const teacherAccountStatus = await verifyTeacherAccountStatusBoundary({
      teacherA,
      databaseUrl
    });
    const mathsEvidence = await verifyMathsEvidenceBoundary({
      anonymous,
      teacherA,
      teacherB,
      databaseUrl
    });
    const codeLifecycle = await verifyCodeExpiryAndRotation({
      anonymous,
      teacherB,
      databaseUrl
    });
    const deletes = await verifyDeletesAndTenantScope({ teacherA, teacherB });
    const adminBoundary = await verifyAdminBoundary({ teacherA, admin });
    const leaderboard = await verifyLeaderboardPrivacyLive({ apiUrl, anonKey, password });
    return {
      securityDefinerFunctions: functionReport.securityDefinerCount,
      privateSecurityHelpers: functionReport.privateHelperCount,
      anonymousRpcs: functionReport.anonymousRpcCount,
      authenticatedRpcs: functionReport.authenticatedRpcCount,
      rlsTables: catalog.tables?.length || 0,
      historicalHostedPoliciesRemoved: hostedDriftReport.historicalPolicyCount,
      retainedHostedTablesLocked: hostedDriftReport.retainedHostedTablesPresent,
      exactAuthenticatedTableGrants: hostedDriftReport.exactGrantTableCount,
      isolation,
      teacherAccountStatus,
      mathsEvidence,
      codeLifecycle,
      deletes,
      adminBoundary,
      leaderboard
    };
  } finally {
    await Promise.allSettled([
      teacherA.auth.signOut(),
      teacherB.auth.signOut(),
      admin.auth.signOut()
    ]);
  }
}

export async function main(environment = process.env) {
  const result = await verifyDatabasePoliciesLive({
    apiUrl: environment.LP_AUDIT_SUPABASE_URL,
    anonKey: environment.LP_AUDIT_SUPABASE_ANON_KEY,
    databaseUrl: environment.LP_AUDIT_DATABASE_URL,
    password: environment.LP_AUDIT_TEACHER_PASSWORD
  });
  console.log("Live database Auth, RLS, RPC, code, token, admin, and delete policies passed.");
  console.log(JSON.stringify(result, null, 2));
  return 0;
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  try {
    process.exitCode = await main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
