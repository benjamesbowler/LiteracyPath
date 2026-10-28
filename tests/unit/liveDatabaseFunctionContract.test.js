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

test("literacy mock PostgREST parameter keys match the forward migrations exactly", () => {
  const files = ["20261006090000_literacy_mock_sessions.sql", "20261006091000_literacy_mock_evidence.sql", "20261010140000_literacy_mock_evidence_v3.sql", "20261010150000_literacy_mock_followup_evidence.sql", "20261012083202_literacy_mock_adaptive_v4.sql","20261014020000_literacy_mock_device_collection.sql","20261015052954_literacy_mock_areas_v5.sql","20261015105406_literacy_mock_demand_v6.sql","20261015111510_literacy_mock_comprehension_demand_v7.sql", "20261016062452_literacy_mock_retake_v8.sql", "20261016141521_literacy_mock_boundary_v9.sql", "20261016184804_literacy_mock_boundary_v10.sql", "20261020030000_literacy_mock_progression_v11.sql", "20261028040100_literacy_mock_beginner_v12.sql"];
  const sql = files.map(file => readFileSync(new URL(`../../supabase/migrations/${file}`, import.meta.url), "utf8")).join("\n");
  for (const name of ["teacher_prepare_literacy_mock_session", "teacher_control_literacy_mock_session",
    "teacher_list_literacy_mock_sessions", "teacher_get_literacy_mock_report",
    "student_get_literacy_mock_run", "student_save_literacy_mock_run", "student_record_literacy_mock_event", "student_sync_literacy_mock_batch",
    "teacher_prepare_literacy_mock_session_v3", "teacher_prepare_literacy_mock_session_v4", "teacher_prepare_literacy_mock_session_v5", "teacher_prepare_literacy_mock_session_v6", "teacher_prepare_literacy_mock_session_v7", "teacher_prepare_literacy_mock_session_v8", "teacher_prepare_literacy_mock_session_v9", "teacher_prepare_literacy_mock_session_v10", "teacher_prepare_literacy_mock_session_v11", "teacher_prepare_literacy_mock_session_v12", "teacher_prepare_literacy_mock_fresh_check", "teacher_prepare_literacy_mock_entry_check", "teacher_get_literacy_mock_fresh_capacity", "teacher_resolve_literacy_mock_support"]) {
    const parameters = sql.match(new RegExp(`create (?:or replace )?function public\\.${name}\\(([^)]*)\\)`))?.[1];
    assert.equal(typeof parameters, "string", `${name} must exist in the migration`);
    assert.deepEqual(LIVE_DATABASE_FUNCTIONS[name], [...parameters.matchAll(/\b(p_[a-z0-9_]+)\s/g)].map(match => match[1]), name);
  }
});
