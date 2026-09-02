import test from "node:test";
import assert from "node:assert/strict";
import {
  createAdventureRun,
  recordAdventureOutcome,
  feedbackForOutcome,
  cycleQuestResult
} from "../../src/components/elQuest/adventureRunState.js";

test("a recovered item keeps its failed first attempt", () => {
  let state = createAdventureRun(2);
  state = recordAdventureOutcome(state, { roundIndex: 0, correct: false, selected: "m" });
  state = recordAdventureOutcome(state, { roundIndex: 0, correct: true, selected: "s" });
  assert.equal(state.firstAttempts[0], false);
  assert.equal(state.completed, 1);
  assert.equal(cycleQuestResult(state).stars, 1);
});

test("seven of ten independent first attempts earn two stars", () => {
  const result = cycleQuestResult({ total: 10, completed: 10, firstAttempts: [true, true, true, true, true, true, true, false, false, false] });
  assert.deepEqual(result, { stars: 2, independentPercent: 70 });
});

test("recording an outcome does not mutate the prior run", () => {
  const state = createAdventureRun(1);
  const next = recordAdventureOutcome(state, { roundIndex: 0, correct: true, selected: "s" });
  assert.notEqual(next, state);
  assert.deepEqual(state.firstAttempts, [null]);
  assert.equal(state.completed, 0);
  assert.deepEqual(next.firstAttempts, [true]);
  assert.equal(next.completed, 1);
});

test("feedback names the selected onset and the target contrast", () => {
  const round = {
    construct: "initial_phoneme_discrimination",
    targetGrapheme: "s",
    answer: "sun",
    objects: [
      { word: "moon", matches: false },
      { word: "sun", matches: true }
    ]
  };
  assert.equal(
    feedbackForOutcome(round, { correct: false, selected: "m" }, 1),
    "m starts moon. Listen for /s/ at the start of sun."
  );
});

test("feedback remains construct-specific on later coaching attempts", () => {
  const round = {
    construct: "ending_grapheme_pattern_discrimination",
    targetGrapheme: "ng",
    answer: "ring"
  };
  const feedback = feedbackForOutcome(round, { correct: false, selected: "ball" }, 2);
  assert.match(feedback, /ball/);
  assert.match(feedback, /ng/);
  assert.match(feedback, /end/);
  assert.doesNotMatch(feedback, /Almost! Try again\./);
});
