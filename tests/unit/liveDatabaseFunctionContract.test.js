import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FACADE_RPCS } from "../../src/data/boundaries/facade.js";
import {
  LIVE_DATABASE_FUNCTIONS,
  compareLiveContractToFacade
} from "../../tools/liveDatabaseFunctionContract.mjs";

test("live database verifier covers every and only browser-callable RPC", () => {
  const drift = compareLiveContractToFacade();
  assert.deepEqual(drift, { missing: [], stale: [] });
  assert.equal(Object.keys(LIVE_DATABASE_FUNCTIONS).length, FACADE_RPCS.length);
});

test("live database probe signatures contain unique PostgREST parameter names", () => {
  for (const [name, parameters] of Object.entries(LIVE_DATABASE_FUNCTIONS)) {
    assert.ok(Array.isArray(parameters), `${name} must declare a parameter list`);
    assert.equal(new Set(parameters).size, parameters.length, `${name} repeats a parameter`);
    for (const parameter of parameters) {
      assert.match(parameter, /^p_[a-z0-9_]+$/, `${name} has an invalid parameter name`);
    }
  }
});

test("student focus end probe includes the explicit device destination", () => {
  assert.deepEqual(
    LIVE_DATABASE_FUNCTIONS.teacher_end_student_focus_session,
    ["p_session_id", "p_end_action"]
  );
});

test("usage export PostgREST parameter keys match the migration exactly", () => {
  const sql=readFileSync(new URL("../../supabase/migrations/20261001103000_admin_usage_insights.sql",import.meta.url),"utf8");
  for(const name of ["admin_create_usage_snapshot","admin_read_usage_snapshot","admin_release_usage_snapshot","admin_purge_usage_snapshots"]){
    const parameters=sql.match(new RegExp(`create function public\\.${name}\\(([^)]*)\\)`))?.[1];
    assert.equal(typeof parameters,"string",`${name} must exist in the migration`);
    assert.deepEqual(LIVE_DATABASE_FUNCTIONS[name], [...parameters.matchAll(/\b(p_[a-z0-9_]+)\s/g)].map(match=>match[1]),name);
  }
});
test("progress-check PostgREST parameter keys match their dedicated migration exactly", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261002170000_adaptive_progress_checks.sql", import.meta.url), "utf8");
  for (const name of ["teacher_get_progress_run", "student_get_progress_run", "teacher_save_progress_run", "student_save_progress_run", "teacher_start_progress_check_session"]) {
    const parameters = sql.match(new RegExp(`create (?:or replace )?function public\\.${name}\\(([^)]*)\\)`))?.[1];
    assert.equal(typeof parameters, "string", `${name} must exist in the migration`);
    assert.deepEqual(LIVE_DATABASE_FUNCTIONS[name], [...parameters.matchAll(/\b(p_[a-z0-9_]+)\s/g)].map(match => match[1]), name);
  }
});
