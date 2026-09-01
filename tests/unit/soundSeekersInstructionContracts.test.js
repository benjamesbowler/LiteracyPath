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
      expectedAction: "place_grapheme_tile",
      recordsDomain: EVIDENCE_DOMAINS.WORD_SEGMENTATION_ENCODING,
      requiresAudio: true
    }
  ));
  assert.throws(() => assertInstructionMatchesChallenge(
    getInstructionContract("word-forge-place-tile"),
    { expectedAction: "choose_story_action", recordsDomain: EVIDENCE_DOMAINS.CONNECTED_TEXT_TRANSFER }
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
    assert.equal(contracts.filter(item => item.powerId === powerId && item.phase === "decision").length, 1);
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
      .map(item => [item.powerId, item.recordsDomain]),
    [
      [SOUND_POWER_IDS.ECHO_SEARCH, EVIDENCE_DOMAINS.PHONEME_TO_GRAPHEME],
      [SOUND_POWER_IDS.CONTRAST_SORT, EVIDENCE_DOMAINS.GRAPHEME_TO_PHONEME],
      [SOUND_POWER_IDS.WORD_FORGE, EVIDENCE_DOMAINS.WORD_SEGMENTATION_ENCODING],
      [SOUND_POWER_IDS.BLEND_BRIDGE, EVIDENCE_DOMAINS.WORD_DECODING],
      [SOUND_POWER_IDS.MEMORY_DELIVERY, EVIDENCE_DOMAINS.HEART_WORD_MAPPING],
      [SOUND_POWER_IDS.STORY_POWER, EVIDENCE_DOMAINS.CONNECTED_TEXT_TRANSFER]
    ]
  );
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
