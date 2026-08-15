import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { questAcceptanceReportPath } from "../../tools/lib/releaseArtifactPaths.mjs";

test("generated quest acceptance reports stay out of authoritative docs", () => {
  const projectRoot = path.resolve("/tmp/literacypath-release-artifact-test");
  const reportPath = questAcceptanceReportPath("quest_device_acceptance.md", projectRoot);

  assert.equal(
    reportPath,
    path.join(projectRoot, ".artifacts", "quest-acceptance", "quest_device_acceptance.md")
  );
  assert.equal(reportPath.includes(`${path.sep}docs${path.sep}`), false);
});

test("quest acceptance artifact paths reject directories", () => {
  assert.throws(
    () => questAcceptanceReportPath("nested/report.md", "/tmp/literacypath"),
    /plain file names/
  );
});
