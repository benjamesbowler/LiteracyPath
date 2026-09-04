import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { RELEASE_GATES } from "../../tools/releaseGate.mjs";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const ciWorkflow = fs.readFileSync(".github/workflows/ci.yml", "utf8");
const EXPECTED_UNIT_COVERAGE_COMMAND = "node --experimental-test-coverage --test-coverage-lines=96 --test-coverage-branches=74 --test-coverage-functions=84 --test-coverage-include='src/**/*.js' --test-coverage-exclude='src/**/*.test.js' --test-coverage-exclude='src/**/*.spec.js' --test-coverage-exclude='src/**/__tests__/**' --test-coverage-exclude='src/**/__snapshots__/**' --test-coverage-exclude='src/data/generated/**' --test-coverage-exclude='src/vendor/**' --test tests/unit/*.test.js";

function assertExactUnitCoverageCommand(command) {
  assert.equal(command, EXPECTED_UNIT_COVERAGE_COMMAND);
  assert.doesNotMatch(command, /&&|\|\||;|`|\$\(/, "coverage must not use a shell fallback or control operator");

  for (const flag of [
    "--test-coverage-lines=",
    "--test-coverage-branches=",
    "--test-coverage-functions=",
    "--test-coverage-include="
  ]) {
    assert.equal(
      command.split(" ").filter(argument => argument.startsWith(flag)).length,
      1,
      `${flag} must occur exactly once`
    );
  }
}

test("aggregate unit coverage has conservative production-only floors and is the CI and release gate", () => {
  const command = packageJson.scripts["check:unit-coverage"];

  assert.equal(typeof command, "string", "package.json must define check:unit-coverage");
  assertExactUnitCoverageCommand(command);

  assert.match(
    ciWorkflow,
    /name: Aggregate unit coverage \(loaded production modules\)\s+run: npm run check:unit-coverage/,
    "CI must replace its duplicate npm test step with aggregate coverage"
  );
  assert.doesNotMatch(ciWorkflow, /name: Unit tests \(includes the full-trail simulation\)\s+run: npm test/);

  assert.deepEqual(
    RELEASE_GATES.find(gate => gate.id === "unit-coverage")?.command,
    ["npm", "run", "check:unit-coverage"],
    "the canonical release manifest must run the aggregate coverage gate"
  );
  assert.equal(RELEASE_GATES.some(gate => gate.id === "unit-tests"), false);
});

test("aggregate unit coverage rejects shell fallbacks and duplicate coverage switches", () => {
  for (const weakenedCommand of [
    `${EXPECTED_UNIT_COVERAGE_COMMAND} || true`,
    `${EXPECTED_UNIT_COVERAGE_COMMAND} --test-coverage-lines=0`,
    `${EXPECTED_UNIT_COVERAGE_COMMAND} --test-coverage-branches=0`,
    `${EXPECTED_UNIT_COVERAGE_COMMAND} --test-coverage-functions=0`,
    `${EXPECTED_UNIT_COVERAGE_COMMAND} --test-coverage-include='tools/**/*.js'`
  ]) {
    assert.throws(() => assertExactUnitCoverageCommand(weakenedCommand));
  }
});
