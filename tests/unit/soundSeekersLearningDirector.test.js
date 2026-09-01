import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAuditedDistractors,
  selectNextChallenge
} from "../../src/features/soundSeekers/engine/learningDirector.js";

const comparisonFamilies = {
  short_a: "short-vowels",
  short_e: "short-vowels",
  short_i: "short-vowels",
  sh: "digraphs"
};

const practiceEvent = event => Object.freeze({
  evidenceKind: "practice",
  domain: "phoneme_to_grapheme",
  ...event,
  id: event.id || `${event.target}-${event.journeyStep}`
});

test("director serves a taught homogeneous contrast from recent confusion", () => {
  const next = selectNextChallenge({
    targetId: "short_i",
    confusions: { short_e: { count: 3, journeyStep: 7 } },
    taught: ["short_i", "short_e"],
    comparisonFamilies,
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

test("stale aggregate confusion cannot outrank a due review", () => {
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
