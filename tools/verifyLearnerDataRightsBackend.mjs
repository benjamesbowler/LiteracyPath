/**
 * WHAT THIS CHECK PROVES, AND WHAT IT DOES NOT.
 *
 * It proves the migration FILES in this repository say the right things. It
 * does NOT prove any of it reached a running database.
 *
 * On 2026-07-27 this check was green while production could not delete a
 * learner at all: the migration had simply never been applied, and PostgREST
 * answered every call with "Could not find the function
 * public.teacher_prepare_learner_deletion(...) in the schema cache".
 *
 * For deployment, run `npm run check:live-database`
 * (tools/verifyLiveDatabaseFunctions.mjs), which asks the live database.
 * Neither check substitutes for the other.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const migration = source(
  "supabase/migrations/20260725110000_learner_data_rights.sql"
);
const integrityMigration = source(
  "supabase/migrations/20260727120000_assessment_data_integrity_boundary.sql"
);
const service = source("src/data/learnerDataRights.js");
const dialog = source("src/components/teacher/LearnerDataRightsDialog.jsx");
const teacherDashboard = source("src/components/TeacherStudentsPage.jsx");
const adminDashboard = source("src/components/AdminDashboardPage.jsx");
const runbook = source("docs/ops/DATA_RIGHTS_RUNBOOK.md");

assert.match(migration, /create table if not exists public\.data_rights_requests/i);
assert.match(migration, /create table if not exists public\.data_rights_audit_events/i);
assert.match(migration, /subject_ref text not null check \(subject_ref ~ '\^\[0-9a-f\]\{64\}\$'\)/i);
assert.match(migration, /now\(\) \+ interval '30 days'/i);
assert.match(migration, /teacher_export_learner_data/i);
assert.match(migration, /teacher_list_learner_data_rights/i);
assert.match(migration, /teacher_prepare_learner_deletion/i);
assert.match(migration, /teacher_delete_learner_data/i);
assert.match(migration, /p_confirmation is distinct from 'DELETE LEARNER DATA'/i);
assert.match(migration, /delete from public\.teacher_insight_observations/i);
assert.match(migration, /delete from public\.teacher_instructional_group_reviews/i);
assert.match(migration, /array_remove\(ti\.student_ids, v_student\.id\)/i);
assert.match(migration, /delete from public\.el_assessment_reports/i);
assert.match(migration, /delete from public\.assessment_attempts/i);
assert.match(migration, /delete from public\.students/i);
assert.match(migration, /residual managed records/i);
assert.match(migration, /lock table public\.assessment_attempts in share row exclusive mode/i);
assert.match(migration, /'deletion_completed'/i);
assert.match(migration, /residualManagedRecords', 0/i);
assert.match(migration, /revoke all on public\.data_rights_requests from anon, authenticated/i);
assert.match(migration, /Teachers read owned data rights requests/i);
assert.doesNotMatch(
  migration.match(
    /create table if not exists public\.data_rights_requests[\s\S]+?\n\);/i
  )?.[0] || "",
  /on delete cascade/i
);
assert.doesNotMatch(
  migration.match(/create table if not exists public\.data_rights_audit_events[\s\S]+?create index/i)?.[0] || "",
  /\b(student_id|student_name|answer|credential|token)\b/i
);

assert.match(service, /teacher_export_learner_data/);
assert.match(service, /teacher_list_learner_data_rights/);
assert.match(service, /teacher_prepare_learner_deletion/);
assert.match(service, /teacher_delete_learner_data_staged/);
assert.match(service, /teacher_complete_learner_deletion/);
assert.match(service, /teacher_get_learner_deletion_status/);
assert.match(service, /PENDING_LEARNER_DELETION_PREFIX/);
assert.match(service, /residualManagedRecords !== 0/);
assert.match(dialog, /How was identity and authority verified\?/);
assert.match(dialog, /does not include class sign-in codes or technical device details/i);
assert.match(dialog, /No student work, results or profile details remain after deletion/i);
assert.match(dialog, /Privacy request history/i);
assert.match(teacherDashboard, /Privacy and data rights/);
assert.match(teacherDashboard, /clearAndVerifyLocalProgressForStudent/);
assert.match(teacherDashboard, /clearLocalElAssessmentDataForStudent/);
assert.match(adminDashboard, /Export or delete data/);
assert.match(adminDashboard, /clearAndVerifyLocalProgressForStudent/);
assert.match(runbook, /identity verification/i);
assert.match(runbook, /30 calendar days/i);
assert.match(runbook, /backup/i);
assert.match(runbook, /tombstone/i);
assert.match(runbook, /seeded learner/i);

// The 2026-07-27 correction: deleting one learner must not destroy the shared
// reports that other children appear in. The original statement matched the
// subject's id anywhere in payload or summary and deleted the WHOLE row, so a
// whole-class report took twenty-nine other children's evidence with it.
const lifecycleFixes = source(
  "supabase/migrations/20260727090000_data_rights_and_lifecycle_fixes.sql"
);
assert.match(lifecycleFixes, /create or replace function public\.redact_learner_from_shared_reports/i);
assert.match(lifecycleFixes, /create or replace function public\.jsonb_strip_student_entries/i);
// Reports ABOUT the subject go; reports that merely mention them are redacted.
assert.match(lifecycleFixes, /delete from public\.el_assessment_reports er\s*\n\s*where er\.student_id = v_subject;/i);
assert.match(lifecycleFixes, /er\.student_id is distinct from v_subject/i);
// Redaction must erase the id as a SUBSTRING, or the zero-residual proof in
// teacher_delete_learner_data can never pass and every deletion rolls back.
assert.match(lifecycleFixes, /replace\(p_document #>> '\{\}', p_student_id, '\[removed\]'\)/i);
assert.match(lifecycleFixes, /v_count := public\.redact_learner_from_shared_reports\(v_student\.id\)/i);
// Archiving a child must actually end their access, not only hide the row.
assert.match(lifecycleFixes, /update public\.student_sessions\s*\n\s*set revoked = true/i);
assert.match(lifecycleFixes, /and s\.archived_at is null/i);

// Browser-driven deletion is deliberately two phase. The active database
// records are removed and proved absent first, but the privacy request remains
// open until the browser has cleared its durable queues and local evidence.
assert.match(integrityMigration, /teacher_delete_learner_data_staged/i);
assert.match(integrityMigration, /teacher_complete_learner_deletion/i);
assert.match(integrityMigration, /teacher_get_learner_deletion_status/i);
assert.match(integrityMigration, /'awaiting_local_cleanup'/i);
assert.match(integrityMigration, /'clientCleanupReported', true/i);
assert.doesNotMatch(integrityMigration, /'localCleanupVerified', true/i);
assert.match(integrityMigration, /p_cleanup_proof jsonb/i);
assert.match(integrityMigration, /clientCleanupStoreCount/i);
assert.match(integrityMigration, /revoke delete on public\.students from authenticated/i);
assert.match(
  integrityMigration,
  /delete from public\.student_progress sp\s+where sp\.student_id = v_student\.id\s+and sp\.area not in \('profile', 'guided_reading', 'story_quests'\)/i
);
assert.match(integrityMigration, /'learnerProfileRetained', true/i);
assert.match(integrityMigration, /'guidedReadingRetained', true/i);
assert.match(integrityMigration, /'storyQuestRetained', true/i);
assert.match(
  integrityMigration,
  /update public\.teacher_insight_observations io\s+set student_ids = array_remove\(io\.student_ids, v_student\.id\)[\s\S]*?cardinality\(io\.student_ids\) > 1/i
);
assert.match(
  integrityMigration,
  /update public\.teacher_instructional_group_reviews gr\s+set student_ids = array_remove\(gr\.student_ids, v_student\.id\)[\s\S]*?cardinality\(gr\.student_ids\) > 1/i
);
assert.match(integrityMigration, /'teacherObservationsRedacted'/i);
assert.match(integrityMigration, /'instructionalGroupReviewsRedacted'/i);

// The blanket revoke/grant boundary must still be the LAST security-definer
// migration; tests/unit/databasePolicyContract.test.js enforces the ordering.
assert.match(
  source("supabase/migrations/20260728091000_security_definer_boundary.sql"),
  /revoke execute on function %s from public, anon, authenticated/i
);

console.log(
  "Learner data rights: verified export, tracked 30-day target, exact-confirmation "
  + "staged atomic deletion, embedded-reference cleanup, zero-residual proof, verified local cleanup, "
  + "practice-reset retention, privacy-safe audit tombstone, shared-report redaction, and archive session "
  + "revocation verified in SOURCE. This does NOT prove any of it is deployed — "
  + "run `npm run check:live-database` for that."
);
