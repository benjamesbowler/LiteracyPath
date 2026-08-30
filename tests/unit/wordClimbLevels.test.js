import test from "node:test";
import assert from "node:assert/strict";

import {
  createWordClimbSession,
  wordClimbChoicesForStep,
  wordClimbSummitFor
} from "../../src/utils/wordClimbLevels.js";
import {
  rocketRunLadder,
  wordStartsWithTargetSound
} from "../../src/utils/rocketRunRounds.js";

test("Word Climb changes literacy depth before adding more climbs", () => {
  assert.equal(wordClimbSummitFor("easy"), 6);
  assert.equal(wordClimbSummitFor("medium"), 8);
  assert.equal(wordClimbSummitFor("hard"), 10);
});

test("every Word Climb step contains three unique words and exactly one valid onset", () => {
  const round = {
    correct: ["sun", "sock", "sand"],
    distractors: ["map", "top", "fox", "egg", "van", "pig"]
  };

  for (let step = 0; step < 6; step += 1) {
    const choices = wordClimbChoicesForStep(round, step, () => 0.37);
    assert.equal(choices.length, 3);
    assert.equal(new Set(choices.map(choice => choice.word)).size, 3);
    assert.equal(choices.filter(choice => choice.correct).length, 1);
    for (const choice of choices) {
      assert.equal(wordStartsWithTargetSound(choice.word, "s"), choice.correct);
    }
  }
});

test("the correct Word Climb word has no fixed lane", () => {
  const round = {
    correct: ["sun"],
    distractors: ["map", "top", "fox"]
  };
  const randomStreams = [
    () => 0,
    () => 0.999,
    (() => { const values = [0.5, 0]; let index = 0; return () => values[index++ % values.length]; })()
  ];
  const correctLanes = randomStreams.map(random =>
    wordClimbChoicesForStep(round, 0, random).findIndex(choice => choice.correct)
  );
  assert.deepEqual([...new Set(correctLanes)].sort(), [0, 1, 2]);
});

test("difficulty sessions use their curriculum target band and sound-distinct choices", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const session = createWordClimbSession(difficulty, () => 0.42);
    assert.equal(session.summit, wordClimbSummitFor(difficulty));
    assert.ok(rocketRunLadder(difficulty).includes(session.target));
    assert.ok(session.round.correct.length >= session.summit);
    for (const word of session.round.correct) {
      assert.equal(wordStartsWithTargetSound(word, session.target), true, `${word} should start with ${session.target}`);
    }
    for (const word of session.round.distractors) {
      assert.equal(wordStartsWithTargetSound(word, session.target), false, `${word} should not start with ${session.target}`);
    }
  }
});

test("Word Climb fails closed when a choice bank cannot make a fair round", () => {
  assert.throws(
    () => wordClimbChoicesForStep({ correct: ["sun"], distractors: ["map"] }, 0),
    /one target word and two distinct distractors/
  );
});
