import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dueTargets,
  targetsForStop,
  promote,
  demote,
  boxAfterStop,
  reviewWeight,
  MAX_BOX,
  MAX_TARGETS_PER_STOP,
  MAX_REVIEW_PER_STOP
} from "../../src/utils/questReviewScheduler.js";
import { emptyRecord, MASTERY_STATES } from "../../src/utils/questMastery.js";

const rec = over => ({ ...emptyRecord(), ...over });

test("promote moves up one box and stops at the top", () => {
  assert.equal(promote(rec({ box: 1 })).box, 2);
  assert.equal(promote(rec({ box: MAX_BOX })).box, MAX_BOX);
});

test("a miss sends a sound STRAIGHT BACK to box 1, not one box back", () => {
  // Half-knowing a sound is exactly the state we are trying to eliminate.
  // Drip-feeding it every 5 stops is how a child stays half-knowing it for a term.
  assert.equal(demote(rec({ box: 4 })).box, 1);
});

test("boxAfterStop maps mastery state to a review interval", () => {
  assert.equal(boxAfterStop(rec({ state: MASTERY_STATES.RETIRED })), 5);
  assert.equal(boxAfterStop(rec({ state: MASTERY_STATES.MASTERED })), 4);
  assert.equal(boxAfterStop(rec({ state: MASTERY_STATES.MASTERED, misses: 1, box: 4 })), 1, "one fresh mastery miss is due now");
  assert.equal(boxAfterStop(rec({ state: MASTERY_STATES.RETIRED, misses: 1, box: 5 })), 1, "retired claims are pulled back immediately too");
  assert.equal(boxAfterStop(rec({ state: MASTERY_STATES.LEARNING, misses: 1, box: 3 })), 1, "a recent miss resets the interval");
  assert.equal(boxAfterStop(rec({ state: MASTERY_STATES.LEARNING, misses: 0, box: 2 })), 2);
});

test("a box-1 sound is due immediately; a box-3 sound waits 5 stops", () => {
  const mastery = {
    sh: rec({ seen: 4, correct: 1, box: 1, lastStop: 10 }),
    ch: rec({ seen: 6, correct: 6, box: 3, lastStop: 10 })
  };
  assert.deepEqual(dueTargets(mastery, 11), ["sh"]);
  assert.deepEqual(dueTargets(mastery, 15).sort(), ["ch", "sh"]);
});

test("backward replay still carries box-1 review instead of producing a negative gap", () => {
  const mastery = {
    sh: rec({ seen: 4, independentSeen: 4, correct: 2, box: 1, lastStop: 30 })
  };
  assert.deepEqual(dueTargets(mastery, 4), ["sh"]);
});

test("worst-first: the sound the child is failing comes back before the one they mostly know", () => {
  const mastery = {
    good: rec({ seen: 10, correct: 9, box: 1, lastStop: 5 }),
    bad: rec({ seen: 10, correct: 2, box: 1, lastStop: 5 }),
    middling: rec({ seen: 10, correct: 6, box: 1, lastStop: 5 })
  };
  assert.deepEqual(dueTargets(mastery, 6), ["bad", "middling", "good"]);
  assert.ok(reviewWeight(mastery.bad, 6) > reviewWeight(mastery.good, 6));
});

test("assistance and timeout exposure do not depress review accuracy", () => {
  const clean = rec({ seen: 2, independentSeen: 2, correct: 2, box: 1, lastStop: 5 });
  const exposed = rec({ seen: 20, independentSeen: 2, correct: 2, box: 1, lastStop: 5 });
  assert.equal(reviewWeight(exposed, 6), reviewWeight(clean, 6));

  const timeoutOnly = rec({ seen: 20, independentSeen: 0, correct: 0, misses: 0, box: 1, lastStop: 5 });
  assert.equal(reviewWeight(timeoutOnly, 6), 1 / 12, "neutral exposure contributes only ordinary recency");
});

test("a sound never attempted is never `due` — you can't review what you've never met", () => {
  const mastery = { sh: rec({ seen: 0, box: 1 }) };
  assert.deepEqual(dueTargets(mastery, 20), []);
});

test("A NEVER-MASTERED SOUND KEEPS COMING BACK FOREVER", () => {
  // The whole promise of the mastery gate: an unmastered sound is not "failed",
  // it is simply scheduled again. If this test ever goes red, a child can fall
  // through the floor and never be caught.
  const mastery = { th: rec({ seen: 20, correct: 4, box: 1, lastStop: 0, state: MASTERY_STATES.LEARNING }) };
  for (let stop = 10; stop <= 40; stop += 1) {
    assert.ok(dueTargets(mastery, stop).includes("th"), `th stopped coming back at stop ${stop}`);
  }
});

test("a retired sound is still sampled, so nothing rots — and retired sounds TRICKLE, never mob", () => {
  const retired = () => rec({ seen: 30, correct: 29, box: 5, lastStop: 2, state: MASTERY_STATES.RETIRED });
  const mastery = { s: retired() };

  // Exactly one due stop per ten — deterministic, phase set by the target id
  // so two devices agree.
  const dueStops = [];
  for (let stop = 3; stop <= 42; stop += 1) {
    if (dueTargets(mastery, stop).includes("s")) dueStops.push(stop);
  }
  assert.equal(dueStops.length, 4, "sampled once per ten stops across forty");
  assert.equal(dueStops[1] - dueStops[0], 10);

  // Thirty retired sounds must NOT all go due on the same stop (the old
  // global %10 mobbed every tenth stop and crowded out struggling sounds).
  const crowd = {};
  for (let i = 0; i < 30; i += 1) crowd[`t${i}`] = retired(`t${i}`);
  let maxDueAtOnce = 0;
  for (let stop = 3; stop <= 42; stop += 1) {
    const due = Object.keys(crowd).filter(target => dueTargets({ [target]: crowd[target] }, stop).length);
    maxDueAtOnce = Math.max(maxDueAtOnce, due.length);
  }
  assert.ok(maxDueAtOnce < 30, "retired sounds spread across stops instead of mobbing one");
});

test("review is capped so a struggling child never faces a wall", () => {
  const mastery = {};
  for (let i = 0; i < 20; i += 1) mastery[`g${i}`] = rec({ seen: 10, correct: 1, box: 1, lastStop: 0 });

  assert.equal(dueTargets(mastery, 30).length, MAX_REVIEW_PER_STOP);

  const targets = targetsForStop(["a", "b", "c", "d"], mastery, 30);
  assert.equal(targets.length, MAX_TARGETS_PER_STOP);
  assert.deepEqual(targets.slice(0, 4), ["a", "b", "c", "d"], "new sounds always come first");
});

test("targetsForStop never duplicates a sound that is both new and due", () => {
  const mastery = { a: rec({ seen: 5, correct: 1, box: 1, lastStop: 0 }) };
  const targets = targetsForStop(["a", "b"], mastery, 10);
  assert.deepEqual(targets, ["a", "b"]);
});

test("with nothing due, a stop is just its new sounds", () => {
  assert.deepEqual(targetsForStop(["sh", "ch"], {}, 9), ["sh", "ch"]);
});
