import assert from "node:assert/strict";
import test from "node:test";

import * as evidenceEligibility from "../../src/features/soundSeekers/engine/evidenceEligibility.js";

const {
  EVIDENCE_DOMAINS,
  EVIDENCE_TARGET_KINDS,
  HEART_WORD_ACTIVITY_TYPES,
  classifyEvidenceTarget,
  eligibleEvidencePaths,
  nextEligibleEvidencePath,
  normalizeHeartWordActivityType,
  validateEvidencePath
} = evidenceEligibility;

function pathsFor(input) {
  return eligibleEvidencePaths(input).map(path => ({
    domain: path.domain,
    activityType: path.activityType ?? null
  }));
}

test("the authority derives GPC evidence paths and ignores caller domain claims", () => {
  const target = {
    targetId: "sh",
    eligibleDomains: [EVIDENCE_DOMAINS.HEART_WORD_MAPPING, EVIDENCE_DOMAINS.NOVEL_DECODING]
  };

  assert.equal(classifyEvidenceTarget(target).kind, EVIDENCE_TARGET_KINDS.GPC);
  assert.deepEqual(pathsFor(target), [
    { domain: EVIDENCE_DOMAINS.PHONEME_TO_GRAPHEME, activityType: null },
    { domain: EVIDENCE_DOMAINS.GRAPHEME_TO_PHONEME, activityType: null }
  ]);
  assert.equal(validateEvidencePath({ ...target, domain: EVIDENCE_DOMAINS.PHONEME_TO_GRAPHEME }).valid, true);
  assert.equal(validateEvidencePath({
    ...target,
    domain: EVIDENCE_DOMAINS.HEART_WORD_MAPPING,
    activityType: "recognition"
  }).valid, false, "a phoneme target cannot become a heart-word mapping");
});

test("word evidence requires one matching word identity and an explicit position", () => {
  const position = { targetId: "word:ship", wordId: "ship", position: 0 };
  const wholeWord = { targetId: "word:ship", wordId: "ship", position: "whole" };

  assert.equal(classifyEvidenceTarget(position).kind, EVIDENCE_TARGET_KINDS.WORD_POSITION);
  assert.deepEqual(pathsFor(position), [
    { domain: EVIDENCE_DOMAINS.WORD_SEGMENTATION_ENCODING, activityType: null },
    { domain: EVIDENCE_DOMAINS.WORD_DECODING, activityType: null }
  ]);
  assert.equal(validateEvidencePath({ ...position, domain: EVIDENCE_DOMAINS.WORD_SEGMENTATION_ENCODING }).valid, true);
  assert.equal(validateEvidencePath({ ...wholeWord, domain: EVIDENCE_DOMAINS.WORD_DECODING }).valid, true);
  assert.equal(validateEvidencePath({
    ...position,
    wordId: "shop",
    domain: EVIDENCE_DOMAINS.WORD_SEGMENTATION_ENCODING
  }).valid, false);
  assert.equal(validateEvidencePath({
    targetId: "word:ship",
    wordId: "ship",
    domain: EVIDENCE_DOMAINS.WORD_DECODING
  }).valid, false, "a word path cannot discard its exact position");
  assert.equal(validateEvidencePath({
    ...position,
    domain: EVIDENCE_DOMAINS.GRAPHEME_TO_PHONEME
  }).valid, false);
});

test("heart-word paths are subtype-specific and cannot launder into novel decoding", () => {
  const target = {
    targetId: "hw:the",
    wordId: "the",
    activityType: "recognition"
  };

  assert.equal(classifyEvidenceTarget(target).kind, EVIDENCE_TARGET_KINDS.HEART_WORD);
  assert.deepEqual(HEART_WORD_ACTIVITY_TYPES, [
    "recognition",
    "heart_part_mapping",
    "encoding",
    "sentence_use"
  ]);
  assert.deepEqual(pathsFor(target), HEART_WORD_ACTIVITY_TYPES.map(activityType => ({
    domain: EVIDENCE_DOMAINS.HEART_WORD_MAPPING,
    activityType
  })));
  assert.equal(validateEvidencePath({ ...target, domain: EVIDENCE_DOMAINS.HEART_WORD_MAPPING }).valid, true);
  assert.equal(validateEvidencePath({ ...target, activityType: "guess", domain: EVIDENCE_DOMAINS.HEART_WORD_MAPPING }).valid, false);
  assert.equal(validateEvidencePath({ ...target, domain: EVIDENCE_DOMAINS.NOVEL_DECODING }).valid, false);

  assert.deepEqual(nextEligibleEvidencePath(
    target,
    { domain: EVIDENCE_DOMAINS.HEART_WORD_MAPPING, activityType: "recognition" }
  ), {
    domain: EVIDENCE_DOMAINS.HEART_WORD_MAPPING,
    activityType: "heart_part_mapping"
  });
});

test("the shared activity normalizer admits only imported heart subtypes", () => {
  assert.equal(normalizeHeartWordActivityType(" recognition "), "recognition");
  assert.equal(normalizeHeartWordActivityType("heart_part_mapping"), "heart_part_mapping");
  assert.equal(normalizeHeartWordActivityType("guess"), null);
  assert.equal(normalizeHeartWordActivityType(null), null);
});

