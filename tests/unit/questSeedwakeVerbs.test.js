// FIVE STOPS, FIVE THINGS THE BODY ACTUALLY DOES.
//
// From playtest: "all of the mini games tasks are exactly the same — always
// find the letter?"
//
// That was true, and the cause was not a shortage of mechanics. Every Seedwake
// stage decorated its items as plain `target`/`distractor`, which the Phaser
// runtime resolves with one instant collision — so the lantern, the bloom, the
// parcel, the plank and the note were the same act in five costumes: walk into
// the thing with the right letter on it.
//
// The engine already implemented hold-to-charge (`tool-work`), hold-on-pulse
// (`signal-pad`) and press-and-stay (`climb-hold`), each with its own
// feedback. The LATER chapters used them. Chapter one — the only chapter most
// children will ever reach — used none.
//
// What this gate protects:
//   1. the five stops ask for five DIFFERENT physical demands
//   2. every option in a stage carries the SAME demand, so a child cannot
//      spot the answer by how it behaves instead of by how it sounds
//   3. exactly one option per stage is correct
//
// Point 2 is the subtle one and the easiest to regress: give only the right
// answer a special interaction and the game silently stops testing phonics.

import test from "node:test";
import assert from "node:assert/strict";

import { SEEDWAKE_STOP_IDS } from "../../src/data/questChapterOne.js";
import { buildTrailSection } from "../../src/utils/questHub.js";
import { buildPhysicalTask, physicalStage } from "../../src/utils/questPhysicalMechanics.js";

function seedwakeOpeningTask(stopId) {
  const section = buildTrailSection(stopId, { seed: Number(stopId.slice(1)) || 1 });
  if (!section) return null;
  // The chapter's signature verb lives on the FIRST encounter of the stop.
  const encounter = section.encounters[0];
  if (!encounter) return null;
  return buildPhysicalTask(section, encounter, encounter.beats[0], 0);
}

// A stop's "physical signature": what the child's hands and feet are asked to
// do, independent of which letters happen to be on screen.
function physicalSignature(task) {
  const roles = new Set();
  const actions = new Set();
  task.stages.forEach((_, index) => {
    const stage = physicalStage(task, index);
    if (stage.playerAction) actions.add(stage.playerAction);
    for (const item of stage.items || []) if (item.role) roles.add(item.role);
  });
  return [...[...roles].sort(), "|", ...[...actions].sort()].join(",");
}

test("the five Seedwake stops ask for five different physical demands", () => {
  const signatures = new Map();
  for (const stopId of SEEDWAKE_STOP_IDS) {
    const task = seedwakeOpeningTask(stopId);
    assert.ok(task, `${stopId} builds no opening task`);
    signatures.set(stopId, physicalSignature(task));
  }

  const unique = new Set(signatures.values());
  assert.equal(
    unique.size,
    SEEDWAKE_STOP_IDS.length,
    `Stops share a physical signature — the chapter is one verb in costumes:\n${
      [...signatures].map(([id, sig]) => `  ${id}: ${sig}`).join("\n")
    }`
  );
});

test("every option in a stage carries the same demand as the answer", () => {
  // If only the correct item is a `tool-work` and the wrong ones are plain,
  // the child learns to find the one that behaves differently — and the game
  // stops measuring whether they heard the sound.
  for (const stopId of SEEDWAKE_STOP_IDS) {
    const task = seedwakeOpeningTask(stopId);
    if (!task) continue;
    task.stages.forEach((_, index) => {
      const stage = physicalStage(task, index);
      const choices = (stage.items || []).filter(item => item.value != null);
      if (choices.length < 2) return; // a single destination marker is not a choice
      const roles = new Set(choices.map(item => item.role || "plain"));
      // Destinations legitimately differ from the things being chosen.
      roles.delete("destination");
      assert.ok(
        roles.size <= 1,
        `${stopId} stage ${index}: options differ by behaviour (${[...roles].join(", ")}) — the answer is findable without listening`
      );
    });
  }
});

test("exactly one option per choosing stage is correct", () => {
  for (const stopId of SEEDWAKE_STOP_IDS) {
    const task = seedwakeOpeningTask(stopId);
    if (!task) continue;
    task.stages.forEach((_, index) => {
      const stage = physicalStage(task, index);
      const choices = (stage.items || []).filter(item => item.value != null);
      if (choices.length < 2) return;
      const correct = choices.filter(item => item.correct);
      assert.equal(
        correct.length,
        1,
        `${stopId} stage ${index}: ${correct.length} correct options among ${choices.length}`
      );
    });
  }
});

test("stop 1 stays a plain touch", () => {
  // The first thing a four-year-old ever does in this game should ask for
  // nothing but "go to that one". Demand grows across the chapter; it does not
  // start complicated.
  const task = seedwakeOpeningTask("s1");
  const stage = physicalStage(task, 0);
  const roles = new Set((stage.items || []).map(item => item.role));
  assert.ok(
    !roles.has("tool-work") && !roles.has("signal-pad") && !roles.has("climb-hold"),
    `stop 1 should be a plain touch, got ${[...roles].join(", ")}`
  );
});

test("a hold-based stop states a hold duration a child can actually meet", () => {
  // A hold long enough to feel deliberate, short enough not to become a test
  // of patience or fine motor control. Anything outside this band is a
  // frustration bug waiting to be reported as "it doesn't work".
  for (const stopId of SEEDWAKE_STOP_IDS) {
    const task = seedwakeOpeningTask(stopId);
    if (!task) continue;
    task.stages.forEach((_, index) => {
      for (const item of physicalStage(task, index).items || []) {
        const hold = item.toolHoldMs ?? item.signalHoldMs ?? item.climbHoldMs;
        if (hold == null) continue;
        assert.ok(
          hold >= 300 && hold <= 1200,
          `${stopId} stage ${index}: ${hold}ms hold is outside the 300-1200ms band`
        );
      }
    });
  }
});
