import assert from "node:assert/strict";
import test from "node:test";

import { QUEST_STOPS } from "../../src/data/questSequence.js";
import { getInstructionContract } from "../../src/features/soundSeekers/content/instructionContracts.js";
import {
  createTeachSequence,
  reduceTeachSequence
} from "../../src/features/soundSeekers/engine/teachSequence.js";
import { getPronunciation } from "../../src/features/soundSeekers/content/pronunciationLexicon.js";
import { SOUND_SEEKERS_TEACH_TARGETS } from "../../src/features/soundSeekers/content/teachTargetMetadata.js";

const stop = id => QUEST_STOPS.find(item => item.id === id);

test("all six targets at s7 are taught before its first scored challenge", () => {
  const sequence = createTeachSequence(stop("s7"), []);
  assert.equal(sequence.items.length, 6);
  assert.equal(sequence.items.every(item => item.scored === false), true);
  assert.equal(sequence.nextPhase, "challenge");
  assert.equal(sequence.teachIndex, 0);
  assert.equal(sequence.currentItem.targetId, "j");
  for (const item of sequence.items) {
    assert.doesNotMatch(item.childText, /\b[a-z]+_[a-z]+\b/u);
    assert.doesNotMatch(item.childLabel, /\b[a-z]+_[a-z]+\b/u);
    assert.ok(item.graphemeDisplay);
    assert.ok(item.mouthCue);
    assert.ok(item.anchorImage?.id);
    assert.ok(item.workedExample);
    const contract = getInstructionContract(item.instructionId);
    assert.ok(contract, item.instructionId);
    assert.equal(item.childText, contract.childText);
    assert.equal(item.childAudio, contract.childAudio);
  }
});

test("a checkpoint retains the teach index and a replay cannot create scored evidence", () => {
  const initial = createTeachSequence(stop("s7"), []);
  const afterReplay = reduceTeachSequence(initial, { type: "replay" });
  assert.equal(afterReplay.teachIndex, 0);
  assert.equal(afterReplay.scored, false);

  const afterTeach = reduceTeachSequence(afterReplay, { type: "complete-teach" });
  assert.equal(afterTeach.teachIndex, 1);
  const restored = reduceTeachSequence(afterTeach, { type: "restore", checkpoint: afterTeach });
  assert.equal(restored.teachIndex, 1);
  assert.equal(restored.currentItem.targetId, "z");
  assert.equal(restored.scored, false);
});

test("previously taught targets do not replay their full introduction", () => {
  const sequence = createTeachSequence(stop("s7"), ["j", "z"]);
  assert.deepEqual(sequence.items.map(item => item.targetId), ["ff", "ll", "ss", "zz"]);
});

test("all stop targets use child-safe labels and exact unscored teaching contracts", () => {
  const allItems = QUEST_STOPS.flatMap(questStop => createTeachSequence(questStop, []).items);
  assert.equal(allItems.length, 103);
  for (const item of allItems) {
    assert.doesNotMatch(item.targetId, /\s/u);
    assert.doesNotMatch(item.childLabel, /\b[a-z]+_[a-z]+\b/u, item.targetId);
    assert.doesNotMatch(item.graphemeDisplay, /_/u, item.targetId);
    assert.ok(item.anchorImage?.id, item.targetId);
    assert.ok(item.mouthCue, item.targetId);
    assert.ok(item.morphologyCue, item.targetId);
    const contract = getInstructionContract(item.instructionId);
    assert.equal(item.childText, contract.childText, item.targetId);
    assert.equal(item.childAudio, contract.childAudio, item.targetId);
    assert.equal(contract.recordsDomain, null, item.targetId);
    if (item.targetId.startsWith("suffix_")) {
      assert.equal(item.instructionId, "morphology-teach");
      assert.equal(item.graphemeDisplay, item.childLabel);
      for (const field of ["childText", "childLabel", "graphemeDisplay", "mouthCue", "morphologyCue", "workedExample"]) {
        assert.doesNotMatch(item[field], /sound/ui, `${item.targetId}:${field}`);
      }
      assert.match(item.morphologyCue, /ending/u);
    }
  }
});

test("suffix teaching models a true base-to-derived word and meaning", () => {
  const items = createTeachSequence(stop("s38"), []).items;
  assert.deepEqual(items.map(item => [item.targetId, item.workedExample]), [
    ["suffix_s", "cat + –s → cats: more than one cat."],
    ["suffix_ing", "jump + –ing → jumping: happening now."],
    ["suffix_ed", "jump + –ed → jumped: already happened."]
  ]);
});

