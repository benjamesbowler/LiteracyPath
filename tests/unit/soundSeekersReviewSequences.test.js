import test from "node:test";
import assert from "node:assert/strict";

import { QUEST_STOPS } from "../../src/data/questSequence.js";
import {
  SOUND_SEEKERS_REVIEW_SOURCE_ID,
  createReviewTargetSequence,
  reviewCandidateTargetIds
} from "../../src/features/soundSeekers/content/reviewSequences.js";

const REVIEW_STOPS = ["s8", "s17"];

function priorTargetIds(stopId) {
  const reviewStop = QUEST_STOPS.find(stop => stop.id === stopId);
  return QUEST_STOPS
    .filter(stop => stop.index < reviewStop.index)
    .flatMap(stop => stop.teach.map(target => target.id));
}

function practiceEvent({ id, target, correct, journeyStep }) {
  return Object.freeze({
    id,
    target,
    domain: "phoneme_to_grapheme",
    correct,
    supportLevel: 0,
    revealed: false,
    audioRequired: false,
    evidenceKind: "practice",
    journeyStep
  });
}

function practicedState(targetIds, weakTargetId) {
  return {
    trail: { journeyStep: targetIds.length + 20 },
    evidence: targetIds.map((target, index) => practiceEvent({
      id: `practice-${target}-${index}`,
      target,
      correct: target !== weakTargetId,
      journeyStep: index + 1
    })),
    travel: { collisions: 999, responseTimeMs: 999_999 },
    cosmetics: { trail: "gold" },
    rewards: ["all-the-things"]
  };
}

test("review source publishes strict-prior candidates in stable first-introduction order", () => {
  assert.equal(SOUND_SEEKERS_REVIEW_SOURCE_ID, "sound-seekers-prior-target-adaptive-v1");

  for (const stopId of REVIEW_STOPS) {
    const expected = priorTargetIds(stopId);
    const actual = reviewCandidateTargetIds(stopId);
    assert.deepEqual(actual, expected);
    assert.equal(new Set(actual).size, actual.length, stopId);
    assert.equal(Object.isFrozen(actual), true);
  }

  assert.throws(() => reviewCandidateTargetIds("s9"), /review stop/i);
  assert.throws(() => reviewCandidateTargetIds("missing"), /review stop/i);
});

test("adaptive review selection is evidence-sensitive, unique, deterministic, and resume-safe", () => {
  for (const stopId of REVIEW_STOPS) {
    const candidates = reviewCandidateTargetIds(stopId);
    const weakTargetId = candidates.at(-1);
    const input = {
      stopId,
      state: practicedState(candidates, weakTargetId),
      seed: "mission-replay-11",
      count: 4
    };
    const first = createReviewTargetSequence(input);
    const replay = createReviewTargetSequence(structuredClone(input));

    assert.deepEqual(replay, first);
    assert.equal(Object.isFrozen(first), true);
    assert.equal(Object.isFrozen(first.targetIds), true);
    assert.equal(first.sourceId, SOUND_SEEKERS_REVIEW_SOURCE_ID);
    assert.equal(first.stopId, stopId);
    assert.equal(first.targetIds.length, 4);
    assert.equal(new Set(first.targetIds).size, first.targetIds.length);
    assert.equal(first.targetIds[0], weakTargetId, "low-accuracy evidence should outrank stable practice");
    assert.equal(first.targetIds.every(targetId => candidates.includes(targetId)), true);

    const cosmeticOnlyChange = structuredClone(input);
    cosmeticOnlyChange.state.travel.collisions = 0;
    cosmeticOnlyChange.state.cosmetics.trail = "plain";
    cosmeticOnlyChange.state.rewards = [];
    assert.deepEqual(createReviewTargetSequence(cosmeticOnlyChange), first);
  }
});

test("review selection fails closed for invalid stops and impossible caller-owned counts", () => {
  const base = { stopId: "s8", state: {}, seed: 7 };
  for (const count of [undefined, null, 0, -1, 1.5, "2"]) {
    assert.throws(() => createReviewTargetSequence({ ...base, count }), /count/i);
  }
  assert.throws(
    () => createReviewTargetSequence({ ...base, count: reviewCandidateTargetIds("s8").length + 1 }),
    /count|candidate/i
  );
  assert.throws(
    () => createReviewTargetSequence({ ...base, stopId: "s9", count: 1 }),
    /review stop/i
  );
});
