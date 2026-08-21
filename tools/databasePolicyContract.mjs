import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationDir = path.join(repoRoot, "supabase", "migrations");
export const SECURITY_BOUNDARY_MIGRATION = "20260814172000_security_definer_boundary.sql";
export const TEACHER_ACCOUNT_STATUS_MIGRATION = SECURITY_BOUNDARY_MIGRATION;

export const ANON_SECURITY_DEFINER_RPCS = Object.freeze([
  "get_game_leaderboard(text, integer)",
  "search_school_names(text)",
  "report_app_error(uuid, text, text, text, text, text, text, text[], numeric)",
  "report_assessment_question(text, uuid, text, uuid, jsonb)",
  "student_class_by_code(text, text)",
  "student_get_progress(text)",
  "student_get_reading_session(text, integer, boolean)",
  "student_get_live_lesson(text, integer, boolean)",
  "student_list_press_projects(text)",
  "student_log_activity_v2(text, text, text, text, text, jsonb, timestamp with time zone, integer)",
  "student_login(uuid, text, text, text)",
  "student_report_activity_sync_health(text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamp with time zone)",
  "student_save_progress(text, text, text, jsonb)",
  "student_save_book_revision(text, uuid, uuid, text, jsonb, jsonb)",
  "student_submit_book_revision(text, uuid, uuid)",
  "student_read_class_press_library(text)",
  "student_submit_live_response(text, uuid, text, jsonb, text)"
]);

export const AUTHENTICATED_ONLY_SECURITY_DEFINER_RPCS = Object.freeze([
  "admin_error_monitor_summary()",
  "admin_get_school_retention_policy(uuid)",
  "admin_list_deletion_propagation(uuid)",
  "admin_preview_school_retention(uuid)",
  "admin_purge_expired_error_events()",
  "admin_recent_error_events(integer)",
  "admin_review_assessment_question_report(uuid, text, text)",
  "admin_run_school_retention(uuid, text)",
  "admin_save_school_retention_policy(uuid, integer, integer, text, integer, integer, integer)",
  "admin_set_teacher_account_status(uuid, text, text)",
  "admin_verify_deletion_propagation(uuid, text, text)",
  "find_or_create_school(text)",
  "is_app_admin(uuid)",
  "set_app_config(text, jsonb)",
  "teacher_assign_instructional_group_follow_up(uuid, text, text, date)",
  "teacher_class_access_log(uuid, integer)",
  "teacher_class_access_summary(uuid)",
  "teacher_close_worksheet_instance(uuid)",
  "teacher_complete_learner_deletion(uuid, text, jsonb)",
  "teacher_create_insight_intervention(text, uuid, jsonb, uuid[], text[], text, text, date)",
  "teacher_create_intervention_follow_up(uuid, text, text, uuid[], text, text, date)",
  "teacher_create_intervention_plan(uuid, text, text, uuid[], text, text, date)",
  "teacher_create_lesson_plan(uuid, uuid, uuid[], jsonb, jsonb, timestamp with time zone)",
  "teacher_create_press_project(uuid, uuid[], jsonb)",
  "teacher_create_worksheet_instance(uuid, uuid[], jsonb)",
  "teacher_delete_empty_class(uuid)",
  "teacher_delete_learner_data_staged(uuid, uuid, text, text)",
  "teacher_delete_planned_intervention(uuid)",
  "teacher_delete_saved_assessment_report(text)",
  "teacher_end_reading_session(uuid)",
  "teacher_end_live_lesson(uuid)",
  "teacher_export_learner_data(uuid, text, text)",
  "teacher_get_learner_deletion_status(uuid, text)",
  "teacher_get_active_live_lesson()",
  "teacher_get_reading_session_presence(uuid)",
  "teacher_get_live_lesson_snapshot(uuid)",
  "teacher_list_learner_data_rights(uuid)",
  "teacher_list_press_work(uuid)",
  "teacher_mark_intervention_delivered(uuid)",
  "teacher_prepare_learner_deletion(uuid, text, text)",
  "teacher_read_lesson_plan(uuid)",
  "teacher_read_worksheet_history(uuid)",
  "teacher_record_insight_observation(uuid, jsonb, uuid[], text, text, text, date)",
  "teacher_record_intervention_outcome(uuid, text, text)",
  "teacher_record_lesson_delivery(uuid, text, uuid[], text, text, jsonb)",
  "teacher_record_worksheet_observation(uuid, text, jsonb, text, uuid)",
  "teacher_regenerate_class_code(uuid)",
  "teacher_reset_student_progress(uuid, timestamp with time zone)",
  "teacher_resolve_worksheet_code(text)",
  "teacher_review_instructional_group(uuid, uuid[], jsonb)",
  "teacher_review_book_revision(uuid, uuid, text, jsonb)",
  "teacher_review_intervention(uuid, date)",
  "teacher_save_instructional_group(uuid, text, jsonb, uuid[], jsonb)",
  "teacher_save_reading_marks(uuid, uuid, integer, jsonb, text)",
  "teacher_cancel_intervention(uuid, text)",
  "teacher_set_class_code_expiry(uuid, timestamp with time zone)",
  "teacher_set_class_leaderboard_scope(uuid, text)",
  "teacher_set_reading_session_page(uuid, integer)",
  "teacher_set_live_lesson_slide(uuid, integer, text)",
  "teacher_set_student_archived(uuid, uuid, boolean)",
  "teacher_set_student_symbol_password(uuid, text, timestamp with time zone)",
  "teacher_start_reading_session(uuid, text, integer[], uuid[], text)",
  "teacher_start_live_lesson(uuid, uuid[], text, text, jsonb, text)",
  "teacher_transfer_student(uuid, uuid, uuid)",
  "teacher_set_school(text)",
  "teacher_update_draft_lesson_plan(uuid, integer, uuid[], jsonb, timestamp with time zone)",
  "teacher_update_planned_intervention(uuid, text, text, uuid[], text, text, date)"
]);

