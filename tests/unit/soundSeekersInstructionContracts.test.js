import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  SOUND_POWER_IDS,
  SOUND_SEEKERS_INSTRUCTIONS,
  assertInstructionMatchesChallenge,
  getInstructionContract
} from "../../src/features/soundSeekers/content/instructionContracts.js";
import { EVIDENCE_DOMAINS } from "../../src/features/soundSeekers/engine/challengeContract.js";
import {
  SOUND_SEEKERS_WORDS,
  collectPronunciationAudioBlockers,
  assertShippingPronunciationLexicon
} from "../../src/features/soundSeekers/content/pronunciationLexicon.js";
import { getPhonemeAudio } from "../../src/data/phonemeAudioBank.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourcePath = path.join(repositoryRoot, "public/audio/quest-v2/instructions/SOURCE.md");

function readSourceManifest() {
  const source = readFileSync(sourcePath, "utf8");
  const match = /```json\n([\s\S]*?)\n```/u.exec(source);
  assert.ok(match, "SOURCE.md must contain a machine-readable JSON manifest");
  return JSON.parse(match[1]);
}

function targetIdentityFor(contract) {
  if ([EVIDENCE_DOMAINS.PHONEME_TO_GRAPHEME, EVIDENCE_DOMAINS.GRAPHEME_TO_PHONEME].includes(contract.recordsDomain)) {
    return { targetId: "sh" };
  }
  if ([EVIDENCE_DOMAINS.WORD_DECODING, EVIDENCE_DOMAINS.WORD_SEGMENTATION_ENCODING].includes(contract.recordsDomain)) {
    return {
      targetId: "word:ship",
      wordId: "ship",
      position: contract.recordsDomain === EVIDENCE_DOMAINS.WORD_SEGMENTATION_ENCODING ? 0 : "whole"
    };
  }
  if (contract.recordsDomain === EVIDENCE_DOMAINS.HEART_WORD_MAPPING) {
    return { targetId: "hw:the", wordId: "the", activityType: "recognition" };
  }
  if (contract.recordsDomain === EVIDENCE_DOMAINS.CONNECTED_TEXT_TRANSFER) {
    return { targetId: "text:scene-s1", connectedTextId: "scene-s1" };
  }
  if (contract.recordsDomain === EVIDENCE_DOMAINS.NOVEL_DECODING) {
    return {
      targetId: "novel:forge-settlement-boss:stone",
      wordId: "stone",
      position: "whole",
      bossTransferId: "forge-settlement-boss"
    };
  }
  return {};
}

test("instruction text, action, and evidence domain describe the same child action", () => {
  assert.deepEqual(getInstructionContract("word-forge-place-tile"), {
    instructionId: "word-forge-place-tile",
    powerId: SOUND_POWER_IDS.WORD_FORGE,
    phase: "decision",
    childText: "Choose the letter or letter team for this sound.",
    childAudio: "quest/instructions/word-forge-place-tile",
    cue: "whole_word",
    expectedAction: "place_grapheme_tile",
    recordsDomain: "word_segmentation_encoding",
    silenceIsIntentional: false
  });

  assert.doesNotThrow(() => assertInstructionMatchesChallenge(
    getInstructionContract("word-forge-place-tile"),
    {
      instructionId: "word-forge-place-tile",
      powerId: SOUND_POWER_IDS.WORD_FORGE,
      expectedAction: "place_grapheme_tile",
      recordsDomain: EVIDENCE_DOMAINS.WORD_SEGMENTATION_ENCODING,
      requiresAudio: true,
      ...targetIdentityFor(getInstructionContract("word-forge-place-tile"))
    }
  ));
  assert.throws(() => assertInstructionMatchesChallenge(
    getInstructionContract("word-forge-place-tile"),
    {
      instructionId: "word-forge-place-tile",
      powerId: SOUND_POWER_IDS.WORD_FORGE,
      expectedAction: "choose_story_action",
      recordsDomain: EVIDENCE_DOMAINS.CONNECTED_TEXT_TRANSFER,
      ...targetIdentityFor(getInstructionContract("word-forge-place-tile"))
    }
  ), /action/i);
});

