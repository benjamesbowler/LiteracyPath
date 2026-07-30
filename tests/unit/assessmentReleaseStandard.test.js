import assert from "node:assert/strict";
import test from "node:test";

import {
  ASSESSMENT_RELEASE_MANAGED_SKILL_IDS,
  assessmentReleaseStandard,
  buildAssessmentReleaseBalanceReport,
  evaluateAssessmentSkillReleaseSummary,
  getAssessmentReleaseMediaRequirement,
  getAssessmentQuestionAccessibilityIssues,
  selectAssessmentReleaseQuestions
} from "../../src/content/releaseStandard.js";
import {
  assessmentReleaseStatus,
  assessmentReleaseStatusVersion
} from "../../src/content/assessments/assessmentReleaseStatus.generated.js";
import {
  assessmentReleaseExposureVersion
} from "../../src/content/assessments/assessmentReleaseExposure.generated.js";
import {
  getLevelOneContentQualityIssues
} from "../../src/data/levelOneContentQuality.js";
import { loadAssessmentSkillBank } from "../../src/data/loadAssessmentSkillBank.js";
import { SKILL_LEVEL_GAP_RUNTIME_SHARDS } from "../../src/data/runtimeQuestionShardConfig.js";
import { getQuestionRoutingFormat } from "../../src/data/skillTemplateRouting.js";
import { isImageEssential } from "../../tools/phonicsRuntimeUtils.js";

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

test("the canonical standard owns the four authored-content publication dimensions", () => {
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

test("explicit no-audio HFW sentence speech is not treated as a missing audio asset", () => {
  const requirement = getAssessmentReleaseMediaRequirement("hfw_1_25", {
    formatType: "HFW_SENTENCE_SPELL_L2P1_04",
    prompt: "Listen to the sentence. Spell the missing word.",
    sentenceAudio: "The small bird sat quietly.",
    disableAudio: true,
    noAudio: true
  }, {
    template: "HFW_SENTENCE_SPELL_L2P1_04"
  });

  assert.equal(requirement.requiresAudio, false);
});

test("generated publication status covers the canonical skill set and version", () => {
  assert.equal(assessmentReleaseStatusVersion, assessmentReleaseStandard.version);
  assert.equal(assessmentReleaseExposureVersion, assessmentReleaseStandard.version);
  assert.deepEqual(
    assessmentReleaseStatus.map(status => status.skillId).sort(),
    [...ASSESSMENT_RELEASE_MANAGED_SKILL_IDS].sort()
  );
  for (const status of assessmentReleaseStatus) {
    assert.ok(Number.isInteger(status.authoredQuestions));
    assert.ok(Number.isInteger(status.approvedQuestions));
    assert.ok(Number.isInteger(status.runtimeSelectableQuestions));
    assert.ok(Number.isInteger(status.unapprovedAudioQuestions));
    assert.ok(["pass", "fail", "blocked"].includes(status.dimensions.runtimeSelectability));
    assert.ok(status.authoredQuestions >= status.approvedQuestions);
    assert.ok(status.approvedQuestions >= status.runtimeSelectableQuestions);
    assert.equal(
      status.runtimeSelectableQuestions,
      status.releaseReady ? status.releaseEligibleQuestions : 0
    );
  }
});

test("canonical format routing and media rules accept the designed language tasks", () => {
  assert.equal(
    getQuestionRoutingFormat({
      templateType: "PREPOSITION_IMAGE_SENTENCE_FIT",
      formatType: "PREPOSITION_TEXT_CHOICE"
    }),
    "PREPOSITION_TEXT_CHOICE"
  );
  assert.equal(isImageEssential({
    skillId: "homophones_homonyms",
    level: 1,
    formatType: "HOMOPHONE_MEANING",
    prompt: "Which word means ocean water?"
  }), false);
  assert.equal(isImageEssential({
    skillId: "plurals",
    level: 1,
    formatType: "PLURAL_SPELLING_CONTEXT",
    prompt: "Which spelling means more than one cat?"
  }), true);
});

test("Level 1 quality allowlists include reviewed familiar targets and retain the hard-word block", () => {
  for (const question of [
    { skillId: "r_controlled_vowels", targetWord: "turn" },
    { skillId: "plurals", targetWord: "stars" },
    { skillId: "antonyms_synonyms", targetWord: "near" }
  ]) {
    assert.deepEqual(getLevelOneContentQualityIssues({
      ...question,
      level: 1,
      imagePath: "/reviewed-target.webp"
    }), []);
  }
  assert.ok(
    getLevelOneContentQualityIssues({
      skillId: "antonyms_synonyms",
      targetWord: "rough",
      level: 1,
      imagePath: "/rough.webp"
    }).includes("hard or abstract Level 1 target: rough")
  );
});

test("runtime shard generation retains every statically loadable skill-gap shard", () => {
  assert.equal(SKILL_LEVEL_GAP_RUNTIME_SHARDS.length, 18);
  assert.ok(SKILL_LEVEL_GAP_RUNTIME_SHARDS.some(item => item.shard === "rhyming"));
  assert.ok(SKILL_LEVEL_GAP_RUNTIME_SHARDS.some(item => item.shard === "short-vowel-discrimination"));
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

test("Initial Sounds student loader uses the gate-proven v3 bank after cutover", async () => {
  const published = await loadAssessmentSkillBank("initial_sounds");

  assert.equal(published.length, 150);
  assert.equal(published.filter(question => question.level === 1).length, 75);
  assert.equal(published.filter(question => question.level === 2).length, 75);
  for (const question of published) {
    assert.equal(question.source, "skills_rebuild_v3_2026_08", question.id);
    assert.equal(question.bankStandardVersion, 3, question.id);
  }
});

test("Short Vowels and Nouns publish every gate-proven v3 runtime format", async () => {
  const expectations = {
    short_vowel_discrimination: {
      count: 60,
      perLevel: 30,
      formats: ["LISTEN_CHOOSE_VOWEL", "PICTURE_TO_PRINT_MATCH", "SHORT_VOWEL_IMAGE_GROUP_SELECT"]
    },
    nouns: {
      count: 48,
      perLevel: 24,
      formats: ["GRAMMAR_CONTRAST", "GRAMMAR_IMAGE_CHOICE", "GRAMMAR_SENTENCE_FIT", "GRAMMAR_WORD_CHOICE"]
    }
  };

  for (const [skillId, expectation] of Object.entries(expectations)) {
    const published = await loadAssessmentSkillBank(skillId);
    assert.equal(published.length, expectation.count, skillId);
    assert.equal(published.filter(question => question.level === 1).length, expectation.perLevel, skillId);
    assert.equal(published.filter(question => question.level === 2).length, expectation.perLevel, skillId);
    assert.equal(published.every(question => question.source === "skills_rebuild_v3_2026_08"), true, skillId);
    assert.deepEqual(
      [...new Set(published.map(question => question.formatType))].sort(),
      expectation.formats,
      skillId
    );
  }
});