export const AUTHENTICATED_SECURITY_DEFINER_RPCS = Object.freeze([
  ...ANON_SECURITY_DEFINER_RPCS,
  ...AUTHENTICATED_ONLY_SECURITY_DEFINER_RPCS
].sort());

export const TEACHER_ACCOUNT_GUARDED_SECURITY_DEFINER_RPCS = Object.freeze(
  AUTHENTICATED_ONLY_SECURITY_DEFINER_RPCS
    .filter(signature => signature.startsWith("teacher_"))
    .sort()
);

const LEGACY_RPC_SIGNATURES = Object.freeze([
  // Replaced by search_school_names(text): the no-argument form returned every
  // school name to anon in one call.
  "list_school_names()",
  "student_list_schools()",
  "student_list_classes(uuid)",
  "student_list_students(uuid)",
  "student_set_password(uuid, text)",
  "student_set_password(uuid, text, text)",
  "student_login(uuid, text)",
  "student_class_by_code(text)",
  "student_log_activity(text, text, text, text, jsonb)"
]);

/**
 * Removes `-- line` and block comments so a guard reads SQL rather than prose.
 * Dollar-quoted function bodies are left alone: `--` inside one is still a
 * comment to PostgreSQL, and nothing here needs to distinguish them.
 */
export function withoutSqlComments(sql = "") {
  return String(sql)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ");
}

function comparableSignature(value) {
  return String(value || "")
    .replace(/^public\./, "")
    .replaceAll("timestamptz", "timestamp with time zone")
    .replace(/\bint\b/g, "integer")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim();
}

function sorted(values) {
  return [...values].map(comparableSignature).sort();
}

function sameValues(actual, expected) {
  return JSON.stringify(sorted(actual)) === JSON.stringify(sorted(expected));
}

