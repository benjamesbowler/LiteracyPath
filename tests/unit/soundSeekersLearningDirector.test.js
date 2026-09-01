import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAuditedDistractors,
  selectNextChallenge
} from "../../src/features/soundSeekers/engine/learningDirector.js";
import {
  createSoundSeekersState,
  normalizeSoundSeekersState
} from "../../src/features/soundSeekers/engine/stateV2.js";

const comparisonFamilies = {
  short_a: "short-vowels",
  short_e: "short-vowels",
  short_i: "short-vowels",
  short_o: "short-vowels",
  short_u: "short-vowels",
  sh: "digraphs"
};

const shortVowelPronunciations = Object.freeze({
  short_a: Object.freeze({ id: "short_a", pronunciation: "/a/" }),
  short_e: Object.freeze({ id: "short_e", pronunciation: "/e/" }),
  short_i: Object.freeze({ id: "short_i", pronunciation: "/i/" }),
  short_o: Object.freeze({ id: "short_o", pronunciation: "/o/" }),
  short_u: Object.freeze({ id: "short_u", pronunciation: "/u/" })
});

const practiceEvent = event => Object.freeze({
  evidenceKind: "practice",
  domain: "phoneme_to_grapheme",
  ...event,
  id: event.id || `${event.target}-${event.journeyStep}`
});

test("director serves a taught homogeneous contrast from recent confusion", () => {
  const next = selectNextChallenge({
    targetId: "short_i",
    taught: ["short_i", "short_e"],
    comparisonFamilies,
    evidence: [practiceEvent({ target: "short_i", correct: false, confusion: "short_e", journeyStep: 7 })],
    journeyStep: 8,
    confusionWindow: 3,
    seed: 7
  });

  assert.equal(next.contrastTargetId, "short_e");
  assert.equal(next.reason, "recent_confusion");
});

test("director gives never-served eligible content priority over response telemetry", () => {
  const next = selectNextChallenge({
    eligibleTargets: ["short_e", "short_i"],
    taught: ["short_e", "short_i"],
    evidence: [practiceEvent({ target: "short_e", correct: false, journeyStep: 8 })],
    responseTime: 1,
    pathLength: 900,
    collisionCount: 99,
    deviceSpeed: "slow",
    seed: 1
  });

  assert.equal(next.targetId, "short_i");
  assert.equal(next.reason, "never_served");
});

test("director labels a review only when its journey-step gap is actually due", () => {
  const shared = {
    targetId: "short_i",
    taught: ["short_i"],
    evidence: [practiceEvent({ target: "short_i", correct: true, journeyStep: 10 })],
    journeyStep: 11,
    reviewGap: 3
  };
  assert.equal(selectNextChallenge(shared).reason, "stable_practice");
  assert.equal(selectNextChallenge({ ...shared, journeyStep: 13 }).reason, "due_review");
});

test("director ignores mutable, non-practice, and non-domain events", () => {
  const next = selectNextChallenge({
    eligibleTargets: ["short_e", "short_i"],
    taught: ["short_e", "short_i"],
    evidence: [
      { target: "short_i", correct: false, journeyStep: 8 },
      Object.freeze({ evidenceKind: "practice", domain: "collision", target: "short_i", correct: false, journeyStep: 8 }),
      Object.freeze({ evidenceKind: "motor", domain: "phoneme_to_grapheme", target: "short_i", correct: false, journeyStep: 8 }),
      practiceEvent({ target: "short_e", correct: true, journeyStep: 8 })
    ],
    journeyStep: 9,
    seed: 1
  });

  assert.equal(next.targetId, "short_i");
  assert.equal(next.reason, "never_served");
});

test("persisted lifetime confusion counts are non-adaptive context", () => {
  const next = selectNextChallenge({
    targetId: "short_i",
    taught: ["short_i", "short_e"],
    comparisonFamilies,
    evidence: [practiceEvent({ target: "short_i", correct: true, journeyStep: 10 })],
    confusions: { short_e: 9 },
    journeyStep: 13,
    reviewGap: 3,
    confusionWindow: 3
  });

  assert.equal(next.reason, "due_review");
  assert.equal(next.contrastTargetId, null);
});

