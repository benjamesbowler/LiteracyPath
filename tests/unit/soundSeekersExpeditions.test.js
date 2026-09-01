import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { QUEST_CHAPTERS } from "../../src/data/questChapters.js";
import { QUEST_STOPS } from "../../src/data/questSequence.js";
import {
  SOUND_POWER_IDS,
  getInstructionContract
} from "../../src/features/soundSeekers/content/instructionContracts.js";
import {
  SOUND_SEEKERS_CHAPTERS
} from "../../src/features/soundSeekers/content/chapters/index.js";
import {
  CONNECTED_TEXT_IDS,
  HEART_WORD_SLOT_IDS,
  SOUND_SEEKERS_EXPEDITIONS,
  getExpedition
} from "../../src/features/soundSeekers/content/expeditions.js";
import { getPronunciation } from "../../src/features/soundSeekers/content/pronunciationLexicon.js";
import { getReviewSequence } from "../../src/features/soundSeekers/content/reviewSequences.js";

const PHASE_KINDS = ["arrival", "teach", "challenge", "challenge", "wonder", "transfer", "payoff"];
const V2_BOSS_STOPS = ["s5", "s10", "s15", "s20", "s25", "s30", "s35", "s40"];

test("campaign preserves the exact 40-stop and 103-target curriculum", () => {
  assert.equal(SOUND_SEEKERS_EXPEDITIONS.length, 40);
  assert.deepEqual(SOUND_SEEKERS_EXPEDITIONS.map(item => item.stopId), QUEST_STOPS.map(item => item.id));
  assert.equal(new Set(QUEST_STOPS.flatMap(stop => stop.teach.map(item => item.id))).size, 103);

  for (const [index, expedition] of SOUND_SEEKERS_EXPEDITIONS.entries()) {
    assert.deepEqual(expedition.teach.targetIds, QUEST_STOPS[index].teach.map(item => item.id));
  }

  for (const stopId of ["s8", "s17"]) {
    assert.equal(getExpedition(stopId).teach.mode, "review");
    assert.deepEqual(getExpedition(stopId).teach.targetIds, []);
    assert.strictEqual(getExpedition(stopId).teach.reviewTargetIds, getReviewSequence(stopId).targetIds);
    assert.ok(getExpedition(stopId).teach.reviewTargetIds.length > 0);
  }
});

test("the eight feature-local chapter deltas enrich each legacy identity exactly once", () => {
  assert.equal(SOUND_SEEKERS_CHAPTERS.length, 8);
  assert.deepEqual(SOUND_SEEKERS_CHAPTERS.map(chapter => chapter.id), QUEST_CHAPTERS.map(chapter => chapter.id));

  for (const chapter of SOUND_SEEKERS_CHAPTERS) {
    const legacy = QUEST_CHAPTERS.find(item => item.id === chapter.id);
    assert.strictEqual(chapter.cast, legacy.cast);
    assert.strictEqual(chapter.chapterReward, legacy.chapterReward);
    assert.equal(chapter.title, legacy.title);
    assert.deepEqual(chapter.stopIds, legacy.stopIds);
    assert.equal(chapter.repairBeatIds.length, 5);
    assert.equal(new Set(chapter.repairBeatIds).size, 5);
    assert.ok(chapter.wonderId);
    assert.ok(chapter.bossTransferId);
    assert.equal(chapter.biomeKitId, chapter.id);
    assert.equal(Object.isFrozen(chapter), true);
  }
});

test("every expedition publishes real first-visit content foreign keys", () => {
  assert.equal(HEART_WORD_SLOT_IDS.length, 80);
  assert.equal(CONNECTED_TEXT_IDS.length, 40);
  assert.equal(new Set(HEART_WORD_SLOT_IDS).size, 80);
  assert.equal(new Set(CONNECTED_TEXT_IDS).size, 40);

  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    assert.deepEqual(expedition.phases.map(phase => phase.kind), PHASE_KINDS);
    assert.deepEqual(expedition.heartWordSlotIds, [
      `heart-slot-${expedition.stopId}-1`,
      `heart-slot-${expedition.stopId}-2`
    ]);
    assert.equal(expedition.connectedTextId, `scene-${expedition.stopId}`);
    assert.deepEqual(
      [...new Set(expedition.phases.flatMap(phase => phase.contentSlotIds || []))].sort(),
      [...expedition.heartWordSlotIds].sort()
    );
    assert.equal(
      expedition.phases.find(phase => phase.kind === "transfer").connectedTextId,
      expedition.connectedTextId
    );
    assert.ok(expedition.arrival.problemId);
    assert.ok(expedition.arrival.consequencePreviewId);
    assert.ok(expedition.payoff.repairId);
    assert.ok(expedition.payoff.relationshipBeatId);
    assert.ok(expedition.payoff.consequenceId);
    assert.equal(expedition.resume.safePhaseIds.includes(`${expedition.stopId}-wonder`), false);
    assert.equal(expedition.naturalStop, true);
    assert.equal(Object.isFrozen(expedition), true);
  }
});