export function auditSecurityBoundarySource({
  files = fs.readdirSync(migrationDir).filter(file => file.endsWith(".sql")).sort(),
  source = fs.readFileSync(path.join(migrationDir, SECURITY_BOUNDARY_MIGRATION), "utf8"),
  teacherAccountSource = fs.readFileSync(
    path.join(migrationDir, TEACHER_ACCOUNT_STATUS_MIGRATION),
    "utf8"
  )
} = {}) {
  const failures = [];
  if (!files.includes(SECURITY_BOUNDARY_MIGRATION)) {
    failures.push(`missing ${SECURITY_BOUNDARY_MIGRATION}`);
  }
  if (!files.includes(TEACHER_ACCOUNT_STATUS_MIGRATION)) {
    failures.push(`missing ${TEACHER_ACCOUNT_STATUS_MIGRATION}`);
  }
  const laterSecurityDefiners = files
    .filter(file => file > SECURITY_BOUNDARY_MIGRATION)
    .filter(file => {
      const laterSource = withoutSqlComments(fs.readFileSync(path.join(migrationDir, file), "utf8"));
      if (!/security\s+definer/i.test(laterSource)) return false;
      const privateDefinitions = [...laterSource.matchAll(
        /create\s+or\s+replace\s+function\s+public\.([a-z0-9_]+)\s*\([^)]*\)[\s\S]*?security\s+definer/gi
      )];
      return privateDefinitions.length === 0 || privateDefinitions.some(([, functionName]) => (
        !new RegExp(`revoke\\s+all\\s+on\\s+function\\s+public\\.${functionName}\\s*\\(`, "i")
          .test(laterSource)
      ));
    });
  if (laterSecurityDefiners.length) {
    failures.push(
      `Exposed SECURITY DEFINER functions were added after the boundary migration: ${laterSecurityDefiners.join(", ")}`
    );
  }
  for (const required of [
    "procedure.prosecdef",
    "revoke execute on function %s from public, anon, authenticated",
    "notify pgrst, 'reload schema'"
  ]) {
    if (!source.includes(required)) failures.push(`missing boundary contract: ${required}`);
  }
  for (const signature of LEGACY_RPC_SIGNATURES) {
    const escaped = signature
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace("\\(", "\\s*\\(")
      .replaceAll(",\\ ", ",\\s*");
    if (!new RegExp(`drop function if exists public\\.${escaped}`, "i").test(source)) {
      failures.push(`legacy RPC is not dropped: ${signature}`);
    }
  }
  for (const required of [
    "create or replace function public.assert_current_actor_teacher_access()",
    "procedure.prosecdef",
    "has_function_privilege('authenticated', procedure.oid, 'EXECUTE')",
    "Authenticated teacher RPC inventory drift",
    "perform public.assert_current_actor_teacher_access();",
    "public.perform_verified_learner_deletion(uuid,uuid,text,text,boolean)"
  ]) {
    if (!teacherAccountSource.includes(required)) {
      failures.push(`missing teacher-account RPC boundary contract: ${required}`);
    }
  }
  for (const signature of TEACHER_ACCOUNT_GUARDED_SECURITY_DEFINER_RPCS) {
    const inventorySignature = signature.replaceAll(", ", ",");
    if (!teacherAccountSource.includes(`'${inventorySignature}'`)) {
      failures.push(`teacher RPC is absent from the account-status guard: ${signature}`);
    }
  }
  const grantMatches = [...source.matchAll(
    /grant\s+execute\s+on\s+function\s+public\.([a-z0-9_]+\s*\([\s\S]*?\))\s+to\s+(anon,\s*authenticated|authenticated)\s*;/gi
  )];
  const anon = [];
  const authenticated = [];
  for (const match of grantMatches) {
    const signature = comparableSignature(match[1]);
    authenticated.push(signature);
    if (/^anon/i.test(match[2])) anon.push(signature);
  }
  if (!sameValues(anon, ANON_SECURITY_DEFINER_RPCS)) {
    failures.push("anonymous RPC grants do not match the explicit allow-list");
  }
  if (!sameValues(authenticated, AUTHENTICATED_SECURITY_DEFINER_RPCS)) {
    failures.push("authenticated RPC grants do not match the explicit allow-list");
  }
  return {
    failures,
    files,
    anonymousRpcCount: ANON_SECURITY_DEFINER_RPCS.length,
    authenticatedRpcCount: AUTHENTICATED_SECURITY_DEFINER_RPCS.length,
    legacyRpcCount: LEGACY_RPC_SIGNATURES.length
  };
}

export function auditSecurityDefinerCatalog(rows) {
  const failures = [];
  const normalized = rows.map(row => ({
    ...row,
    signature: comparableSignature(row.signature)
  }));
  const publicExecute = normalized.filter(row => row.public_execute);
  if (publicExecute.length) {
    failures.push(
      `PUBLIC can execute SECURITY DEFINER functions: ${publicExecute.map(row => row.signature).join(", ")}`
    );
  }
  const unsafeSearchPath = normalized.filter(row => {
    const settings = Array.isArray(row.settings) ? row.settings : [];
    return !settings.some(setting => /^search_path=public(?:,\s*extensions)?$/.test(setting));
  });
  if (unsafeSearchPath.length) {
    failures.push(
      `SECURITY DEFINER functions lack a fixed safe search_path: ${unsafeSearchPath.map(row => row.signature).join(", ")}`
    );
  }
  const anon = normalized.filter(row => row.anon_execute).map(row => row.signature);
  const authenticated = normalized
    .filter(row => row.authenticated_execute)
    .map(row => row.signature);
  if (!sameValues(anon, ANON_SECURITY_DEFINER_RPCS)) {
    failures.push(
      `live anonymous SECURITY DEFINER surface differs from allow-list; actual: ${sorted(anon).join(", ")}`
    );
  }
  if (!sameValues(authenticated, AUTHENTICATED_SECURITY_DEFINER_RPCS)) {
    failures.push(
      `live authenticated SECURITY DEFINER surface differs from allow-list; actual: ${sorted(authenticated).join(", ")}`
    );
  }
  const legacy = normalized.filter(row => LEGACY_RPC_SIGNATURES.includes(row.signature));
  if (legacy.length) {
    failures.push(`legacy SECURITY DEFINER RPCs still exist: ${legacy.map(row => row.signature).join(", ")}`);
  }
  return {
    failures,
    securityDefinerCount: normalized.length,
    privateHelperCount: normalized.filter(
      row => !row.anon_execute && !row.authenticated_execute
    ).length,
    anonymousRpcCount: anon.length,
    authenticatedRpcCount: authenticated.length
  };
}