test("all six Sound Powers declare teach, replay, and a decision contract without internal child copy", () => {
  const contracts = Object.values(SOUND_SEEKERS_INSTRUCTIONS);
  const powers = Object.values(SOUND_POWER_IDS);
  assert.ok(contracts.length >= powers.length * 3);
  for (const powerId of powers) {
    for (const phase of ["teach", "replay"]) {
      assert.ok(contracts.find(item => item.powerId === powerId && item.phase === phase), `${powerId}-${phase}`);
    }
    assert.ok(contracts.some(item => item.powerId === powerId && item.phase === "decision"), `${powerId}-decision`);
  }
  for (const contract of contracts) {
    assert.doesNotMatch(contract.childText, /\b[a-z]+_[a-z]+\b/u, contract.instructionId);
    assert.ok(contract.expectedAction);
    if (contract.phase === "decision") assert.ok(contract.recordsDomain);
    else assert.equal(contract.recordsDomain, null, `${contract.instructionId} must not authorize evidence`);
    assert.ok(contract.silenceIsIntentional || contract.childAudio);
  }
});

test("the morphology introduction is an unscored exact instruction", () => {
  const contract = getInstructionContract("morphology-teach");
  assert.deepEqual(contract, {
    instructionId: "morphology-teach",
    powerId: SOUND_POWER_IDS.WORD_FORGE,
    phase: "teach",
    childText: "Endings can change or extend a word.",
    childAudio: "quest/instructions/morphology-teach",
    cue: "morphology",
    expectedAction: "introduce_word_ending",
    recordsDomain: null,
    silenceIsIntentional: false
  });
});

test("only exact scored decisions carry their canonical evidence domain", () => {
  assert.deepEqual(
    Object.values(SOUND_SEEKERS_INSTRUCTIONS)
      .filter(item => item.phase === "decision")
      .map(item => [item.instructionId, item.powerId, item.expectedAction, item.recordsDomain]),
    [
      ["echo-search-find-source", SOUND_POWER_IDS.ECHO_SEARCH, "reveal_matching_grapheme", EVIDENCE_DOMAINS.PHONEME_TO_GRAPHEME],
      ["contrast-sort-place-sound", SOUND_POWER_IDS.CONTRAST_SORT, "place_sound_token", EVIDENCE_DOMAINS.GRAPHEME_TO_PHONEME],
      ["contrast-sort-place-decoded-word", SOUND_POWER_IDS.CONTRAST_SORT, "place_decoded_word_token", EVIDENCE_DOMAINS.WORD_DECODING],
      ["contrast-sort-place-heart-word", SOUND_POWER_IDS.CONTRAST_SORT, "place_heart_word_token", EVIDENCE_DOMAINS.HEART_WORD_MAPPING],
      ["word-forge-place-tile", SOUND_POWER_IDS.WORD_FORGE, "place_grapheme_tile", EVIDENCE_DOMAINS.WORD_SEGMENTATION_ENCODING],
      ["blend-bridge-choose-meaning", SOUND_POWER_IDS.BLEND_BRIDGE, "choose_blended_meaning", EVIDENCE_DOMAINS.WORD_DECODING],
      ["blend-bridge-choose-novel-meaning", SOUND_POWER_IDS.BLEND_BRIDGE, "choose_novel_decoded_meaning", EVIDENCE_DOMAINS.NOVEL_DECODING],
      ["memory-delivery-deliver-sound", SOUND_POWER_IDS.MEMORY_DELIVERY, "deliver_sound_cue", EVIDENCE_DOMAINS.PHONEME_TO_GRAPHEME],
      ["memory-delivery-deliver-decoded-word", SOUND_POWER_IDS.MEMORY_DELIVERY, "deliver_decoded_word_cue", EVIDENCE_DOMAINS.WORD_DECODING],
      ["memory-delivery-deliver-heart-word", SOUND_POWER_IDS.MEMORY_DELIVERY, "deliver_heart_word_cue", EVIDENCE_DOMAINS.HEART_WORD_MAPPING],
      ["memory-delivery-follow-decoded-instruction", SOUND_POWER_IDS.MEMORY_DELIVERY, "follow_decoded_instruction", EVIDENCE_DOMAINS.CONNECTED_TEXT_TRANSFER],
      ["story-power-choose-story-action", SOUND_POWER_IDS.STORY_POWER, "choose_story_action", EVIDENCE_DOMAINS.CONNECTED_TEXT_TRANSFER]
    ]
  );
});

