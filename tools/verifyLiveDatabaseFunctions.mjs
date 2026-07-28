#!/usr/bin/env node
/**
 * Ask the LIVE database whether the functions the app calls actually exist.
 *
 * Why this tool exists
 * --------------------
 * tools/verifyLearnerDataRightsBackend.mjs reads the migration FILE and asserts
 * the SQL text contains the right statements. That check was green on
 * 2026-07-27 while production could not delete a learner at all, because the
 * migration had never been applied to the hosted database. A check that never
 * touches the running system is a blank, not a pass.
 *
 * How it works
 * ------------
 * PostgREST answers a call to a function it cannot see with PGRST202. That is a
 * different response from "the function exists but you are not allowed to call
 * it" (42501) or "the function exists and rejected your arguments". So probing
 * each function with its real parameter names and null values distinguishes
 * MISSING from PRESENT without needing a service key and without changing data.
 *
 * The parameter names matter — see the note above the probe loop. Reading the
 * OpenAPI document at /rest/v1/ would be tidier, but Supabase restricts that
 * endpoint to the service_role key, and this check must work with the anon key
 * that is already in .env.local.
 *
 * Usage
 * -----
 *   node tools/verifyLiveDatabaseFunctions.mjs
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from the environment or
 * from .env.local / .env. Exits non-zero and names every missing function.
 */

import { readFileSync } from "node:fs";

// Every RPC the frontend can call, taken from the domain boundary allowlist.
// Keep this in step with src/data/boundaries/facade.js.
const REQUIRED_FUNCTIONS = {
  admin_set_teacher_account_status: ["p_account_id", "p_status", "p_rejection_reason"],
  teacher_prepare_learner_deletion: ["p_student_id", "p_requester_role", "p_verification_method"],
  teacher_delete_learner_data_staged: ["p_request_id", "p_student_id", "p_subject_ref", "p_confirmation"],
  teacher_complete_learner_deletion: ["p_request_id", "p_subject_ref", "p_cleanup_proof"],
  teacher_get_learner_deletion_status: ["p_request_id", "p_subject_ref"],
  teacher_export_learner_data: ["p_student_id", "p_requester_role", "p_verification_method"],
  teacher_list_learner_data_rights: ["p_student_id"],
  teacher_set_student_archived: ["p_student_id", "p_class_id", "p_archived"],
  teacher_transfer_student: ["p_student_id", "p_source_class_id", "p_target_class_id"],
  teacher_set_student_symbol_password: ["p_student_id", "p_sequence", "p_set_at"],
  teacher_reset_student_progress: ["p_student_id", "p_reset_at"],
  teacher_delete_saved_assessment_report: ["p_report_id"],
  teacher_delete_empty_class: ["p_class_id"],
  teacher_regenerate_class_code: ["p_class_id"],
  teacher_set_class_code_expiry: ["p_class_id", "p_expires_at"],
  teacher_set_class_leaderboard_scope: ["p_class_id", "p_scope"],
  teacher_create_demo_class: [],
  teacher_set_school: ["p_school_name"],
  teacher_class_access_log: ["p_class_id", "p_limit"],
  teacher_class_access_summary: ["p_class_id"],
  teacher_save_instructional_group: ["p_class_id", "p_name", "p_criteria", "p_student_ids", "p_evidence_snapshot"],
  teacher_review_instructional_group: ["p_group_id", "p_student_ids", "p_evidence_snapshot"],
  teacher_assign_instructional_group_follow_up: ["p_group_id", "p_owner_label", "p_activity", "p_planned_for"],
  teacher_create_insight_intervention: ["p_action_type", "p_class_id", "p_insight", "p_student_ids", "p_targets", "p_owner_label", "p_activity", "p_planned_for"],
  teacher_create_intervention_follow_up: ["p_parent_intervention_id", "p_owner_label", "p_group_label", "p_student_ids", "p_focus", "p_activity", "p_planned_for"],
  teacher_create_intervention_plan: ["p_class_id", "p_owner_label", "p_group_label", "p_student_ids", "p_focus", "p_activity", "p_planned_for"],
  teacher_update_planned_intervention: ["p_intervention_id", "p_owner_label", "p_group_label", "p_student_ids", "p_focus", "p_activity", "p_planned_for"],
  teacher_delete_planned_intervention: ["p_intervention_id"],
  teacher_mark_intervention_delivered: ["p_intervention_id"],
  teacher_record_intervention_outcome: ["p_intervention_id", "p_outcome", "p_outcome_note"],
  teacher_review_intervention: ["p_intervention_id", "p_next_review_on"],
  teacher_cancel_intervention: ["p_intervention_id", "p_reason"],
  teacher_record_insight_observation: ["p_class_id", "p_insight", "p_student_ids", "p_note", "p_owner_label", "p_follow_up_activity", "p_follow_up_on"],
  student_class_by_code: ["p_code", "p_device_id"],
  student_login: ["p_student_id", "p_sequence", "p_device_id", "p_code"],
  student_get_progress: ["p_token"],
  student_save_progress: ["p_token", "p_area", "p_key", "p_payload"],
  student_log_activity_v2: ["p_token", "p_client_event_id", "p_area", "p_item_id", "p_event", "p_payload", "p_occurred_at", "p_delivery_attempts"],
  student_report_activity_sync_health: ["p_token", "p_device_id", "p_attempted", "p_delivered", "p_recovered", "p_storage_failures", "p_pending", "p_lost", "p_oldest_pending_at"],
  get_game_leaderboard: ["p_student_token", "p_limit"],
  find_or_create_school: ["p_name"],
  list_school_names: [],
  report_app_error: ["p_client_event_id", "p_release_id", "p_fingerprint", "p_severity", "p_surface", "p_error_type", "p_source", "p_stack_frames", "p_sample_rate"]
};

