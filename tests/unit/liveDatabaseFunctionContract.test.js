import test from "node:test";
import assert from "node:assert/strict";
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
