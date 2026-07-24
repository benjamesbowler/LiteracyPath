import assert from "node:assert/strict";
import test from "node:test";

import { buildAdaptiveSkillRound } from "../../src/utils/adaptiveSkillRoundBuilder.js";

function item(id, target, targetWord) {
  return { id, target, targetWord };
}

test("adaptive skill rounds avoid words used under any prior target while unused alternatives remain", () => {
  const candidates = [
    item("a-old", "a", "shared"),
    item("a-new", "a", "apple"),
    item("b-shared", "b", "shared"),
    item("b-new", "b", "boat")
  ];
  const round = buildAdaptiveSkillRound({
    candidates,
    targetOrder: ["a", "b"],
    usedTargetWordsByTarget: {
      legacyTarget: ["shared"]
    },
    roundLength: 2,
    seed: 42
  });

  assert.deepEqual(
    new Set(round.items.map(candidate => candidate.targetWord)),
    new Set(["apple", "boat"])
  );
});

test("adaptive skill rounds reuse prior words only when the available word pool is exhausted", () => {
  const candidates = [
    item("a-only", "a", "apple"),
    item("b-only", "b", "boat")
  ];
  const round = buildAdaptiveSkillRound({
    candidates,
    targetOrder: ["a", "b"],
    usedTargetWordsByTarget: {
      a: ["apple"],
      b: ["boat"]
    },
    roundLength: 2,
    seed: 42
  });

  assert.equal(round.items.length, 2);
  assert.deepEqual(
    new Set(round.items.map(candidate => candidate.targetWord)),
    new Set(["apple", "boat"])
  );
});

test("adaptive skill rounds prefer older retrieval items over the immediately previous round", () => {
  const candidates = [
    item("a-recent", "a", "apple"),
    item("a-older", "a", "acorn"),
    item("b-recent", "b", "boat"),
    item("b-older", "b", "bell")
  ];
  const round = buildAdaptiveSkillRound({
    candidates,
    targetOrder: ["a", "b"],
    usedTargetWordsByTarget: {
      a: ["apple", "acorn"],
      b: ["boat", "bell"]
    },
    avoidQuestionIds: ["a-recent", "b-recent"],
    avoidTargetWords: ["apple", "boat"],
    roundLength: 2,
    seed: 42
  });

  assert.deepEqual(
    new Set(round.items.map(candidate => candidate.targetWord)),
    new Set(["acorn", "bell"])
  );
});
