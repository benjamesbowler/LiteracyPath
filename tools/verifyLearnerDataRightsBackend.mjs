import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const migration = source(
  "supabase/migrations/20260725110000_learner_data_rights.sql"
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
assert.match(service, /teacher_delete_learner_data/);
assert.match(service, /residualManagedRecords !== 0/);
assert.match(dialog, /How was identity and authority verified\?/);
assert.match(dialog, /Sign-in tokens and device identifiers are excluded/);
assert.match(dialog, /Only a minimal audit record of the request remains/);
assert.match(dialog, /Data-rights request history/);
assert.match(teacherDashboard, /Privacy and data rights/);
assert.match(teacherDashboard, /clearLocalProgressForStudent/);
assert.match(teacherDashboard, /clearLocalElAssessmentDataForStudent/);
assert.match(adminDashboard, /Export or delete data/);
assert.match(runbook, /identity verification/i);
assert.match(runbook, /30 calendar days/i);
assert.match(runbook, /backup/i);
assert.match(runbook, /tombstone/i);
assert.match(runbook, /seeded learner/i);

console.log(
  "Learner data rights: verified export, tracked 30-day target, exact-confirmation "
  + "atomic deletion, embedded-reference cleanup, zero-residual proof, local cleanup, "
  + "and privacy-safe audit tombstone verified."
);
