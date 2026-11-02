import test from "node:test";
import assert from "node:assert/strict";
import {
  HOP_AND_STOP_ACTIONS, HOP_AND_STOP_PAGES, HOP_AND_STOP_ROUNDS,
  HOP_AND_STOP_REQUIRED_MEDIA, canOpenHopAndStop, isHopAndStopPublished, nextHopAndStopRound
} from "../../src/data/hopAndStop.js";

test("the supported reader keeps the exact commissioned eight-page manuscript", () => {
  assert.deepEqual(HOP_AND_STOP_PAGES.map(page => page.text), [
    "“Hop with me!” says Bouncy.", "Bouncy goes up.", "Bouncy comes down.",
    "Speedy hops up.", "Speedy comes down.", "“Stop!” They both stop.",
    "A butterfly lands on Speedy’s nose.", "The butterfly flies up. They hop again."
  ]);
  assert.equal(new Set(HOP_AND_STOP_PAGES.map(page => page.image)).size, 8);
  assert.equal(new Set(HOP_AND_STOP_PAGES.map(page => page.audio)).size, 8);
});

test("eight authored rounds use matched action or position contrasts with balanced answer positions", () => {
  assert.deepEqual(HOP_AND_STOP_ROUNDS.map(round => round.target), ["hop", "stop", "up", "down", "stop", "hop", "down", "up"]);
  for (const round of HOP_AND_STOP_ROUNDS) {
    assert.deepEqual(new Set(round.choices), new Set([round.target, HOP_AND_STOP_ACTIONS[round.target].contrast]));
    assert.equal(round.choices.length, 2);
  }
  assert.equal(HOP_AND_STOP_ROUNDS.filter(round => round.choices[0] === round.target).length, 4);
  for (const word of ["up", "down"]) assert.equal(HOP_AND_STOP_ACTIONS[word].cue, "Where is the butterfly?");
  for (const word of ["hop", "stop"]) assert.equal(HOP_AND_STOP_ACTIONS[word].cue, "What is Bouncy doing?");
  assert.equal(HOP_AND_STOP_ACTIONS.hop.alt, "Bouncy hopping while Speedy watches.");
  assert.equal(HOP_AND_STOP_ACTIONS.hop.result, "Bouncy hops.");
});

test("wrong or duplicate selections cannot skip a round or finish the game", () => {
  const start = Object.freeze({ index: 0, phase: "choosing", wrong: "" });
  const retry = nextHopAndStopRound(start, { type: "choose", word: "stop" });
  assert.deepEqual(retry, { index: 0, phase: "choosing", wrong: "stop" });
  assert.strictEqual(nextHopAndStopRound(retry, { type: "advance" }), retry);
  assert.strictEqual(nextHopAndStopRound(start, { type: "choose", word: "up" }), start);
  const accepted = nextHopAndStopRound(retry, { type: "choose", word: "hop" });
  assert.equal(accepted.phase, "feedback");
  assert.strictEqual(nextHopAndStopRound(accepted, { type: "choose", word: "hop" }), accepted);
});

test("all eight settled actions finish a local activity without scores or evidence fields", () => {
  let state = { index: 0, phase: "choosing", wrong: "" };
  for (const round of HOP_AND_STOP_ROUNDS) {
    assert.equal(state.index, round.id - 1);
    state = nextHopAndStopRound(state, { type: "choose", word: round.target });
    state = nextHopAndStopRound(state, { type: "advance" });
  }
  assert.deepEqual(state, { index: 7, phase: "complete", wrong: "" });
  assert.deepEqual(nextHopAndStopRound(state, { type: "restart" }), { index: 0, phase: "choosing", wrong: "" });
});

test("Books fails closed for partial media and every restricted child context", () => {
  const complete = { schemaVersion: 1, id: "hop-and-stop", status: "complete", verifiedMedia: [...HOP_AND_STOP_REQUIRED_MEDIA] };
  assert.equal(HOP_AND_STOP_REQUIRED_MEDIA.length, 27);
  assert.equal(isHopAndStopPublished(complete), true);
  for (const receipt of [null, {}, { ...complete, status: "in-production" }, { ...complete, id: "other" }, { ...complete, schemaVersion: 2 }, { ...complete, verifiedMedia: complete.verifiedMedia.slice(1) }]) {
    assert.equal(isHopAndStopPublished(receipt), false);
  }
  assert.equal(canOpenHopAndStop(), false);
  assert.equal(canOpenHopAndStop({ published: true }), true);
  for (const restriction of ["focusLocked", "exactBookLock", "restrictedLibrary"]) {
    assert.equal(canOpenHopAndStop({ published: true, [restriction]: true }), false);
  }
});