/* ------------------------------------------------------------------ *
 * Teacher-owned TABLE policies
 * ------------------------------------------------------------------ */

/**
 * The RPC audit above covers SECURITY DEFINER functions. Nothing covered
 * tables, and on 2026-08-07 four tables created after the July gate migration
 * were found checking only `teacher_id = auth.uid()`:
 * reading_sessions, mll_language_assessments, mll_exit_criteria and
 * mll_family_contacts. All four hold direct grants to `authenticated`, so a
 * rejected or disabled teacher with a live token kept reading and writing them.
 *
 * A policy is a teacher-owned surface if it is NAMED as one — the repository
 * uses two conventions and only two, verified against a real PostgreSQL with
 * every migration applied (tools/db/checkTeacherGateDrift.mjs):
 *
 *   "Teachers ..."            quoted, 20 policies
 *   <table>_teacher_access    bare identifier, 3 policies
 *
 * Matching on the NAME rather than on the policy body is what makes this
 * precise. The first attempt at this check matched any policy whose USING
 * expression mentioned `auth.uid()`, which also matches
 * `public.is_app_admin(auth.uid())` — every admin policy on every table. It
 * flagged sixteen tables. Admin policies are correctly not gated on teacher
 * access, because an app admin is not a teacher.
 */
const TEACHER_POLICY_NAME = /^(?:teachers\s|.*_teacher_access$)/i;
const TEACHER_ACCESS_GATE = "current_actor_has_teacher_access";

function policyStatements(sql) {
  // `create policy <name> on <table> ... ;` — a policy body never contains a
  // semicolon, so the first one terminates the statement.
  const pattern = /create\s+policy\s+("(?:[^"]+)"|[a-z0-9_]+)\s+on\s+([a-z0-9_.]+)([\s\S]*?);/gi;
  const found = [];
  let match;
  while ((match = pattern.exec(sql)) !== null) {
    found.push({
      name: match[1].replace(/^"|"$/g, ""),
      table: match[2].replace(/^public\./i, ""),
      body: match[3]
    });
  }
  return found;
}

function droppedPolicies(sql) {
  const pattern = /drop\s+policy\s+(?:if\s+exists\s+)?("(?:[^"]+)"|[a-z0-9_]+)\s+on\s+([a-z0-9_.]+)/gi;
  const found = [];
  let match;
  while ((match = pattern.exec(sql)) !== null) {
    found.push({
      name: match[1].replace(/^"|"$/g, ""),
      table: match[2].replace(/^public\./i, "")
    });
  }
  return found;
}

/**
 * Replays every migration in filename order and returns the policies that are
 * live at the end — a later file's create replaces an earlier one, and a drop
 * removes it. Reading a single migration would report policies that no longer
 * exist.
 */
export function resolveLivePolicies({
  files = fs.readdirSync(migrationDir).filter(file => file.endsWith(".sql")).sort(),
  read = file => fs.readFileSync(path.join(migrationDir, file), "utf8")
} = {}) {
  const live = new Map();
  for (const file of files) {
    const sql = read(file);
    for (const dropped of droppedPolicies(sql)) {
      live.delete(`${dropped.table}::${dropped.name}`);
    }
    for (const created of policyStatements(sql)) {
      live.set(`${created.table}::${created.name}`, { ...created, file });
    }
  }
  return [...live.values()];
}

export function auditTeacherTablePolicies(options = {}) {
  const live = resolveLivePolicies(options);
  const teacherPolicies = live.filter(policy => TEACHER_POLICY_NAME.test(policy.name));
  const failures = teacherPolicies
    .filter(policy => !policy.body.includes(TEACHER_ACCESS_GATE))
    .map(policy =>
      `policy "${policy.name}" on ${policy.table} (${policy.file}) is a teacher surface `
      + `but does not gate on ${TEACHER_ACCESS_GATE}(); a rejected or disabled teacher `
      + "would keep access to it"
    );
  return {
    failures,
    teacherPolicyCount: teacherPolicies.length,
    totalPolicyCount: live.length,
    teacherTables: [...new Set(teacherPolicies.map(policy => policy.table))].sort()
  };
}
