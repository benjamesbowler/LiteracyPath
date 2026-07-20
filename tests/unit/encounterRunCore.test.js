import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createEncounterRun,
  encounterRunReducer,
  encounterRunCheckpoint,
  answerEvents
} from "../../src/utils/encounterRunCore.js";
import { CORRECTION_MODES } from "../../src/utils/questCorrection.js";

const attempt = (run, over = {}) => encounterRunReducer(run, { type: "attempt", target: "s", ...over });

test("the s,a,t regression class is structurally impossible: array targets fan out", () => {
  // The 2D renderer once passed a word's grapheme ARRAY straight through and
  // wrote mastery under garbage keys like "s,a,t". The reducer's event list
  // is the only legal path to onAnswer, and it always fans out.
  const events = answerEvents({ correct: true, target: ["s", "a", "t"], shell: "broken-bridge" });
  assert.equal(events.length, 3);
  assert.deepEqual(events.map(event => event.target), ["s", "a", "t"]);
  assert.ok(events.every(event => !event.target.includes(",")));
});

test("a full encounter: miss, miss, miss climbs the ladder and earns a review visit", () => {
  let run = createEncounterRun({ encounterId: "e1", beatCount: 2 });
  run = attempt(run, { correct: false, choiceId: "m" });
  run = attempt(run, { correct: false, choiceId: "t" });
  const key = Object.keys(run.corrections)[0];
  assert.equal(run.corrections[key].mode, CORRECTION_MODES.NARROW);
  run = attempt(run, { correct: false, choiceId: "p" });
  assert.equal(run.corrections[key].mode, CORRECTION_MODES.TEACH);
  assert.deepEqual(run.reviewQueue, [0], "three misses queue the beat for a re-visit");
  run = encounterRunReducer(run, { type: "teach-back" });
  assert.equal(run.corrections[key].mode, CORRECTION_MODES.GUIDED);
});

test("stars score the FIRST attempt only; the ladder still records every answer event", () => {
  let run = createEncounterRun({ encounterId: "e1", beatCount: 1 });
  run = attempt(run, { correct: false });
  assert.deepEqual(run.tally, { total: 1, correct: 0, mistakes: 1 });
  run = attempt(run, { correct: false });
  run = attempt(run, { correct: true });
  assert.deepEqual(run.tally, { total: 1, correct: 0, mistakes: 1 }, "later rungs never re-score the beat");
  assert.equal(run.events.length, 1, "but the mastery event still fires per attempt");
});

test("a fumbled then completed multi-stage word contributes exactly one star-tally beat", () => {
  let run = createEncounterRun({ encounterId: "word-bridge", beatCount: 1 });
  run = attempt(run, { correct: false, target: "s", choiceId: "m" });
  run = encounterRunReducer(run, { type: "advance-stage" });
  run = attempt(run, { correct: true, target: "a" });
  run = encounterRunReducer(run, { type: "advance-stage" });
  run = attempt(run, { correct: true, target: "t" });
  assert.deepEqual(
    run.tally,
    { total: 1, correct: 0, mistakes: 1 },
    "later grapheme stages must not rescore the same word beat"
  );
  assert.equal(Object.keys(run.firstTally).length, 1);
});

test("attempts made under the ladder report their assistance level automatically", () => {
  let run = createEncounterRun({ encounterId: "e1", beatCount: 1 });
  run = attempt(run, { correct: false });
  run = attempt(run, { correct: false });
  // Two misses in: the child now answers with narrowed choices.
  run = attempt(run, { correct: true });
  assert.equal(run.events[0].meta.promptLevel, 1, "narrowed answers carry promptLevel 1");
});

test("checkpoint round-trips: a resumed run is the run that was left", () => {
  let run = createEncounterRun({ encounterId: "e1", beatCount: 3 });
  run = attempt(run, { correct: false, choiceId: "x" });
  run = encounterRunReducer(run, { type: "advance-beat", beatIndex: 1 });
  run = encounterRunReducer(run, { type: "advance-stage" });
  const saved = encounterRunCheckpoint(run);

  let resumed = createEncounterRun({ encounterId: "e1", beatCount: 3 });
  resumed = encounterRunReducer(resumed, { type: "restore", checkpoint: saved });
  assert.equal(resumed.beatIndex, 1);
  assert.equal(resumed.stageIndex, 1);
  assert.deepEqual(resumed.corrections, run.corrections);
  assert.deepEqual(resumed.tally, run.tally);
});

test("advancing a beat resets the stage and clamps to the encounter's length", () => {
  let run = createEncounterRun({ encounterId: "e1", beatCount: 2 });
  run = encounterRunReducer(run, { type: "advance-stage" });
  run = encounterRunReducer(run, { type: "advance-beat" });
  assert.equal(run.beatIndex, 1);
  assert.equal(run.stageIndex, 0, "a new beat starts at its first stage");
  run = encounterRunReducer(run, { type: "advance-beat" });
  assert.equal(run.beatIndex, 1, "never past the last beat");
});