test("multi-value spellings and endings teach every authored value without adding score targets", () => {
  const itemByTarget = Object.fromEntries(QUEST_STOPS.flatMap(questStop => createTeachSequence(questStop, []).items).map(item => [item.targetId, item]));
  assert.deepEqual(itemByTarget.th.targetAudioAlternates, [{ word: "this", targetAudio: "/audio/phonemes/reviewed/th-voiced.mp3" }]);
  assert.deepEqual(itemByTarget.u_e.targetAudioAlternates, [{ word: "tube", targetAudio: "/audio/phonemes/reviewed/long-oo.mp3" }]);
  assert.deepEqual(itemByTarget.ew.targetAudioAlternates, [{ word: "new", targetAudio: "/audio/phonemes/reviewed/long-oo.mp3" }]);
  assert.equal(itemByTarget.ew.targetAudio, "/audio/phonemes/reviewed/ew-yoo.mp3");
  assert.deepEqual(itemByTarget.suffix_s.alternateExamples.map(example => example.childText), ["dog + –s → dogs: more than one dog."]);
  assert.deepEqual(itemByTarget.suffix_ed.alternateExamples.map(example => example.childText), [
    "land + –ed → landed: already happened.",
    "call + –ed → called: already happened."
  ]);
  for (const targetId of ["th", "u_e", "ew", "suffix_s", "suffix_ed"]) {
    const item = itemByTarget[targetId];
    assert.equal(item.scored, false, targetId);
    assert.equal(getInstructionContract(item.instructionId).recordsDomain, null, targetId);
  }
});

test("every taught target has canonical anchor evidence, an exact teaching type, and an approved cue plan", () => {
  const allItems = QUEST_STOPS.flatMap(questStop => createTeachSequence(questStop, []).items);
  assert.equal(allItems.length, 103);
  assert.equal(Object.keys(SOUND_SEEKERS_TEACH_TARGETS).length, 100);
  const expectedInstructionByTarget = {
    g: "single-sound-teach",
    y: "single-sound-teach",
    ch: "letter-team-teach",
    wh: "letter-team-teach",
    c_s: "alternative-value-teach",
    g_j: "alternative-value-teach",
    nd: "consonant-blend-teach",
    st: "consonant-blend-teach",
    sk: "consonant-blend-teach"
  };
  for (const item of allItems) {
    const contract = getInstructionContract(item.instructionId);
    assert.equal(item.instructionId, expectedInstructionByTarget[item.targetId] || item.instructionId, item.targetId);
    assert.equal(item.childText, contract.childText, item.targetId);
    assert.equal(item.childAudio, contract.childAudio, item.targetId);
    assert.ok(item.anchorWord && !item.anchorWord.includes("_"), item.targetId);
    assert.ok(item.anchorEvidence?.units?.length || item.targetId.startsWith("suffix_"), item.targetId);
    assert.doesNotMatch(item.childLabel, new RegExp(`${item.targetId.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s+as\\s+in\\s+${item.targetId}`, "iu"), item.targetId);
    assert.doesNotMatch(item.workedExample, /undefined|\b[a-z]+_[a-z]+\b/u, item.targetId);
    if (!item.targetId.startsWith("suffix_")) {
      assert.ok(item.targetAudio || item.targetAudioSequence?.length, `${item.targetId} needs a direct cue or sequence`);
      const record = getPronunciation(item.anchorWord);
      assert.ok(record, `${item.targetId} anchor must be a canonical pronunciation word`);
      const resolvedUnits = item.anchorEvidence.units.map(expectedUnit => {
        const unit = record.units.find(candidate => candidate.grapheme === expectedUnit.grapheme && candidate.soundKey === expectedUnit.soundKey);
        assert.ok(unit, `${item.targetId}:${expectedUnit.grapheme}:${expectedUnit.soundKey}`);
        return unit;
      });
      if (item.targetAudioSequence.length) {
        assert.equal(resolvedUnits.length, 2, item.targetId);
        assert.equal(resolvedUnits[0].letterIndices.at(-1) + 1, resolvedUnits[1].letterIndices[0], `${item.targetId} must be a contiguous blend`);
        assert.equal(resolvedUnits.map(unit => unit.grapheme).join(""), item.targetId, `${item.targetId} must name its real printed blend`);
      }
    }
  }
});