test("each biome gives its literacy Wonder one concrete visual representation", () => {
  const representations = SOUND_SEEKERS_CHAPTERS.map(chapter => {
    const expedition = SOUND_SEEKERS_EXPEDITIONS.find(item => item.chapterId === chapter.id);
    assert.equal(expedition.wonder.id, chapter.wonderId);
    assert.doesNotMatch(expedition.wonder.representation, /generic|literacy-transformation/u);
    return expedition.wonder.representation;
  });
  assert.equal(new Set(representations).size, 8);
});

test("challenge powers are cognitively distinct and every instruction resolves through the foundation authority", () => {
  const allowedPowers = new Set(Object.values(SOUND_POWER_IDS));
  const firstUse = new Map();

  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    const challenges = expedition.phases.filter(phase => phase.kind === "challenge");
    assert.notEqual(challenges[0].powerId, challenges[1].powerId, expedition.stopId);
    assert.notEqual(challenges[0].expectedAction, challenges[1].expectedAction, expedition.stopId);

    for (const phase of expedition.phases.filter(item => item.powerId)) {
      assert.ok(allowedPowers.has(phase.powerId), `${expedition.stopId}:${phase.powerId}`);
      const instruction = getInstructionContract(phase.instructionId);
      assert.ok(instruction, `${expedition.stopId}:${phase.instructionId}`);
      assert.equal(instruction.powerId, phase.powerId);
      assert.equal(instruction.expectedAction, phase.expectedAction);
      assert.equal(instruction.recordsDomain, phase.recordsDomain);
      if (!firstUse.has(phase.powerId)) firstUse.set(phase.powerId, phase);
    }
  }

  assert.deepEqual(new Set(firstUse.keys()), allowedPowers);
  for (const phase of firstUse.values()) {
    assert.deepEqual(phase.onboarding, { consequenceFree: true, recordsDomain: null });
  }
});

test("authored challenge and boss units never outrun the curriculum", () => {
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    const taughtThroughStop = new Set(QUEST_STOPS
      .filter(stop => stop.index <= expedition.stopIndex)
      .flatMap(stop => stop.teach.map(item => item.id)));
    const claimed = expedition.phases.flatMap(phase => [
      ...(phase.targetIds || []),
      ...(phase.unitTargetIds || [])
    ]);
    for (const targetId of claimed) assert.ok(taughtThroughStop.has(targetId), `${expedition.stopId}:${targetId}`);

    for (const phase of expedition.phases.filter(item => item.wordId)) {
      const pronunciation = getPronunciation(phase.wordId);
      assert.ok(pronunciation, `${expedition.stopId}:${phase.wordId}`);
      const authoredEvidenceTargets = pronunciation.units.map(unit => unit.evidenceTargetId);
      assert.ok(authoredEvidenceTargets.every(Boolean), `${phase.wordId}: explicit evidenceTargetId`);
      assert.deepEqual(phase.unitTargetIds, authoredEvidenceTargets);
      assert.equal(
        new Set(pronunciation.units.flatMap(unit => unit.letterIndices)).size,
        pronunciation.word.length,
        `${phase.wordId}: printed-letter coverage`
      );
    }
  }
});

test("v2 word-unit contracts do not depend on legacy spelling segmentation", () => {
  const source = readFileSync(
    new URL("../../src/features/soundSeekers/content/expeditions.js", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(source, /segmentWord|evidenceTargetFor/u);
});

test("each fifth stop is the v2 transfer boss without changing legacy boss flags", () => {
  assert.deepEqual(
    SOUND_SEEKERS_EXPEDITIONS.filter(item => item.transfer.boss).map(item => item.stopId),
    V2_BOSS_STOPS
  );
  assert.deepEqual(QUEST_STOPS.filter(item => item.boss).map(item => item.id), ["s8", "s17", "s40"]);

  for (const stopId of V2_BOSS_STOPS) {
    const expedition = getExpedition(stopId);
    const curriculumStop = QUEST_STOPS.find(stop => stop.id === stopId);
    const transfer = expedition.phases.find(phase => phase.kind === "transfer");
    const secondary = expedition.phases.find(phase => phase.id === `${stopId}-secondary`);
    assert.equal(transfer.recordsDomain, "novel_decoding");
    assert.ok(transfer.wordId);
    assert.ok(curriculumStop.words.includes(transfer.wordId), `${stopId}:${transfer.wordId}`);
    assert.notEqual(transfer.wordId, secondary.wordId);
    assert.deepEqual(transfer.unitTargetIds, getPronunciation(transfer.wordId).units.map(unit => unit.evidenceTargetId));
    assert.equal(expedition.transfer.imaginary, false);
  }
});
