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
import { LIVE_DATABASE_FUNCTIONS as REQUIRED_FUNCTIONS } from "./liveDatabaseFunctionContract.mjs";

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