test("director uses structurally valid persisted evidence after a v2 resume", () => {
  const base = createSoundSeekersState();
  const resume = ({ evidence, journeyStep, confusions = {} }) => normalizeSoundSeekersState({
    ...base,
    trail: { ...base.trail, journeyStep },
    evidence,
    confusions
  });
  const context = state => ({
    targetId: "short_i",
    taught: ["short_i", "short_e"],
    comparisonFamilies,
    evidence: state.evidence,
    confusions: state.confusions,
    journeyStep: state.trail.journeyStep,
    reviewGap: 3,
    confusionWindow: 3
  });

  const due = resume({
    evidence: [practiceEvent({ id: "due", target: "short_i", correct: true, journeyStep: 10, at: 10 })],
    journeyStep: 13,
    confusions: { "short_i:short_e": 99 }
  });
  assert.equal(Object.isFrozen(due.evidence[0]), true, "normalized evidence is an immutable reducer snapshot");
  assert.throws(() => { due.evidence[0].correct = false; }, TypeError);
  assert.equal(selectNextChallenge(context(due)).reason, "due_review");

  const lowAccuracy = resume({
    evidence: [practiceEvent({ id: "low", target: "short_i", correct: false, confusion: null, journeyStep: 12, at: 12 })],
    journeyStep: 13
  });
  assert.equal(selectNextChallenge(context(lowAccuracy)).reason, "low_or_decayed_accuracy");

  const confusion = resume({
    evidence: [practiceEvent({ id: "confusion", target: "short_i", correct: false, confusion: "short_e", journeyStep: 12, at: 12 })],
    journeyStep: 13
  });
  const next = selectNextChallenge(context(confusion));
  assert.equal(next.reason, "recent_confusion");
  assert.equal(next.contrastTargetId, "short_e");
});

test("recent immutable confusion evidence chooses its taught contrast", () => {
  const next = selectNextChallenge({
    targetId: "short_i",
    taught: ["short_i", "short_e"],
    comparisonFamilies,
    evidence: [practiceEvent({ target: "short_i", correct: false, confusion: "short_e", journeyStep: 12 })],
    journeyStep: 13,
    confusionWindow: 3
  });

  assert.equal(next.reason, "recent_confusion");
  assert.equal(next.contrastTargetId, "short_e");
});

test("equal-priority eligible targets all receive bounded deterministic seed coverage", () => {
  const targetIds = ["short_a", "short_e", "short_i", "short_o", "short_u"];
  const counts = Object.fromEntries(targetIds.map(targetId => [targetId, 0]));

  for (let seed = 0; seed < 256; seed += 1) {
    const next = selectNextChallenge({
      eligibleTargets: targetIds,
      taught: targetIds,
      journeyStep: 17,
      seed
    });
    counts[next.targetId] += 1;
    assert.equal(next.reason, "never_served");
  }

  assert.deepEqual(new Set(Object.keys(counts).filter(targetId => counts[targetId] > 0)), new Set(targetIds));
  assert.ok(Object.values(counts).every(count => count >= 20 && count <= 90), JSON.stringify(counts));
});

test("journey context varies equal-priority selection while replay and resume stay identical", () => {
  const targetIds = ["short_a", "short_e", "short_i", "short_o", "short_u"];
  const context = {
    eligibleTargets: targetIds,
    taught: targetIds,
    journeyStep: 23,
    seed: "journey-replay"
  };
  const replay = selectNextChallenge(context);
  const resumed = selectNextChallenge(JSON.parse(JSON.stringify(context)));
  assert.deepEqual(resumed, replay);

  const acrossJourney = new Set();
  for (let journeyStep = 1; journeyStep <= 64; journeyStep += 1) {
    acrossJourney.add(selectNextChallenge({ ...context, journeyStep }).targetId);
  }
  assert.deepEqual(acrossJourney, new Set(targetIds));
});

