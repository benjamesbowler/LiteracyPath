import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { RELEASE_GATES } from "../../tools/releaseGate.mjs";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const ciWorkflow = fs.readFileSync(".github/workflows/ci.yml", "utf8");

test("aggregate unit coverage has conservative production-only floors and is the CI and release gate", () => {
  const command = packageJson.scripts["check:unit-coverage"];

  assert.equal(typeof command, "string", "package.json must define check:unit-coverage");
  assert.match(command, /--experimental-test-coverage/);
  assert.match(command, /--test-coverage-lines=96/);
  assert.match(command, /--test-coverage-branches=74/);
  assert.match(command, /--test-coverage-functions=84/);
  assert.match(command, /--test-coverage-include='src\/\*\*\/\*.js'/);
  assert.match(command, /--test-coverage-exclude='src\/\*\*\/\*.test.js'/);
  assert.match(command, /--test-coverage-exclude='src\/\*\*\/\*.spec.js'/);
  assert.match(command, /--test-coverage-exclude='src\/\*\*\/__tests__\/\*\*'/);
  assert.match(command, /--test-coverage-exclude='src\/\*\*\/__snapshots__\/\*\*'/);
  assert.match(command, /--test-coverage-exclude='src\/data\/generated\/\*\*'/);
  assert.match(command, /--test-coverage-exclude='src\/vendor\/\*\*'/);

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