test("the authored boss transfer has one exact Blend Bridge novel-decoding contract", () => {
  const contract = getInstructionContract("blend-bridge-choose-novel-meaning");
  assert.deepEqual(contract, {
    instructionId: "blend-bridge-choose-novel-meaning",
    powerId: SOUND_POWER_IDS.BLEND_BRIDGE,
    phase: "decision",
    childText: "Blend the new word. Choose its picture.",
    childAudio: "quest/instructions/blend-bridge-choose-novel-meaning",
    cue: "grapheme_sequence",
    expectedAction: "choose_novel_decoded_meaning",
    recordsDomain: EVIDENCE_DOMAINS.NOVEL_DECODING,
    silenceIsIntentional: false
  });
  assert.equal(assertInstructionMatchesChallenge(contract, {
    instructionId: contract.instructionId,
    powerId: contract.powerId,
    expectedAction: contract.expectedAction,
    recordsDomain: contract.recordsDomain,
    requiresAudio: true,
    ...targetIdentityFor(contract)
  }), true);
  assert.throws(() => assertInstructionMatchesChallenge(
    getInstructionContract("blend-bridge-choose-meaning"),
    {
      instructionId: "blend-bridge-choose-novel-meaning",
      powerId: SOUND_POWER_IDS.BLEND_BRIDGE,
      expectedAction: "choose_novel_decoded_meaning",
      recordsDomain: EVIDENCE_DOMAINS.NOVEL_DECODING,
      requiresAudio: true,
      ...targetIdentityFor(contract)
    }
  ), /instruction|action|records domain/iu);
});

test("every Contrast Sort and Memory Delivery decision variant matches only its exact challenge", () => {
  const variants = Object.values(SOUND_SEEKERS_INSTRUCTIONS)
    .filter(contract => contract.phase === "decision")
    .filter(contract => [SOUND_POWER_IDS.CONTRAST_SORT, SOUND_POWER_IDS.MEMORY_DELIVERY].includes(contract.powerId));
  assert.equal(variants.length, 7);

  for (const contract of variants) {
    const challenge = {
      instructionId: contract.instructionId,
      powerId: contract.powerId,
      expectedAction: contract.expectedAction,
      recordsDomain: contract.recordsDomain,
      requiresAudio: true,
      ...targetIdentityFor(contract)
    };
    assert.equal(assertInstructionMatchesChallenge(contract, challenge), true, contract.instructionId);
    assert.throws(
      () => assertInstructionMatchesChallenge(contract, { ...challenge, recordsDomain: EVIDENCE_DOMAINS.NOVEL_DECODING }),
      /records domain/i,
      `${contract.instructionId} must not launder evidence into another domain`
    );
    assert.throws(
      () => assertInstructionMatchesChallenge(contract, { ...challenge, expectedAction: "collect_reward" }),
      /action/i,
      `${contract.instructionId} must not authorize another action`
    );
    assert.throws(
      () => assertInstructionMatchesChallenge(contract, { ...challenge, instructionId: "word-forge-place-tile" }),
      /instruction/i,
      `${contract.instructionId} must not borrow another instruction id`
    );
    assert.throws(
      () => assertInstructionMatchesChallenge(contract, { ...challenge, powerId: SOUND_POWER_IDS.STORY_POWER }),
      /power/i,
      `${contract.instructionId} must not cross powers`
    );
  }
});

