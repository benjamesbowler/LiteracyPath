import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const migration = source(
  "supabase/migrations/20260725120000_school_retention_policy.sql"
);
const service = source("src/data/schoolRetention.js");
const panel = source("src/components/admin/SchoolRetentionPolicyPanel.jsx");
const adminDashboard = source("src/components/AdminDashboardPage.jsx");
const privacyPage = source("public/privacy.html");
const privacySource = source("docs/legal/PRIVACY_POLICY.md");
const subprocessors = source("docs/legal/SUBPROCESSORS.md");
const runbook = source("docs/ops/RETENTION_RUNBOOK.md");

assert.match(migration, /create table if not exists public\.school_retention_policies/i);
assert.match(migration, /inactive_after_days between 90 and 2555/i);
assert.match(migration, /archived_delete_after_days between 7 and 730/i);
assert.match(migration, /end_of_year_action in \('archive', 'delete'\)/i);
assert.match(migration, /create table if not exists public\.retention_job_runs/i);
assert.match(migration, /policy_snapshot jsonb not null/i);
assert.match(migration, /preview_snapshot jsonb not null/i);
assert.match(migration, /admin_preview_school_retention/i);
assert.match(migration, /admin_run_school_retention/i);
assert.match(migration, /p_confirmation is distinct from 'APPLY RETENTION POLICY'/i);
assert.match(migration, /public\.teacher_prepare_learner_deletion/i);
assert.match(migration, /public\.teacher_delete_learner_data/i);
assert.match(migration, /'deletedStudentIds', to_jsonb\(v_deleted_student_ids\)/i);
assert.match(migration, /public\.retention_last_learner_activity/i);
assert.match(migration, /from public\.student_sessions ss where ss\.student_id = s\.id/i);
assert.match(migration, /coalesce\(la\.occurred_at, la\.created_at\)/i);
assert.match(migration, /last_end_of_year_applied/i);
assert.match(migration, /revoke all on public\.school_retention_policies from anon, authenticated/i);
assert.match(migration, /public\.is_app_admin\(auth\.uid\(\)\)/i);

assert.match(migration, /create table if not exists public\.deletion_propagation_records/i);
assert.match(migration, /status in \('awaiting_expiry', 'evidence_required', 'expired_verified'\)/i);
assert.match(migration, /admin_verify_deletion_propagation/i);
assert.match(
  migration,
  /p_confirmation is distinct from 'VERIFY PROVIDER AND BACKUP EXPIRY'/i
);
assert.match(
  migration,
  /char_length\(btrim\(coalesce\(p_evidence_reference, ''\)\)\) not between 8 and 500/i
);
assert.match(migration, /provider_expires_at > v_now or v_record\.backup_expires_at > v_now/i);
assert.doesNotMatch(migration, /\bp_now\b/i);
assert.match(migration, /evidence_reference = btrim\(p_evidence_reference\)/i);

const runFunction = migration.match(
  /create or replace function public\.admin_run_school_retention[\s\S]+?\n\$\$;/i
)?.[0] || "";
assert.match(runFunction, /status = 'evidence_required'/i);
assert.doesNotMatch(runFunction, /status = 'expired_verified'/i);

assert.match(service, /admin_get_school_retention_policy/);
assert.match(service, /admin_save_school_retention_policy/);
assert.match(service, /admin_preview_school_retention/);
assert.match(service, /admin_run_school_retention/);
assert.match(service, /admin_list_deletion_propagation/);
assert.match(service, /admin_verify_deletion_propagation/);
assert.match(service, /confirmation !== RETENTION_CONFIRMATION/);
assert.match(service, /confirmation !== PROPAGATION_CONFIRMATION/);

assert.match(adminDashboard, /SchoolRetentionPolicyPanel/);
assert.match(adminDashboard, /handleRetentionLearnersDeleted/);
assert.match(adminDashboard, /clearAndVerifyLocalProgressForStudent/);
assert.match(adminDashboard, /clearLocalElAssessmentDataForStudent/);
assert.match(adminDashboard, /Open policy/);
assert.match(panel, /Preview next run/);
assert.match(panel, /No-change preview/);
assert.match(panel, /A date passing is not proof of deletion/);
assert.match(panel, /Provider and region disclosure/);
assert.match(panel, /Verify expiry evidence/);

assert.match(privacyPage, /id="providers-regions"/i);
assert.match(privacyPage, /A date passing[\s\S]*does not prove/i);
assert.match(privacyPage, /regions[\s\S]*remain unconfirmed/i);
assert.match(privacySource, /operational safeguards, not approved\s+legal periods/i);
assert.match(subprocessors, /actual provider periods remain unconfirmed/i);
assert.match(runbook, /at\s+least daily/i);
assert.match(runbook, /production scheduling is an environment operation/i);
assert.match(runbook, /Do not paste learner data/i);
assert.match(runbook, /A code gate cannot verify provider regions/i);

console.log(
  "School retention: bounded per-school policy, no-change preview, exact-confirmation "
  + "archive/delete job, immutable run evidence, and evidence-gated provider/backup "
  + "propagation verified."
);
