import test from "node:test";
import assert from "node:assert/strict";
import { QUEST_STOPS } from "../../src/data/questSequence.js";
import { buildTrailSection } from "../../src/utils/questHub.js";
import {
  PHYSICAL_ENCOUNTER_KINDS,
  PHYSICAL_MECHANICS_BY_ENCOUNTER,
  buildPhysicalTask,
  physicalStage
} from "../../src/utils/questPhysicalMechanics.js";
import { SEEDWAKE_STOP_IDS, seedwakeStopSpec } from "../../src/data/questChapterOne.js";

test("every encounter in all forty stops has an in-world physical task", () => {
  const mechanics = new Set();
  const chapterVerbs = new Set();
  for (const stop of QUEST_STOPS) {
    const section = buildTrailSection(stop.id, { seed: stop.index });
    section.encounters.forEach(encounter => {
      encounter.beats.forEach((beat, beatIndex) => {
        const task = buildPhysicalTask(section, encounter, beat, beatIndex);
        assert.ok(task, `${stop.id} ${encounter.kind} beat ${beatIndex} fell back to a popup`);
        assert.ok(task.items.length >= 2, `${stop.id} ${encounter.kind} has no physical choices`);
        assert.ok(physicalStage(task, 0)?.prompt);
        mechanics.add(task.mechanic);
        chapterVerbs.add(task.chapterVerb);
      });
    });
  }
  assert.ok(
    [...new Set(Object.values(PHYSICAL_MECHANICS_BY_ENCOUNTER))].every(mechanic => mechanics.has(mechanic)),
    "the legacy encounter mechanics remain covered outside Seedwake"
  );
  assert.ok(mechanics.size >= PHYSICAL_ENCOUNTER_KINDS.length, "Seedwake adds no distinct production mechanics");
  assert.ok(chapterVerbs.size >= 20, "chapter verbs do not vary across the journey");
});

test("bridge, echo and sorting mechanics require complete ordered sequences", () => {
  const sections = QUEST_STOPS.map(stop => buildTrailSection(stop.id, { seed: stop.index }));
  const encounters = sections.flatMap(section => section.encounters.map(encounter => ({ section, encounter })));
  for (const kind of ["broken-bridge", "echo-cave", "sheep-pens"]) {
    const found = encounters.find(entry => entry.encounter.kind === kind);
    assert.ok(found, `no ${kind} encounter exists`);
    const beat = found.encounter.beats[0];
    const task = buildPhysicalTask(found.section, found.encounter, beat, 0);
    assert.ok(task.stages.length > 1, `${kind} collapsed into one tap`);
    task.stages.forEach((stage, index) => {
      assert.equal(stage.items.filter(item => item.correct).length, 1, `${kind} stage ${index} has an ambiguous answer`);
      assert.ok(stage.completion, `${kind} stage ${index} leaves no physical result`);
    });
  }
});

test("story choices are real route portals and do not invent mastery targets", () => {
  const section = buildTrailSection("s40", { seed: 40 });
  const encounter = section.encounters.find(item => item.kind === "story-rock");
  assert.ok(encounter);
  const task = buildPhysicalTask(section, encounter, encounter.beats[0], 0);
  assert.equal(task.mechanic, "story-choice");
  assert.ok(task.storyText.length > 20);
  assert.ok(task.items.every(item => item.shape === "story-path" && item.correct));
  assert.equal(encounter.beats[0].target, null);
});

test("Seedwake turns the same curriculum shells into five different physical games", () => {
  const expectedShapes = {
    s1: "seed-lantern",
    s2: "jump-flower",
    s3: "sound-parcel",
    s4: "river-plank",
    s5: "chorus-lantern"
  };
  for (const stopId of SEEDWAKE_STOP_IDS) {
    const section = buildTrailSection(stopId, { seed: Number(stopId.slice(1)) });
    const task = buildPhysicalTask(section, section.encounters[0], section.encounters[0].beats[0], 0);
    assert.equal(task.mechanic, seedwakeStopSpec(stopId).mechanic);
    assert.equal(task.items[0].shape, expectedShapes[stopId]);
    assert.equal(task.mission, seedwakeStopSpec(stopId).mission);
    assert.ok(task.stages.every(stage => stage.playerAction));
  }
});

test("Rook Stones requires picking up a parcel and physically delivering it", () => {
  const section = buildTrailSection("s3", { seed: 3 });
  const encounter = section.encounters[0];
  const task = buildPhysicalTask(section, encounter, encounter.beats[0], 0);
  assert.equal(task.mechanic, "delivery-run");
  assert.equal(task.stages.length, 2);
  assert.equal(task.stages[0].playerAction, "pick-up");
  assert.equal(task.stages[1].playerAction, "carry");
  assert.equal(task.stages[1].items[0].shape, "delivery-marker");
  assert.equal(task.stages[1].items[0].correct, true);
});
