import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function source(relativePath) {
  return fs.readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

const migration = source(
  "supabase/migrations/20260728120000_security_integrity_hardening.sql"
);

test("every learner archive path revokes sessions and archived learners cannot log in or report", () => {
  const rosterOperations = source("src/data/teacherRosterOperations.js");

  assert.match(
    migration,
    /after update of archived_at on public\.students[\s\S]*revoke_student_sessions_after_archive/i
  );
  assert.match(
    migration,
    /update public\.student_sessions[\s\S]*set revoked = true[\s\S]*student\.archived_at is not null/i
  );
  assert.match(
    migration,
    /create or replace function public\.student_login\([\s\S]*where id = p_student_id\s+and archived_at is null/i
  );
  assert.match(
    migration,
    /session\.revoked = false[\s\S]*session\.expires_at > now\(\)[\s\S]*student\.archived_at is null/i
  );
  assert.match(
    migration,
    /before insert or update on public\.student_sessions[\s\S]*require_active_student_session_owner/i
  );
  assert.doesNotMatch(
    rosterOperations,
    /\.table\("students"\)[\s\S]{0,240}\.update\(\{\s*archived_at/i
  );
  assert.match(
    rosterOperations,
    /LP_ARCHIVE_UNSUPPORTED[\s\S]*No roster row or learner session was changed/
  );
});

test("anonymous diagnostics have atomic caller, network, fingerprint, and global limits", () => {
  assert.match(
    migration,
    /dimension in \('global', 'caller', 'network', 'fingerprint'\)/i
  );
  assert.match(
    migration,
    /public\.class_access_network_fingerprint\(\)/
  );
  assert.match(
    migration,
    /coalesce\(auth\.uid\(\)::text, public\.class_access_network_fingerprint\(\)\)/
  );
  assert.match(
    migration,
    /\('caller'::text, v_caller_key, 60\)[\s\S]*\('network'::text, v_network_key, 120\)/i
  );
  assert.match(migration, /'literacy-path-error-global-v1'[\s\S]*1000/i);
  assert.match(
    migration,
    /on conflict \(bucket_key\)[\s\S]*attempt_count = case[\s\S]*returning \* into v_bucket/i
  );
  assert.doesNotMatch(migration, /\bp_(?:caller|network|abuse)_key\b/i);
});

test("student question reports preserve idempotency and enforce session, learner, and school quotas", () => {
  assert.match(
    migration,
    /dimension in \('session', 'student', 'school'\)/i
  );
  assert.match(
    migration,
    /'session'::text[\s\S]*,\s*30[\s\S]*'student'::text[\s\S]*,\s*40[\s\S]*'school'::text[\s\S]*,\s*500/i
  );
  assert.ok(
    migration.indexOf("select exists (")
      < migration.indexOf("insert into public.assessment_question_report_rate_limits"),
    "the owned report-id retry must be recognised before a quota slot is consumed"
  );
  assert.match(
    migration,
    /revoke all on function public\.report_assessment_question_core\([\s\S]*from public, anon, authenticated/i
  );
  assert.match(
    migration,
    /grant execute on function public\.report_assessment_question\([\s\S]*to anon, authenticated/i
  );
});

test("school creation requires an approved account and is bounded without breaking the auth trigger", () => {
  assert.match(
    migration,
    /create or replace function public\.find_or_create_school[\s\S]*perform public\.assert_current_actor_teacher_access\(\)/i
  );
  assert.match(
    migration,
    /when public\.is_app_admin\(v_actor_id\) then 20\s+else 5/i
  );
  assert.match(
    migration,
    /create or replace function public\.create_school_directory_entry[\s\S]*revoke all on function public\.create_school_directory_entry\(text\)\s+from public, anon, authenticated/i
  );
  assert.match(
    migration,
    /create_pending_teacher_account_for_new_user[\s\S]*from public\.create_school_directory_entry\(requested_school_name\)/i
  );
});

test("teacher-account decisions and their audit provenance are server-owned", () => {
  const controller = source("src/appState/useAppSessionController.js");
  const classBoundary = source("src/data/boundaries/classes.js");
  const auditSeed = source("supabase/seed/audit_school.sql");

  assert.match(
    migration,
    /create trigger enforce_teacher_account_audit_integrity[\s\S]*before insert or update on public\.pending_teacher_accounts/i
  );
  assert.match(
    migration,
    /session_user in \('postgres', 'supabase_admin'\)[\s\S]*current_setting\('role', true\)[\s\S]*in \('none', 'postgres', 'supabase_admin'\)/
  );
  assert.doesNotMatch(
    migration,
    /current_user in \('postgres', 'supabase_admin'\)/
  );
  assert.match(
    auditSeed,
    /insert into public\.pending_teacher_accounts[\s\S]*'teacher',[\s\S]*'approved',[\s\S]*'approved'/i
  );
  assert.match(
    migration,
    /new\.reviewed_at is distinct from old\.reviewed_at[\s\S]*new\.rejection_reason is distinct from old\.rejection_reason/i
  );
  assert.match(
    migration,
    /create or replace function public\.admin_set_teacher_account_status[\s\S]*reviewed_at = now\(\)[\s\S]*reviewed_by = auth\.uid\(\)/i
  );
  assert.match(
    controller,
    /supabase\.call\(\s*"admin_set_teacher_account_status"/
  );
  const decisionFunction = controller.slice(
    controller.indexOf("async function updateTeacherAccountStatus"),
    controller.indexOf("async function signUpTeacher")
  );
  assert.doesNotMatch(
    decisionFunction,
    /\.table\("pending_teacher_accounts"\)[\s\S]*\.update\(/
  );
  assert.doesNotMatch(
    decisionFunction,
    /new Date\(\)|reviewed_at|reviewed_by|approved_at|approved_by/
  );
  assert.match(classBoundary, /"admin_set_teacher_account_status"/);
});
