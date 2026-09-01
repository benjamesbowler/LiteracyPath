import assert from "node:assert/strict";
import test from "node:test";

import {
  EVIDENCE_DOMAINS,
  EVIDENCE_TARGET_KINDS,
  HEART_WORD_ACTIVITY_TYPES,
  classifyEvidenceTarget,
  eligibleEvidencePaths,
  nextEligibleEvidencePath,
  validateEvidencePath
} from "../../src/features/soundSeekers/engine/evidenceEligibility.js";

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

test("connected text and boss decoding remain separate closed target kinds", () => {
  const textTarget = {
    targetId: "text:scene-s1",
    connectedTextId: "scene-s1"
  };
  const bossTarget = {
    targetId: "novel:stone",
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
