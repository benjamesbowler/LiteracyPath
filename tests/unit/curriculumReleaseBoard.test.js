import assert from "node:assert/strict";
import test from "node:test";

import { curriculumReleaseBoard } from "../../src/content/assessments/curriculumReleaseBoard.generated.js";
import { assessmentRebuildStatusBySkillId } from "../../src/content/assessments/v3/assessmentRebuildStatus.generated.js";

test("the admin release board mirrors the current v3 publication gate", () => {
  assert.equal(curriculumReleaseBoard.schemaVersion, 3);
  assert.equal(curriculumReleaseBoard.rows.length, 30);
  assert.equal(curriculumReleaseBoard.readySkills, 30);
  assert.equal(curriculumReleaseBoard.blockedSkills, 0);

  for (const row of curriculumReleaseBoard.rows) {
    const status = assessmentRebuildStatusBySkillId[row.skillId];
    assert.ok(status, row.skillId);
    assert.equal(row.standardVersion, status.standardVersion, row.skillId);
    assert.equal(row.releaseReady, true, row.skillId);
    assert.equal(row.gateStatus, "READY", row.skillId);
    assert.equal(
      row.studentExposure.count,
      Number(status.counts.level1) + Number(status.counts.level2),
      row.skillId
    );
    assert.ok(Object.values(row.dimensions).every(value => value === "pass"), row.skillId);
  }
});