test("decision matching rejects incomplete challenge contracts instead of guessing a domain", () => {
  const contract = getInstructionContract("contrast-sort-place-sound");
  for (const missing of ["instructionId", "powerId", "expectedAction", "recordsDomain"]) {
    const challenge = {
      instructionId: contract?.instructionId,
      powerId: contract?.powerId,
      expectedAction: contract?.expectedAction,
      recordsDomain: contract?.recordsDomain,
      requiresAudio: true,
      ...targetIdentityFor(contract)
    };
    delete challenge[missing];
    assert.throws(() => assertInstructionMatchesChallenge(contract, challenge), new RegExp(missing.replace(/[A-Z]/gu, letter => ` ${letter.toLowerCase()}`), "iu"));
  }
});

test("exact instruction tuples still reject a target that cannot own their evidence path", () => {
  const heart = getInstructionContract("memory-delivery-deliver-heart-word");
  assert.throws(() => assertInstructionMatchesChallenge(heart, {
    instructionId: heart.instructionId,
    powerId: heart.powerId,
    expectedAction: heart.expectedAction,
    recordsDomain: heart.recordsDomain,
    targetId: "sh",
    activityType: "recognition",
    requiresAudio: true
  }), /target|eligible|evidence path/iu);

  const boss = getInstructionContract("blend-bridge-choose-novel-meaning");
  assert.throws(() => assertInstructionMatchesChallenge(boss, {
    instructionId: boss.instructionId,
    powerId: boss.powerId,
    expectedAction: boss.expectedAction,
    recordsDomain: boss.recordsDomain,
    targetId: "hw:the",
    wordId: "the",
    activityType: "recognition",
    bossTransferId: "forge-settlement-boss",
    requiresAudio: true
  }), /target|eligible|evidence path/iu);
});

test("Word Forge and Blend Bridge use early-reader language, not internal phonics jargon", () => {
  for (const contract of Object.values(SOUND_SEEKERS_INSTRUCTIONS)) {
    if ([SOUND_POWER_IDS.WORD_FORGE, SOUND_POWER_IDS.BLEND_BRIDGE].includes(contract.powerId)) {
      assert.doesNotMatch(contract.childText, /grapheme/ui, contract.instructionId);
    }
  }
});

test("every non-silent instruction resolves to a provenance-locked recording", () => {
  const source = readSourceManifest();
  assert.equal(source.schemaVersion, 1);
  for (const contract of Object.values(SOUND_SEEKERS_INSTRUCTIONS).filter(item => !item.silenceIsIntentional)) {
    const record = source.assets.find(asset => asset.instructionId === contract.instructionId);
    assert.ok(record, contract.instructionId);
    assert.equal(record.childText, contract.childText);
    assert.equal(record.humanListeningApproved, false);
    assert.ok(record.durationSeconds > 0, contract.instructionId);
    assert.match(record.sha256, /^[a-f0-9]{64}$/u, contract.instructionId);
    const absolutePath = path.join(repositoryRoot, "public", record.path.replace(/^\//u, ""));
    assert.ok(existsSync(absolutePath), record.path);
    assert.equal(createHash("sha256").update(readFileSync(absolutePath)).digest("hex"), record.sha256);
  }
});

test("twenty-one contextual blockers stay in a five-unit human review gate", () => {
  const blocked = collectPronunciationAudioBlockers(SOUND_SEEKERS_WORDS);
  assert.equal(blocked.length, 21);
  assert.deepEqual([...new Set(blocked.map(item => item.soundKey))].sort(), ["ear_lax", "ed_id", "once_onset", "schwa", "ure_no_y"]);
  for (const item of blocked) {
    assert.equal(getPhonemeAudio(item.soundKey), "", `${item.word}:${item.grapheme}:${item.soundKey}`);
  }
  assert.throws(
    () => assertShippingPronunciationLexicon(SOUND_SEEKERS_WORDS, { release: true }),
    /pronunciation release blockers \(21\)/u
  );
});