function readEnvFile(path) {
  try {
    return Object.fromEntries(
      readFileSync(path, "utf8")
        .split("\n")
        .map(line => line.trim())
        .filter(line => line && !line.startsWith("#") && line.includes("="))
        .map(line => {
          const index = line.indexOf("=");
          return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
        })
    );
  } catch {
    return {};
  }
}

const fileEnv = { ...readEnvFile(".env"), ...readEnvFile(".env.local") };
const url = process.env.VITE_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || fileEnv.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "Cannot check the live database: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set.\n"
    + "This check is INCONCLUSIVE, which is not the same as passing."
  );
  process.exit(2);
}

/**
 * Probe each function with its REAL parameter names and null values.
 *
 * PostgREST resolves an overload by the arguments SUPPLIED. The first version of
 * this check POSTed an empty body, so every function taking parameters answered
 * "Could not find the function public.X WITHOUT PARAMETERS in the schema cache"
 * and was reported missing. It claimed 26 of 28 were absent from a database that
 * had just been migrated correctly — a false alarm about production, which is
 * the worst kind of check to have.
 *
 * The distinction is in the message: "without parameters" means the probe failed
 * to match an overload; a genuine absence names the arguments, as in
 * "public.teacher_prepare_learner_deletion(p_requester_role, p_student_id,
 * p_verification_method)".
 *
 * Nulls are safe here: every one of these functions validates its inputs or
 * derives the caller from auth.uid(), and the anon key is not authorised to
 * execute the teacher ones at all — "permission denied" (42501) is itself proof
 * the function exists, which is all this check claims.
 */
const missing = [];
const unreachable = [];
const present = [];

for (const [name, params] of Object.entries(REQUIRED_FUNCTIONS)) {
  const body = Object.fromEntries(params.map(param => [param, null]));
  let response;
  try {
    response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000)
    });
  } catch (error) {
    unreachable.push(`${name} (${error?.message || "network failure"})`);
    continue;
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  const notFound = payload?.code === "PGRST202";
  const overloadMiss = /without parameters/i.test(String(payload?.message || ""));
  if (notFound && !overloadMiss) {
    missing.push(`${name} — ${String(payload.message || "").slice(0, 150)}`);
  } else if (notFound && overloadMiss) {
    // The signature in this file disagrees with the database. Not "missing",
    // but not a pass either — say so rather than guessing.
    unreachable.push(`${name} (probe signature does not match the database)`);
  } else {
    present.push(name);
  }
}

if (unreachable.length) {
  console.error(`Could not reach the database for ${unreachable.length} function(s):`);
  unreachable.forEach(entry => console.error(`  - ${entry}`));
  console.error("\nThis check is INCONCLUSIVE. It has NOT passed.");
  process.exit(2);
}

if (missing.length) {
  console.error(`The live database is missing ${missing.length} of ${Object.keys(REQUIRED_FUNCTIONS).length} functions the app calls:\n`);
  missing.forEach(entry => console.error(`  MISSING  ${entry}`));
  console.error(`\n(${present.length} of ${Object.keys(REQUIRED_FUNCTIONS).length} are present.)`);
  console.error(
    "\nEvery teacher action that calls one of these fails in production right now.\n"
    + "Apply the pending migrations, then run this check again."
  );
  process.exit(1);
}

console.log(
  `Live database check passed: all ${present.length} functions the app calls are visible to PostgREST.`
);
