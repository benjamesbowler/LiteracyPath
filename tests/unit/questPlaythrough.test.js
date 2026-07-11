import { test } from "node:test";
import assert from "node:assert/strict";
import { QUEST_STOPS, targetsAtStop, getStop } from "../../src/data/questSequence.js";
import { buildStop, isHeartTarget } from "../../src/utils/questRounds.js";
import { targetsForStop } from "../../src/utils/questReviewScheduler.js";
import {
  baseQuestState,
  recordQuestAttempt,
  recordStopResult,
  currentStopIndex,
  isStopUnlocked,
  availableSparks
} from "../../src/utils/questProgress.js";
import { MASTERY_STATES, isMastered, countMastered } from "../../src/utils/questMastery.js";
import { starRubric } from "../../src/utils/starRubric.js";

// FULL-TRAIL SIMULATION.
//
// Unit tests prove the pieces. This walks a whole child from the egg to the Star
// Reach, 40 stops, through the real round builder, the real mastery gate and the
// real review scheduler — and asserts the two things the entire design rests on:
//
//   1. A child who reads well ends up with the sounds MARKED as learnt.
//   2. A child who reads badly is NEVER BLOCKED, and the sounds they can't do
//      keep coming back.
//
// If either of those is false, the mode is broken in a way no unit test would
// show, because every part would still work perfectly on its own.

// Play one stop. `skill` is the probability the child gets a response right.
// `day` advances per stop so the "2 different sessions" rule can be satisfied.
function playStop(state, stopId, { skill, day }) {
  const stop = getStop(stopId);
  const targets = targetsForStop(targetsAtStop(stopId), state.mastery, stop.index);
  const built = buildStop(stopId, { mastery: state.mastery, targets, seed: stop.index });

  const shellIds = Object.keys(built.rounds).filter(id => id !== "gate" && built.rounds[id].length);
  let next = state;
  const tally = { correct: 0, total: 0, mistakes: 0 };

  const answer = (target, correct, shell) => {
    tally.total += 1;
    if (correct) tally.correct += 1;
    else tally.mistakes += 1;
    if (target == null) return;
    for (const one of Array.isArray(target) ? target : [target]) {
      if (one) {
        next = recordQuestAttempt(next, {
          target: one,
          correct,
          shell,
          stopIndex: stop.index,
          at: `2026-0${1 + (day % 9)}-${String(1 + (day % 27)).padStart(2, "0")}T10:00:00Z`
        });
      }
    }
  };

  for (const shellId of shellIds) {
    for (const round of built.rounds[shellId]) {
      answer(round.target, Math.random() < skill, shellId);
    }
  }
  for (const round of built.rounds.gate) {
    answer(round.target, Math.random() < skill, "gate");
  }

  const stars = starRubric({ correct: tally.correct, total: tally.total, mistakes: tally.mistakes, deaths: 0 });
  return { state: recordStopResult(next, stopId, stars), tally, stars };
}

function walkTheTrail({ skill, passes = 1 }) {
  let state = baseQuestState();
  let day = 0;
  for (let pass = 0; pass < passes; pass += 1) {
    for (const stop of QUEST_STOPS) {
      day += 1;
      const result = playStop(state, stop.id, { skill, day });
      state = result.state;
    }
  }
  return state;
}

test("a child who reads well walks the whole trail and ends up with the sounds MARKED as learnt", () => {
  const state = walkTheTrail({ skill: 1, passes: 2 });

  assert.equal(state.trail.stopsDone.length, 40, "did not finish the trail");
  assert.equal(currentStopIndex(state), 40, "the trail should be complete");

  // The bar needs 2 sessions and 2 shells; two passes over the trail supplies
  // both. Every sound the trail teaches should now be mastered.
  const taught = [...new Set(QUEST_STOPS.flatMap(s => s.teach.filter(e => e.kind !== "morph").map(e => e.id)))];
  const unmastered = taught.filter(t => !isMastered(state.mastery, t));
  assert.deepEqual(unmastered, [], `a perfect reader still has unmastered sounds: ${unmastered.join(", ")}`);

  assert.ok(countMastered(state.mastery) >= taught.length);
  assert.ok(availableSparks(state) > 0, "no sparks earned for a perfect run");
});

test("A CHILD WHO GETS EVERYTHING WRONG IS NEVER BLOCKED", () => {
  // The central promise of the whole mode. The story never waits. This child
  // answers every single question wrong, 40 stops in a row, and still sees the
  // Star Reach — because being bad at reading is the reason they are here.
  const state = walkTheTrail({ skill: 0 });

  assert.equal(state.trail.stopsDone.length, 40, "a struggling child got stuck");
  for (const stop of QUEST_STOPS) {
    assert.ok(isStopUnlocked(state, stop.id), `${stop.id} was never reachable`);
  }

  // …and nothing is claimed on their behalf. Not one stone lights up.
  assert.deepEqual(state.stones, [], "a child who got everything wrong has 'mastered' something");
  assert.equal(countMastered(state.mastery), 0);

  // Zero stars means zero sparks. The economy cannot be farmed by failing.
  assert.equal(availableSparks(state), 0);
});

test("the sounds a struggling child cannot do KEEP COMING BACK", () => {
  // The other half of the promise: not blocked, but not abandoned either.
  const state = walkTheTrail({ skill: 0 });

  // `a`, taught at stop 1, must still have been served late in the trail.
  const a = state.mastery.a;
  assert.ok(a, "the sound `a` was never even recorded");
  assert.ok(a.seen > 20, `a struggling child saw \`a\` only ${a.seen} times across 40 stops — it stopped coming back`);
  assert.equal(a.state, MASTERY_STATES.LEARNING);
  assert.equal(a.box, 1, "a sound the child keeps missing must stay in the most-frequent review box");
});

test("a middling child ends up somewhere in between, and nothing throws", () => {
  const state = walkTheTrail({ skill: 0.75, passes: 2 });
  assert.equal(state.trail.stopsDone.length, 40);
  const mastered = countMastered(state.mastery);
  assert.ok(mastered > 0, "a 75% reader mastered nothing");
  // Heart words are namespaced and must never be counted as sounds on the wall.
  for (const stone of state.stones) {
    assert.ok(!isHeartTarget(stone), `"${stone}" is a heart word and must not be a stone`);
    assert.ok(!stone.includes(":"), `"${stone}" is not a sound`);
  }
});

test("every stop on the trail can be played end to end without throwing", () => {
  let state = baseQuestState();
  for (const [i, stop] of QUEST_STOPS.entries()) {
    const result = playStop(state, stop.id, { skill: 0.8, day: i + 1 });
    assert.ok(result.tally.total > 0, `${stop.id} "${stop.name}" served ZERO questions — an empty stop`);
    assert.ok(result.stars >= 0 && result.stars <= 3);
    state = result.state;
  }
});
