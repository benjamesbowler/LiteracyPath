import assert from "node:assert/strict";
import test from "node:test";

import { parseAuditInvocation } from "../../tools/runAuditScript.mjs";

test("audit runner requires an explicit check or write-report mode", () => {
  assert.throws(
    () => parseAuditInvocation(["tools/auditExample.js"]),
    /--check\|--write-report/
  );
  assert.throws(
    () => parseAuditInvocation(["--check", "../outside.js"]),
    /inside the repository/
  );
});

test("audit runner preserves target arguments after selecting a mode", () => {
  const invocation = parseAuditInvocation([
    "--check",
    "tools/checkRepoHygiene.js",
    "--check"
  ]);
  assert.equal(invocation.mode, "check");
  assert.equal(invocation.script, "tools/checkRepoHygiene.js");
  assert.deepEqual(invocation.scriptArgs, ["--check"]);
});