test("connected text and boss decoding remain separate closed target kinds", () => {
  const textTarget = {
    targetId: "text:scene-s1",
    connectedTextId: "scene-s1"
  };
  const bossTarget = {
    targetId: "novel:forge-settlement-boss:stone",
    wordId: "stone",
    position: "whole",
    bossTransferId: "forge-settlement-boss"
  };

  assert.equal(classifyEvidenceTarget(textTarget).kind, EVIDENCE_TARGET_KINDS.CONNECTED_TEXT);
  assert.equal(validateEvidencePath({ ...textTarget, domain: EVIDENCE_DOMAINS.CONNECTED_TEXT_TRANSFER }).valid, true);
  assert.equal(validateEvidencePath({ ...textTarget, domain: EVIDENCE_DOMAINS.PHONEME_TO_GRAPHEME }).valid, false);

  assert.equal(classifyEvidenceTarget(bossTarget).kind, EVIDENCE_TARGET_KINDS.BOSS_NOVEL);
  assert.deepEqual(pathsFor(bossTarget), [
    { domain: EVIDENCE_DOMAINS.NOVEL_DECODING, activityType: null }
  ]);
  assert.equal(validateEvidencePath({ ...bossTarget, domain: EVIDENCE_DOMAINS.NOVEL_DECODING }).valid, true);
  assert.equal(validateEvidencePath({
    targetId: "hw:stone",
    wordId: "stone",
    activityType: "recognition",
    bossTransferId: "forge-settlement-boss",
    domain: EVIDENCE_DOMAINS.NOVEL_DECODING
  }).valid, false, "a heart-word target cannot borrow a boss domain");
  assert.equal(nextEligibleEvidencePath(
    bossTarget,
    { domain: EVIDENCE_DOMAINS.NOVEL_DECODING }
  ), null, "boss decoding has no laundered alternate path");
});

test("a boss target canonically binds its exact transfer and word identities", () => {
  assert.equal(typeof evidenceEligibility.bossNovelTargetId, "function");
  assert.equal(evidenceEligibility.bossNovelTargetId({
    wordId: "Stone",
    bossTransferId: "forge-settlement-boss"
  }), "novel:forge-settlement-boss:stone");

  const target = {
    targetId: "novel:forge-settlement-boss:stone",
    wordId: "stone",
    position: "whole",
    bossTransferId: "forge-settlement-boss",
    domain: EVIDENCE_DOMAINS.NOVEL_DECODING
  };
  assert.equal(validateEvidencePath(target).valid, true);
  assert.equal(validateEvidencePath({ ...target, bossTransferId: "harbor-boss" }).valid, false);
  assert.equal(validateEvidencePath({ ...target, wordId: "stove" }).valid, false);
  assert.equal(validateEvidencePath({ ...target, targetId: "novel:stone" }).valid, false);
});

test("canonical path descriptions own diversity and target-kind readiness policy", () => {
  assert.equal(typeof evidenceEligibility.describeEvidencePath, "function");

  const gpcInitial = evidenceEligibility.describeEvidencePath({
    targetId: "sh",
    position: "initial",
    domain: EVIDENCE_DOMAINS.PHONEME_TO_GRAPHEME
  });
  const gpcFinal = evidenceEligibility.describeEvidencePath({
    targetId: "sh",
    position: "final",
    domain: EVIDENCE_DOMAINS.PHONEME_TO_GRAPHEME
  });
  assert.equal(gpcInitial.identity, gpcFinal.identity, "position cannot counterfeit a second GPC direction");

  const wordPositionZero = evidenceEligibility.describeEvidencePath({
    targetId: "word:ship",
    wordId: "ship",
    position: 0,
    domain: EVIDENCE_DOMAINS.WORD_SEGMENTATION_ENCODING
  });
  const wordPositionOne = evidenceEligibility.describeEvidencePath({
    targetId: "word:ship",
    wordId: "ship",
    position: 1,
    domain: EVIDENCE_DOMAINS.WORD_SEGMENTATION_ENCODING
  });
  const wordDecodedAtZero = evidenceEligibility.describeEvidencePath({
    targetId: "word:ship",
    wordId: "ship",
    position: 0,
    domain: EVIDENCE_DOMAINS.WORD_DECODING
  });
  assert.notEqual(wordPositionZero.identity, wordPositionOne.identity);
  assert.notEqual(wordPositionZero.identity, wordDecodedAtZero.identity);
  assert.deepEqual({
    targetKind: wordPositionZero.targetKind,
    readinessMode: wordPositionZero.readinessMode
  }, {
    targetKind: EVIDENCE_TARGET_KINDS.WORD_POSITION,
    readinessMode: "practice"
  });
  assert.equal("minDistinctPaths" in wordPositionZero, false,
    "eligibility describes paths and mode but never owns the numeric threshold");
  assert.equal(Object.values(evidenceEligibility.EVIDENCE_READINESS_POLICIES)
    .every(policy => !("minDistinctPaths" in policy)), true,
  "eligibility policies cannot duplicate the mastery threshold");

  const text = evidenceEligibility.describeEvidencePath({
    targetId: "text:scene-s1",
    connectedTextId: "scene-s1",
    domain: EVIDENCE_DOMAINS.CONNECTED_TEXT_TRANSFER
  });
  const boss = evidenceEligibility.describeEvidencePath({
    targetId: "novel:forge-settlement-boss:stone",
    wordId: "stone",
    position: "whole",
    bossTransferId: "forge-settlement-boss",
    domain: EVIDENCE_DOMAINS.NOVEL_DECODING
  });
  assert.deepEqual([text.readinessMode, boss.readinessMode], ["exposure_only", "exposure_only"]);
  assert.equal("minDistinctPaths" in text, false);
  assert.equal("minDistinctPaths" in boss, false);
});
