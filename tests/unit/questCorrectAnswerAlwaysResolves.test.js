// A CORRECT ANSWER MUST NEVER SILENTLY DO NOTHING.
//
// Playtest at Bramble Gate: "the answer is 'c' but when you go to it it does
// nothing; the other two say wrong and bump you."
//
// That is the worst response a learning game can give. A child who found the
// right answer, walked to it, and got no reaction cannot distinguish that from
// being wrong — except that being wrong at least ANSWERED them. Silence on the
// correct choice actively teaches that the right answer is the broken one.
//
// The cause was the verb layer. Each authored mechanic is a small state
// machine (hold a plank, choose a note, then conduct it). When its internal
// state drifts out of step with the stage the child is on, `apply` returns
// accepted:false for the CORRECT value, and the UI had a branch that turned
// that into an early return with no feedback at all.
//
// The rule now: a verb may DELAY a correct answer (the rhythm gate genuinely
// asks the child to wait for the pulse) but it may never SWALLOW one. Every
// other refusal of a correct value is the machine disagreeing with itself, and
// the child must not pay for that.

import test from "node:test";
import assert from "node:assert/strict";

import { QUEST_STOPS } from "../../src/data/questSequence.js";
import { buildTrailSection } from "../../src/utils/questHub.js";
import { buildPhysicalTask, physicalStage } from "../../src/utils/questPhysicalMechanics.js";
import {
  applyQuestTaskInput,
  restoreSeedwakeVerbState,
  resyncSeedwakeVerbState
} from "../../src/utils/questSliceSystems.js";

function learningSequence(task) {
  if (task?.learningSequence?.length) return [...task.learningSequence];
  return (task?.stages || [])
    .map(stage => stage.items.find(item => item.correct)?.value)
    .filter(value => value != null);
}

// Mirrors QuestPixelWorld.choose: what does the child actually get back?
function outcomeForCorrectPick(task, stageIndex) {
  const stage = physicalStage(task, stageIndex);
  const correct = (stage.items || []).find(item => item.correct);
  if (!correct) return "no-answer-on-stage";

  const state = restoreSeedwakeVerbState(
    task.mechanic,
    learningSequence(task),
    task.stages,
    stageIndex
  );

  const verbResult = applyQuestTaskInput({
    chapterAuthored: task.chapterAuthored,
    mechanic: task.mechanic,
    state,
    input: {
      type: stage.playerAction,
      correct: true,
      value: correct.value,
      stage: stageIndex,
      onBeat: true // the pulse is open; a rhythm wait is not what we are testing
    }
  });

  if (verbResult.accepted) return "accepted";

  // The runtime's guarantee: a non-rhythm refusal of a correct value is
  // overridden and the machine re-synced. The resync must return a usable
  // state — never undefined, which would strand the next stage.
  if (!stage.rhythm) {
    const resynced = resyncSeedwakeVerbState(
      task.mechanic,
      state,
      correct.value,
      stageIndex,
      stage.playerAction
    );
    return resynced ? "accepted-by-override" : "override-lost-state";
  }
  return "waiting-for-pulse";
}

test("picking the correct answer always resolves, at every stage of every stop", () => {
  const swallowed = [];
  for (const stop of QUEST_STOPS) {
    const section = buildTrailSection(stop.id, { seed: stop.index });
    if (!section) continue;
    for (const encounter of section.encounters) {
      encounter.beats.forEach((beat, beatIndex) => {
        const task = buildPhysicalTask(section, encounter, beat, beatIndex);
        if (!task) return;
        task.stages.forEach((_, stageIndex) => {
          const outcome = outcomeForCorrectPick(task, stageIndex);
          // "waiting-for-pulse" is only ever legitimate on a rhythm stage,
          // where the child is told to wait and the window reopens.
          const ok = outcome === "accepted"
            || outcome === "accepted-by-override"
            || outcome === "no-answer-on-stage"
            || (outcome === "waiting-for-pulse" && physicalStage(task, stageIndex).rhythm);
          if (!ok) {
            swallowed.push(`${stop.id}/${encounter.kind}/beat${beatIndex}/stage${stageIndex} (${task.mechanic}): ${outcome}`);
          }
        });
      });
    }
  }
  assert.deepEqual(swallowed, [], `Correct answers that produced no response:\n${swallowed.join("\n")}`);
});

test("a stalled verb is re-synced rather than left disagreeing with the child", () => {
  // gate-chorus is the mechanic the playtest hit: choose a note, then conduct
  // it. Hand it a correct value from a deliberately stale state and confirm we
  // recover instead of rejecting forever.
  const stale = { expected: ["c"], selected: "WRONG", notes: [], pulse: 0 };
  const resynced = resyncSeedwakeVerbState("gate-chorus", stale, "c", 0);
  assert.notDeepEqual(resynced, stale, "state did not move after a correct answer");
  assert.equal(resynced.selected, "c", "the child's correct note was not registered");
});

test("resync never invents state for an unknown mechanic", () => {
  const state = { expected: ["a"], notes: [] };
  assert.deepEqual(
    resyncSeedwakeVerbState("not-a-real-mechanic", state, "a", 0),
    state,
    "an unknown verb must be left untouched rather than guessed at"
  );
});
