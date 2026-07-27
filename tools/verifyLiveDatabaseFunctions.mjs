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
 * PostgREST answers a call to a function it cannot see with PGRST202 and HTTP
 * 404. That is a different response from "the function exists but you are not
 * allowed to call it" (401/403) or "the function exists and rejected your
 * arguments" (400/500 with a different code). So an unauthenticated call with
 * an empty body distinguishes MISSING from PRESENT without needing a service
 * key and without changing any data.
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
const REQUIRED_FUNCTIONS = [
  "teacher_prepare_learner_deletion",
  "teacher_delete_learner_data",
  "teacher_export_learner_data",
  "teacher_list_learner_data_rights",
  "teacher_set_student_archived",
  "teacher_regenerate_class_code",
  "teacher_set_class_code_expiry",
  "teacher_set_class_leaderboard_scope",
  "teacher_create_demo_class",
  "teacher_set_school",
  "teacher_class_access_log",
  "teacher_class_access_summary",
  "teacher_save_instructional_group",
  "teacher_review_instructional_group",
  "teacher_assign_instructional_group_follow_up",
  "teacher_create_insight_intervention",
  "teacher_create_intervention_follow_up",
  "teacher_record_insight_observation",
  "student_class_by_code",
  "student_login",
  "student_get_progress",
  "student_save_progress",
  "student_log_activity_v2",
  "student_report_activity_sync_health",
  "get_game_leaderboard",
  "find_or_create_school",
  "list_school_names",
  "report_app_error"
];

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

const missing = [];
const unreachable = [];
const present = [];

for (const name of REQUIRED_FUNCTIONS) {
  let response;
  try {
    response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: "{}",
      signal: AbortSignal.timeout(20000)
    });
  } catch (error) {
    unreachable.push(`${name} (${error?.message || "network failure"})`);
    continue;
  }

  let body;
  try {
    body = await response.json();
  } catch {
    body = {};
  }

  // PGRST202 is specifically "no function matches that name and signature in
  // the schema cache" — i.e. the migration was never applied.
  if (body?.code === "PGRST202") {
    missing.push(`${name} — ${String(body.message || "").slice(0, 140)}`);
  } else {
    // Anything else (permission denied, bad arguments, a raised exception)
    // proves PostgREST can see the function, which is all this check claims.
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
  console.error(`The live database is missing ${missing.length} of ${REQUIRED_FUNCTIONS.length} functions the app calls:\n`);
  missing.forEach(entry => console.error(`  MISSING  ${entry}`));
  console.error(
    "\nEvery teacher action that calls one of these fails in production right now.\n"
    + "Apply the pending migrations, then run this check again."
  );
  process.exit(1);
}

console.log(
  `Live database check passed: all ${present.length} functions the app calls are visible to PostgREST.`
);