test("pronunciation-distinct distractor subsets cover every eligible contrast deterministically", () => {
  const taught = ["short_a", "short_e", "short_i", "short_o", "short_u"];
  const inclusionCounts = Object.fromEntries(taught
    .filter(targetId => targetId !== "short_i")
    .map(targetId => [targetId, 0]));
  const subsets = new Set();

  for (let seed = 0; seed < 256; seed += 1) {
    const context = {
      targetId: "short_i",
      taught,
      comparisonFamilies,
      pronunciations: shortVowelPronunciations,
      optionCount: 3,
      journeyStep: 31,
      seed
    };
    const result = buildAuditedDistractors(context);
    assert.deepEqual(buildAuditedDistractors(JSON.parse(JSON.stringify(context))), result);
    subsets.add([...result.distractorIds].sort().join("+"));
    for (const targetId of result.distractorIds) inclusionCounts[targetId] += 1;
  }

  assert.equal(subsets.size, 6, [...subsets].join(","));
  assert.ok(Object.values(inclusionCounts).every(count => count >= 70 && count <= 180), JSON.stringify(inclusionCounts));
});

test("journey context varies audited distractor subsets for one replay seed", () => {
  const taught = ["short_a", "short_e", "short_i", "short_o", "short_u"];
  const subsets = new Set();
  for (let journeyStep = 1; journeyStep <= 32; journeyStep += 1) {
    const result = buildAuditedDistractors({
      targetId: "short_i",
      taught,
      comparisonFamilies,
      pronunciations: shortVowelPronunciations,
      optionCount: 3,
      journeyStep,
      seed: "same-replay-seed"
    });
    subsets.add([...result.distractorIds].sort().join("+"));
  }
  assert.equal(subsets.size, 6, [...subsets].join(","));
});

test("distractors are taught, same-family, explicit, and position-balanced", () => {
  const positions = [0, 0, 0];
  for (let seed = 0; seed < 1000; seed += 1) {
    const result = buildAuditedDistractors({
      targetId: "short_i",
      taught: ["short_a", "short_e", "short_i", "sh"],
      comparisonFamilies,
      pronunciations: {
        short_a: { id: "short_a", pronunciation: "/a/" },
        short_e: { id: "short_e", pronunciation: "/e/" },
        short_i: { id: "short_i", pronunciation: "/i/" },
        sh: { id: "sh", pronunciation: "/sh/" }
      },
      optionCount: 3,
      seed
    });
    assert.deepEqual(new Set(result.optionTargetIds).size, 3);
    assert.ok(result.distractorIds.every(id => ["short_a", "short_e"].includes(id)));
    positions[result.correctIndex] += 1;
  }
  assert.ok(Math.max(...positions) - Math.min(...positions) <= 50, positions.join(","));
});

test("distractor generation rejects an ambiguous authored target", () => {
  assert.equal(buildAuditedDistractors({
    targetId: "short_i",
    taught: ["short_a", "short_e", "short_i"],
    comparisonFamilies,
    pronunciations: {
      short_a: { id: "short_a", pronunciation: "/a/" },
      short_e: { id: "short_e", pronunciation: "/e/" },
      short_i: { id: "short_i", pronunciation: "/i/", ambiguous: true }
    }
  }), null);
});

test("distractor generation excludes same-family homophones", () => {
  const result = buildAuditedDistractors({
    targetId: "short_i",
    taught: ["short_a", "short_e", "short_i", "short_o"],
    comparisonFamilies: { ...comparisonFamilies, short_o: "short-vowels" },
    pronunciations: {
      short_a: { id: "short_a", pronunciation: "/a/" },
      short_e: { id: "short_e", pronunciation: "/i/" },
      short_i: { id: "short_i", pronunciation: "/i/" },
      short_o: { id: "short_o", pronunciation: "/o/" }
    },
    optionCount: 3,
    seed: 4
  });

  assert.deepEqual([...result.distractorIds].sort(), ["short_a", "short_o"]);
});
