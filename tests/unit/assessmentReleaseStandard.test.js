import assert from "node:assert/strict";
import test from "node:test";

import {
  ASSESSMENT_RELEASE_MANAGED_SKILL_IDS,
  assessmentReleaseStandard,
  evaluateAssessmentSkillReleaseSummary,
  getAssessmentQuestionAccessibilityIssues
} from "../../src/content/releaseStandard.js";
import {
  assessmentReleaseStatus,
  assessmentReleaseStatusVersion
} from "../../src/content/assessments/assessmentReleaseStatus.generated.js";

function passingSummary(skillId = "initial_sounds") {
  return {
    skillId,
    levels: {
      1: {
        eligibleQuestionCount: assessmentReleaseStandard.defaults.questionCount.minimumPerLevel,
        uniqueTargetCount: assessmentReleaseStandard.defaults.balance.minimumUniqueTargetsPerLevel,
        maximumTargetShare: assessmentReleaseStandard.defaults.balance.maximumTargetSharePerLevel
      },
      2: {
        eligibleQuestionCount: assessmentReleaseStandard.defaults.questionCount.minimumPerLevel,
        uniqueTargetCount: assessmentReleaseStandard.defaults.balance.minimumUniqueTargetsPerLevel,
        maximumTargetShare: assessmentReleaseStandard.defaults.balance.maximumTargetSharePerLevel
      }
    },
    media: {
      missingRequiredImages: 0,
      missingRequiredAudio: 0,
      wiringDefects: 0
    },
    accessibility: {
      issueCount: 0
    }
  };
}

test("the canonical standard owns all four assessment publication dimensions", () => {
  assert.equal(assessmentReleaseStandard.managedSkillIds.length, 30);
  assert.deepEqual(
    Object.keys(assessmentReleaseStandard.skills).sort(),
    [...ASSESSMENT_RELEASE_MANAGED_SKILL_IDS].sort()
  );
  const decision = evaluateAssessmentSkillReleaseSummary(passingSummary());
  assert.equal(decision.releaseReady, true);
  assert.deepEqual(decision.dimensions, {
    questionCount: "pass",
    balance: "pass",
    media: "pass",
    accessibility: "pass"
  });
});

test("a failure in any one canonical dimension blocks publication", () => {
  const variants = [
    summary => {
      summary.levels[1].eligibleQuestionCount -= 1;
    },
    summary => {
      summary.levels[1].maximumTargetShare += 0.01;
    },
    summary => {
      summary.media.wiringDefects = 1;
    },
    summary => {
      summary.accessibility.issueCount = 1;
    }
  ];
  for (const mutate of variants) {
    const summary = structuredClone(passingSummary());
    mutate(summary);
    assert.equal(evaluateAssessmentSkillReleaseSummary(summary).releaseReady, false);
  }
});

test("accessibility rejects unlabeled choices but accepts constructed sound ordering", () => {
  assert.deepEqual(
    getAssessmentQuestionAccessibilityIssues({
      prompt: "Choose.",
      answerOptions: [{ image: "/cat.webp" }, "dog"]
    }, { skillId: "nouns" }),
    ["unlabeled answer choice"]
  );
  assert.deepEqual(
    getAssessmentQuestionAccessibilityIssues({
      prompt: "Put the sounds in order.",
      answerOptions: ["cat"],
      soundTiles: ["c", "a", "t"],
      targetWord: "cat"
    }, { skillId: "cvc_short_vowels" }),
    []
  );
});

test("generated publication status covers the canonical skill set and version", () => {
  assert.equal(assessmentReleaseStatusVersion, assessmentReleaseStandard.version);
  assert.deepEqual(
    assessmentReleaseStatus.map(status => status.skillId).sort(),
    [...ASSESSMENT_RELEASE_MANAGED_SKILL_IDS].sort()
  );
});
