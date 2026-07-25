import assert from "node:assert/strict";
import test from "node:test";

import { curriculumReleaseBoard } from "../../src/content/assessments/curriculumReleaseBoard.generated.js";
import { buildCurriculumReleaseBoard } from "../../src/content/curriculumReleaseBoard.js";
import { assessmentReleaseStatus } from "../../src/content/assessments/assessmentReleaseStatus.generated.js";
import { assessmentReleaseExposureBySkillId } from "../../src/content/assessments/assessmentReleaseExposure.generated.js";

test("Loop D and admin board expose every canonical decision and exact child bank", () => {
  assert.equal(curriculumReleaseBoard.rows.length, 30);
  assert.equal(
    curriculumReleaseBoard.readySkills + curriculumReleaseBoard.blockedSkills,
    30
  );
  for (const row of curriculumReleaseBoard.rows) {
    assert.ok(row.owner);
    assert.match(row.studentExposure.fingerprint, /^[0-9a-f]{64}$/);
    assert.equal(
      row.studentExposure.count,
      (assessmentReleaseExposureBySkillId[row.skillId] || []).length
    );
    if (row.releaseReady) {
      assert.equal(row.gateStatus, "READY");
      assert.equal(row.studentExposure.count, row.releaseEligibleQuestions);
      assert.ok(row.studentExposure.count > 0);
    } else {
      assert.equal(row.gateStatus, "BLOCKED");
      assert.equal(row.studentExposure.count, 0);
      assert.ok(row.reasons.length > 0);
    }
  }
});

test("known ready and blocked rows communicate owner, reason, waiver, and exposure", () => {
  const initial = curriculumReleaseBoard.rows.find(row => row.skillId === "initial_sounds");
  assert.equal(initial.gateStatus, "READY");
  assert.equal(initial.owner, "Phonics curriculum + media QA");
  assert.deepEqual(
    [initial.studentExposure.count, initial.studentExposure.level1, initial.studentExposure.level2],
    [92, 46, 46]
  );
  assert.equal(initial.waiver.excludedQuestionCount, 0);

  const finalSounds = curriculumReleaseBoard.rows.find(row => row.skillId === "final_sounds");
  assert.equal(finalSounds.waiver.excludedQuestionCount, 6);
  assert.deepEqual(finalSounds.waiver.reviewBy, ["2026-10-23"]);

  const hfw = curriculumReleaseBoard.rows.find(row => row.skillId === "hfw_1_25");
  assert.equal(hfw.gateStatus, "BLOCKED");
  assert.equal(hfw.studentExposure.count, 0);
  assert.match(hfw.reasons.join(" "), /Question-count floor/);
});

test("board construction fails closed when a blocked decision exposes content", () => {
  const exposureBySkillId = Object.fromEntries(assessmentReleaseStatus.map(status => [
    status.skillId,
    {
      count: 0,
      level1: 0,
      level2: 0,
      fingerprint: "0".repeat(64)
    }
  ]));
  const blocked = assessmentReleaseStatus.find(status => !status.releaseReady);
  exposureBySkillId[blocked.skillId].count = 1;
  assert.throws(
    () => buildCurriculumReleaseBoard({
      statuses: assessmentReleaseStatus,
      exposureBySkillId
    }),
    /blocked skill exposes/
  );
});
