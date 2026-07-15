import test from "node:test";
import assert from "node:assert/strict";
import { QUEST_STOPS } from "../../src/data/questSequence.js";
import { buildTrailSection } from "../../src/utils/questHub.js";
import {
  PHYSICAL_ENCOUNTER_KINDS,
  PHYSICAL_MECHANICS_BY_ENCOUNTER,
  buildPhysicalTask,
  fieldCollisionStep,
  physicalTaskForwardLimit,
  physicalTaskResidentPoint,
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

test("a new floor-letter stage cannot retrigger until the player leaves the old collision zone", () => {
  const firstTouch = fieldCollisionStep({
    armed: true,
    player: { x: 0, z: 0 },
    interactionRadius: 1,
    items: [{ x: 0, z: 0, visible: true, choice: { value: "h", stage: 0 } }]
  });
  assert.equal(firstTouch.choice.value, "h");
  assert.equal(firstTouch.armed, false);

  const nextStageOverlap = fieldCollisionStep({
    armed: firstTouch.armed,
    player: { x: 0, z: 0 },
    stage: 1,
    interactionRadius: 1,
    items: [
      { x: 0.2, z: 0, visible: true, choice: { value: "h", stage: 0 } },
      { x: 0, z: 0, visible: true, choice: { value: "a", stage: 1 } }
    ]
  });
  assert.equal(nextStageOverlap.choice, null);
  assert.equal(nextStageOverlap.armed, false);

  const movedClear = fieldCollisionStep({
    armed: nextStageOverlap.armed,
    player: { x: 1.6, z: 0 },
    stage: 1,
    interactionRadius: 1,
    items: [
      { x: 1.7, z: 0, visible: true, choice: { value: "h", stage: 0 } },
      { x: 0, z: 0, visible: true, choice: { value: "a", stage: 1 } }
    ]
  });
  assert.equal(movedClear.choice, null);
  assert.equal(movedClear.armed, true);

  const secondTouch = fieldCollisionStep({
    armed: movedClear.armed,
    player: { x: 0, z: 0 },
    interactionRadius: 1,
    items: [{ x: 0, z: 0, visible: true, choice: { value: "a", stage: 1 } }]
  });
  assert.equal(secondTouch.choice.value, "a");
});

test("physical-task residents stand outside the choice spread", () => {
  const section = buildTrailSection("s3", { seed: 3 });
  for (const encounter of section.encounters) {
    const task = buildPhysicalTask(section, encounter, encounter.beats[0], 0);
    const resident = physicalTaskResidentPoint(section, encounter);
    const closestItem = Math.min(...task.items.map(item => Math.hypot(item.x - resident.x, item.z - resident.z)));
    assert.ok(closestItem > 1.35, `${encounter.id} resident still obscures a choice (${closestItem.toFixed(2)})`);
  }
});

test("early phonics encounters hide the answer in the cue and use three widely spaced choices", () => {
  const section = buildTrailSection("s1", { seed: 1 });
  for (const encounter of section.encounters) {
    for (const [beatIndex, beat] of encounter.beats.entries()) {
      const task = buildPhysicalTask(section, encounter, beat, beatIndex);
      if (encounter.kind === "hungry-beast") {
        assert.ok(task.completions.every(completion => completion.label === ""), "a solved ornament repeats the answer letter");
        assert.ok(task.completions.every(completion => completion.showToken === false), "a solved ornament still creates a letter token");
      }
      for (const [stageIndex, stage] of task.stages.entries()) {
        if (stage.audioCue?.kind === "grapheme") {
          assert.equal(stage.prompt, "Find the letter that matches the sound");
        } else if (stage.audioCue?.kind === "word") {
          assert.equal(
            stage.prompt,
            stageIndex === 0
              ? `Find the letter that starts '${beat.word}'`
              : `Find the next sound in '${beat.word}'`
          );
        }
        for (const answer of Array.isArray(beat.answer) ? beat.answer : [beat.answer]) {
          assert.doesNotMatch(stage.prompt, new RegExp(`\\b${answer}\\b[.!?]?$`, "i"));
        }
        assert.ok(stage.prompt.split(/\s+/).length <= 8, `${stage.prompt} is too long for a child cue`);
        assert.ok(stage.items.length <= 3, `${encounter.id} still presents ${stage.items.length} choices`);
        for (let first = 0; first < stage.items.length; first += 1) {
          for (let second = first + 1; second < stage.items.length; second += 1) {
            const distance = Math.hypot(
              stage.items[first].x - stage.items[second].x,
              stage.items[first].z - stage.items[second].z
            );
            assert.ok(distance > 2.1, `${encounter.id} choices are still clustered (${distance.toFixed(2)})`);
          }
        }
      }
    }
  }
});

test("delivery markers are reachable without unlocking the next encounter", () => {
  const section = buildTrailSection("s3", { seed: 3 });
  const encounter = section.encounters[0];
  const task = buildPhysicalTask(section, encounter, encounter.beats[0], 0);
  const baseLimit = encounter.progress - 0.012;
  const limit = physicalTaskForwardLimit(section, encounter, task, baseLimit, 1.5);
  const marker = task.stages[1].items[0];
  const nextEncounter = section.encounters[1];
  assert.ok(limit >= marker.progress, "the carry marker remains beyond the encounter barrier");
  assert.ok(limit < nextEncounter.progress - 0.01, "the task opened the next encounter early");
});
