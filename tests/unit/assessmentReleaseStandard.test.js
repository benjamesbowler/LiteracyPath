import assert from "node:assert/strict";
import test from "node:test";

import {
  ASSESSMENT_RELEASE_MANAGED_SKILL_IDS,
  assessmentReleaseStandard,
  buildAssessmentReleaseBalanceReport,
  evaluateAssessmentSkillReleaseSummary,
  getAssessmentQuestionAccessibilityIssues,
  selectAssessmentReleaseQuestions
} from "../../src/content/releaseStandard.js";
import {
  assessmentReleaseStatus,
  assessmentReleaseStatusBySkillId,
  assessmentReleaseStatusVersion
} from "../../src/content/assessments/assessmentReleaseStatus.generated.js";
import { loadAssessmentSkillBank } from "../../src/data/loadAssessmentSkillBank.js";

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
  for (const status of assessmentReleaseStatus) {
    assert.ok(Number.isInteger(status.authoredQuestions));
    assert.ok(Number.isInteger(status.approvedQuestions));
    assert.ok(Number.isInteger(status.runtimeSelectableQuestions));
    assert.ok(Number.isInteger(status.unapprovedAudioQuestions));
    assert.ok(status.authoredQuestions >= status.approvedQuestions);
    assert.ok(status.approvedQuestions >= status.runtimeSelectableQuestions);
    assert.equal(
      status.runtimeSelectableQuestions,
      status.releaseReady ? status.releaseEligibleQuestions : 0
    );
  }
});

test("Initial Sounds canonical selection caps phoneme, prompt-family, response-format, and listen-and-find concentration", () => {
  const makeQuestion = (id, level, formatType, itemKey, length = 3) => ({
    id,
    level,
    formatType,
    itemKey,
    targetWord: `${itemKey}${"x".repeat(length - 1)}`,
    imageCards: formatType === "INITIAL_SOUND_PAIR_SELECT"
      ? [{ word: `${itemKey}${"x".repeat(length - 1)}` }]
      : []
  });
  const questions = [
    ..."bcdfghjklmnpqrstvwxyz".split("").flatMap((phoneme, index) => [
      makeQuestion(`l1-${phoneme}-1`, 1, "FIRST_SOUND", phoneme, 3 + (index % 2)),
      makeQuestion(`l1-${phoneme}-2`, 1, "FIRST_SOUND", phoneme, 4)
    ]),
    ...Array.from({ length: 20 }, (_, index) => (
      makeQuestion(`l2-a-${index}`, 2, "FIRST_SOUND", "a", 6)
    )),
    ...Array.from({ length: 20 }, (_, index) => (
      makeQuestion(`l2-b-${index}`, 2, "FIRST_SOUND", "b", 7)
    )),
    ..."abcdefghijklmnopqrstuvwxyz".split("").flatMap((phoneme, index) => [
      makeQuestion(`pair-${phoneme}-easy`, 1, "INITIAL_SOUND_PAIR_SELECT", phoneme, 3),
      makeQuestion(`pair-${phoneme}-hard`, 1, "INITIAL_SOUND_PAIR_SELECT", phoneme, 7 + (index % 3))
    ])
  ];
  const selected = selectAssessmentReleaseQuestions("initial_sounds", questions);
  const released = selected.map(item => ({ ...item.question, releaseLevel: item.releaseLevel }));
  const report = buildAssessmentReleaseBalanceReport("initial_sounds", released);

  assert.equal(released.filter(question => question.releaseLevel === 1).length, 46);
  assert.equal(released.filter(question => question.releaseLevel === 2).length, 46);
  assert.equal(report.pass, true);
  assert.ok(report.levels[1].maximumPhonemeShare <= 0.2);
  assert.ok(report.levels[2].maximumPhonemeShare <= 0.2);
  assert.ok(report.levels[1].maximumResponseFormatShare <= report.levels[1].caps.maximumResponseFormatShare);
  assert.ok(report.levels[2].maximumPromptFamilyShare <= report.levels[2].caps.maximumPromptFamilyShare);
  assert.ok(report.levels[2].listenAndFindShare < report.levels[2].caps.maximumListenAndFindShare);
});

test("Initial Sounds student loader returns exactly the audited publication IDs and levels", async () => {
  const status = assessmentReleaseStatusBySkillId.initial_sounds;
  const expected = new Map(status.publishedQuestions.map(item => [
    item.questionId,
    item.level
  ]));
  const published = await loadAssessmentSkillBank("initial_sounds");

  assert.equal(status.publicationMode, "audited-id-set");
  assert.equal(published.length, expected.size);
  assert.equal(published.filter(question => question.level === 1).length, 46);
  assert.equal(published.filter(question => question.level === 2).length, 46);
  for (const question of published) {
    assert.equal(expected.get(question.id), question.level, question.id);
    assert.equal(question.releaseStandardVersion, assessmentReleaseStatusVersion);
  }
});
