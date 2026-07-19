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
  physicalResponsesInSection,
  physicalStage,
  physicalStagePrompt,
  physicalStageRecordsMastery
} from "../../src/utils/questPhysicalMechanics.js";

test("muted audio stages become explicit guided play without banking mastery", () => {
  const stage = {
    prompt: "Find the letter that matches the sound",
    audioCue: { kind: "grapheme", value: "b" },
    items: [
      { value: "h", label: "h", correct: false },
      { value: "b", label: "b", correct: true },
      { value: "i", label: "i", correct: false }
    ]
  };
  assert.equal(physicalStagePrompt(stage, true), stage.prompt);
  assert.equal(physicalStagePrompt(stage, false), "Find b");
  assert.equal(physicalStageRecordsMastery(stage, true), true);
  assert.equal(physicalStageRecordsMastery(stage, false), false);
  assert.equal(physicalStageRecordsMastery({ ...stage, audioCue: null }, false), true);
});
import { SEEDWAKE_STOP_IDS, seedwakeStopSpec } from "../../src/data/questChapterOne.js";
import { CHAPTER_VERB_RECIPES } from "../../src/data/questChapterMechanics.js";
import { hasGraphemeAudio, hasWordAudio } from "../../src/utils/questAudio.js";
import {
  budgetPhysicalSection,
  QUEST_PHYSICAL_ACTION_BUDGET,
  questPacingDecision
} from "../../src/utils/questPhysicalPlan.js";

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
        assert.equal(task.baseMechanic, PHYSICAL_MECHANICS_BY_ENCOUNTER[encounter.kind]);
        mechanics.add(task.baseMechanic);
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

test("no physical sound-to-letter stage asks a child to replay missing audio", () => {
  for (const stop of QUEST_STOPS) {
    const section = buildTrailSection(stop.id, { seed: stop.index });
    for (const encounter of section.encounters) {
      encounter.beats.forEach((beat, beatIndex) => {
        const task = buildPhysicalTask(section, encounter, beat, beatIndex);
        task.stages.forEach(stage => {
          if (stage.audioCue?.kind === "grapheme") {
            assert.ok(
              hasGraphemeAudio(stage.audioCue.value),
              `${stop.id} ${task.mechanic} exposes silent grapheme cue ${stage.audioCue.value}`
            );
          }
          if (
            stage.audioCue?.kind === "word"
            && ["sound-hunt", "creature-feed", "fork-sprint"].includes(task.baseMechanic)
          ) {
            assert.ok(
              hasWordAudio(stage.audioCue.value),
              `${stop.id} ${task.mechanic} exposes silent word cue ${stage.audioCue.value}`
            );
          }
        });
      });
    }
  }
});

test("unrecorded advanced graphemes use audible example-word cues instead of disappearing", () => {
  for (const [stopId, target] of [["s32", "aw"], ["s32", "ore"], ["s34", "are"], ["s35", "ear"], ["s36", "ure"], ["s39", "le"], ["s40", "tion"]]) {
    const section = buildTrailSection(stopId, { seed: Number(stopId.slice(1)), targets: [target] });
    const entries = section.encounters.flatMap(encounter => (
      encounter.beats.map((beat, beatIndex) => ({
        beat,
        task: buildPhysicalTask(section, encounter, beat, beatIndex)
      }))
    ));
    const fallback = entries.find(entry => entry.beat.target === target && entry.beat.cue?.kind === "word");
    const wordLed = fallback?.task.stages.find(stage => stage.items.some(item => item.correct && item.value === target));
    assert.ok(fallback && wordLed, `${target} has no audible physical fallback`);
    assert.ok(hasWordAudio(fallback.beat.cue.word), `${target} fallback word is silent`);
    assert.equal(wordLed.audioCue.value, fallback.beat.cue.word);
    assert.match(wordLed.prompt, /Find the (first|middle|ending) sound in/);
  }
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
    if (kind === "sheep-pens") {
      assert.ok(task.stages.length <= 3, "the sound sort became a six-item drill again");
      assert.equal(new Set(task.stages.map(stage => stage.items.find(item => item.correct)?.value)).size, 2);
    }
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
  const layouts = new Set();
  const actionSignatures = new Set();
  for (const stopId of SEEDWAKE_STOP_IDS) {
    const section = buildTrailSection(stopId, { seed: Number(stopId.slice(1)) });
    const task = buildPhysicalTask(section, section.encounters[0], section.encounters[0].beats[0], 0);
    assert.equal(task.mechanic, seedwakeStopSpec(stopId).mechanic);
    assert.equal(task.items[0].shape, expectedShapes[stopId]);
    assert.equal(task.mission, seedwakeStopSpec(stopId).mission);
    assert.ok(task.stages.every(stage => stage.playerAction));
    layouts.add(task.layout);
    actionSignatures.add(task.stages.map(stage => stage.playerAction).join(">"));
  }
  assert.deepEqual([...layouts].sort(), ["circle", "delivery", "scatter", "stepping", "workshop"]);
  assert.equal(actionSignatures.size, 5, "the five games still collapse to the same physical action");
});

test("every later stop opens with its assigned chapter-authored physical verb", () => {
  const verifiedVerbs = new Set();

  for (const stop of QUEST_STOPS.filter(item => item.index > 5)) {
    const section = buildTrailSection(stop.id, { seed: stop.index });
    const encounter = section.encounters[0];
    const task = buildPhysicalTask(section, encounter, encounter.beats[0], 0);
    const expectedVerb = section.chapter.mechanicRotation[section.chapterStop - 1];
    const recipe = CHAPTER_VERB_RECIPES[expectedVerb];

    assert.ok(recipe, `${stop.id} has no authored recipe for ${expectedVerb}`);
    assert.equal(task.chapterAuthored, true, `${stop.id} fell back to a generic encounter`);
    assert.equal(task.chapterVerb, expectedVerb, `${stop.id} uses the wrong chapter verb`);
    assert.equal(task.mechanic, expectedVerb, `${stop.id} did not promote its chapter verb`);
    assert.equal(task.items[0]?.shape, recipe.shape, `${stop.id} uses the wrong physical object`);
    assert.equal(task.layout, recipe.layout, `${stop.id} uses the wrong staging layout`);
    assert.equal(task.mission, recipe.mission, `${stop.id} lost its child-facing mission`);
    assert.equal(task.verbPattern, recipe.pattern, `${stop.id} lost its physical verb family`);
    assert.ok(task.stages.every(stage => stage.verbPattern === recipe.pattern), `${stop.id} stages lost their physical verb family`);
    assert.ok(task.stages.every(stage => stage.playerAction), `${stop.id} has an inert task stage`);
    verifiedVerbs.add(expectedVerb);
  }

  assert.equal(verifiedVerbs.size, 35, "the later journey does not expose all 35 authored verbs");
});

test("secondary encounters retain their own physical family instead of copying the chapter opener", () => {
  const expected = {
    "broken-bridge": "assembly",
    "echo-cave": "assembly",
    "sheep-pens": "sort",
    "word-beast": "delivery",
    signpost: "search",
    "story-rock": "route"
  };
  const verified = new Set();
  for (const stop of QUEST_STOPS.filter(item => item.index > 5)) {
    const section = buildTrailSection(stop.id, { seed: stop.index });
    for (const encounter of section.encounters.slice(1)) {
      const task = buildPhysicalTask(section, encounter, encounter.beats[0], 0);
      assert.equal(task.verbPattern, expected[encounter.kind], `${stop.id} ${encounter.kind} inherited ${task.verbPattern}`);
      verified.add(encounter.kind);
    }
  }
  assert.deepEqual([...verified].sort(), Object.keys(expected).sort());
});

test("sorting verbs stage a moving lane with one unambiguous sound target", () => {
  for (const stopId of ["s6", "s17", "s38"]) {
    const section = buildTrailSection(stopId, { seed: Number(stopId.slice(1)) });
    const encounter = section.encounters[0];
    const task = buildPhysicalTask(section, encounter, encounter.beats[0], 0);
    assert.equal(task.verbPattern, "sort", `${stopId} did not enter the sorting family`);
    assert.equal(task.layout, "sorting-lane");
    assert.equal(task.stages.length, 2);
    assert.equal(task.stages[0].sorting, true);
    assert.equal(task.stages[0].items.filter(item => item.correct).length, 1);
    assert.ok(task.stages[0].items.every(item => item.role?.startsWith("sort-")));
    assert.equal(task.stages[1].items[0].role, "sort-destination");
    assert.equal(task.stages[1].carryFromStage, 0);
    assert.ok(task.stages[1].completion);
  }
});

test("pursuit verbs require identification followed by an in-world chase", () => {
  for (const stopId of ["s8", "s14", "s23", "s31"]) {
    const section = buildTrailSection(stopId, { seed: Number(stopId.slice(1)) });
    const encounter = section.encounters[0];
    const task = buildPhysicalTask(section, encounter, encounter.beats[0], 0);
    assert.equal(task.verbPattern, "pursuit", `${stopId} did not enter the pursuit family`);
    assert.equal(task.stages.length, 2);
    assert.equal(task.stages[0].pursuitStep, 0);
    assert.equal(task.stages[1].pursuitStep, 1);
    assert.equal(task.stages[1].items[0].role, "pursuit-target");
    assert.ok(task.stages[1].items[0].progress > encounter.progress);
    assert.ok(task.stages[1].completion);
  }
});

test("fossil brushing requires identification followed by sustained tool work", () => {
  const section = buildTrailSection("s11", { seed: 11 });
  const encounter = section.encounters[0];
  const task = buildPhysicalTask(section, encounter, encounter.beats[0], 0);
  assert.equal(task.mechanic, "bone-hunt");
  assert.equal(task.verbPattern, "tool");
  assert.deepEqual(task.stages.map(stage => stage.playerAction), ["choose-fossil", "brush-fossil"]);
  assert.equal(task.stages[1].items[0].role, "tool-work");
  assert.equal(task.stages[1].items[0].toolHoldMs, 850);
  assert.equal(task.stages[1].items[0].label, "");
  assert.ok(task.stages[1].completion);
});

test("observatory turning requires a sound choice and three ordered orbit positions", () => {
  const section = buildTrailSection("s35", { seed: 35 });
  const encounter = section.encounters[0];
  const task = buildPhysicalTask(section, encounter, encounter.beats[0], 0);
  assert.equal(task.mechanic, "observatory-turn");
  assert.equal(task.verbPattern, "turn");
  assert.equal(task.stages.length, 4);
  assert.equal(task.stages[0].playerAction, "choose-orbit");
  assert.deepEqual(task.stages.slice(1).map(stage => stage.turnStep), [1, 2, 3]);
  assert.deepEqual(task.stages.slice(1).map(stage => stage.items[0].turnAngle), [155, -85, 75]);
  assert.ok(task.stages.slice(1).every(stage => stage.items[0].role === "turn-node"));
  assert.equal(task.stages[1].completion, undefined);
  assert.equal(task.stages[2].completion, undefined);
  assert.ok(task.stages[3].completion);
});

test("river ferry requires sound selection followed by a three-gate steering slalom", () => {
  const section = buildTrailSection("s7", { seed: 7 });
  const encounter = section.encounters[0];
  const task = buildPhysicalTask(section, encounter, encounter.beats[0], 0);
  assert.equal(task.mechanic, "ferry-delivery");
  assert.equal(task.verbPattern, "steer");
  assert.equal(task.stages.length, 4);
  assert.equal(task.stages[0].playerAction, "board-ferry");
  assert.deepEqual(task.stages.slice(1).map(stage => stage.steerStep), [1, 2, 3]);
  assert.deepEqual(task.stages.slice(1).map(stage => stage.items[0].steerLateral), [-58, 58, 0]);
  assert.ok(task.stages.slice(1).every(stage => stage.items[0].role === "steer-gate"));
  assert.ok(task.stages.slice(1).every(stage => stage.carryFromStage === 0));
  assert.equal(task.stages[1].completion, undefined);
  assert.equal(task.stages[2].completion, undefined);
  assert.ok(task.stages[3].completion);
});

test("signal verbs require sound selection followed by two sustained world relays", () => {
  for (const stopId of ["s15", "s25", "s30"]) {
    const section = buildTrailSection(stopId, { seed: Number(stopId.slice(1)) });
    const encounter = section.encounters[0];
    const task = buildPhysicalTask(section, encounter, encounter.beats[0], 0);
    assert.equal(task.verbPattern, "signal", `${stopId} did not enter the signal family`);
    assert.equal(task.stages.length, 3);
    assert.deepEqual(task.stages.slice(1).map(stage => stage.signalStep), [1, 2]);
    assert.deepEqual(task.stages.slice(1).map(stage => stage.items[0].signalLateral), [-52, 52]);
    assert.ok(task.stages.slice(1).every(stage => stage.items[0].role === "signal-pad"));
    assert.ok(task.stages.slice(1).every(stage => stage.items[0].signalHoldMs === 700));
    assert.equal(task.stages[1].completion, undefined);
    assert.ok(task.stages[2].completion);
  }
});

test("cliff route requires sound selection followed by three sustained climbing holds", () => {
  const section = buildTrailSection("s26", { seed: 26 });
  const encounter = section.encounters[0];
  const task = buildPhysicalTask(section, encounter, encounter.beats[0], 0);
  assert.equal(task.mechanic, "cliff-route");
  assert.equal(task.verbPattern, "climb");
  assert.equal(task.stages.length, 4);
  assert.deepEqual(task.stages.slice(1).map(stage => stage.climbStep), [1, 2, 3]);
  assert.deepEqual(task.stages.slice(1).map(stage => stage.items[0].climbLateral), [-34, 34, 0]);
  assert.ok(task.stages.slice(1).every(stage => stage.items[0].role === "climb-hold"));
  assert.ok(task.stages.slice(1).every(stage => stage.items[0].climbHoldMs === 520));
  assert.equal(task.stages[1].completion, undefined);
  assert.equal(task.stages[2].completion, undefined);
  assert.ok(task.stages[3].completion);
});

test("Seedwake layouts create exploration, stepping, delivery, workshop and circle staging", () => {
  const tasks = Object.fromEntries(SEEDWAKE_STOP_IDS.map(stopId => {
    const section = buildTrailSection(stopId, { seed: Number(stopId.slice(1)) });
    return [stopId, buildPhysicalTask(section, section.encounters[0], section.encounters[0].beats[0], 0)];
  }));
  const progressSpan = task => Math.max(...task.items.map(item => item.progress)) - Math.min(...task.items.map(item => item.progress));
  assert.ok(progressSpan(tasks.s2) > progressSpan(tasks.s1), "Fern Steps does not advance as a stepping path");
  const s5Items = tasks.s5.stages[0].items;
  const centreX = s5Items.reduce((sum, item) => sum + item.x, 0) / s5Items.length;
  const centreZ = s5Items.reduce((sum, item) => sum + item.z, 0) / s5Items.length;
  assert.ok(s5Items.every(item => Math.hypot(item.x - centreX, item.z - centreZ) > 2.4), "gate lanterns do not form a circle");
  assert.deepEqual(tasks.s4.stages.map(stage => stage.playerAction), ["lift-plank", "place-plank"]);
  assert.equal(tasks.s4.stages[1].carryFromStage, 0);
  assert.equal(tasks.s4.stages[1].items[0].shape, "bridge-slot");
  assert.deepEqual(tasks.s5.stages.map(stage => stage.playerAction), ["choose-note", "conduct"]);
  assert.equal(tasks.s5.stages[1].rhythm, true);
});

test("completed physical work retains its route position for persistent world changes", () => {
  for (const stopId of ["s1", "s3", "s4", "s5", "s13", "s24", "s40"]) {
    const section = buildTrailSection(stopId, { seed: Number(stopId.slice(1)) });
    const task = buildPhysicalTask(section, section.encounters[0], section.encounters[0].beats[0], 0);
    for (const completion of task.completions) {
      assert.ok(Number.isFinite(completion.progress), `${stopId} ${task.mechanic} completion lost its route position`);
      assert.ok(completion.progress >= section.encounters[0].progress, `${stopId} completion moved behind its activity`);
      assert.ok(completion.progress <= 0.89, `${stopId} completion escaped beyond the gate`);
    }
  }
});

test("Seedwake trails stay within a child-sized physical action budget", () => {
  for (const stopId of SEEDWAKE_STOP_IDS) {
    const section = buildTrailSection(stopId, { seed: Number(stopId.slice(1)) });
    assert.ok(section.encounters.length <= 2, `${stopId} has too many encounter stops`);
    assert.ok(physicalResponsesInSection(section) <= 9, `${stopId} asks for too many physical actions`);
  }
});

test("the pixel and accessible journey budget the actions a child actually performs", () => {
  let maximum = 0;
  for (const stop of QUEST_STOPS) {
    const full = buildTrailSection(stop.id, { seed: stop.index });
    const section = budgetPhysicalSection(full);
    const actions = physicalResponsesInSection(section);
    maximum = Math.max(maximum, actions);
    assert.ok(section.encounters.length >= 1, `${stop.id} lost every physical encounter`);
    assert.ok(actions <= QUEST_PHYSICAL_ACTION_BUDGET, `${stop.id} still asks for ${actions} physical actions`);
    assert.equal(section.physicalPlan.actions, actions, `${stop.id} reports the wrong physical budget`);
    assert.ok(section.encounters.every((encounter, index) => encounter.order === index));
    assert.equal(section.encounters.at(-1).atGate, true);
  }
  assert.equal(maximum, QUEST_PHYSICAL_ACTION_BUDGET, "the journey no longer exercises its intentional action ceiling");
});

test("pacing defers surplus evidence only after repeated struggle and enough completed play", () => {
  assert.equal(questPacingDecision({
    tally: { total: 5, mistakes: 2 }, completedBeats: 2, totalBeats: 4
  }).defer, true);
  assert.deepEqual(questPacingDecision({
    tally: { total: 5, mistakes: 2 }, completedBeats: 2, totalBeats: 4
  }), {
    defer: true,
    deferredBeats: 2,
    reason: "repeated-corrections",
    mistakeRate: 0.4
  });
  assert.equal(questPacingDecision({
    tally: { total: 2, mistakes: 0 }, slowResponses: 2, completedBeats: 2, totalBeats: 3
  }).reason, "repeated-slow-responses");
  assert.equal(questPacingDecision({
    tally: { total: 2, mistakes: 0 }, slowResponses: 1, completedBeats: 2, totalBeats: 3
  }).defer, false, "one slow response is not enough evidence to shorten an activity");
  assert.equal(questPacingDecision({
    tally: { total: 5, mistakes: 3 }, completedBeats: 1, totalBeats: 4
  }).defer, false, "one completed beat is too early to shorten the activity");
  assert.equal(questPacingDecision({
    tally: { total: 8, mistakes: 0 }, completedBeats: 3, totalBeats: 3
  }).defer, false, "finished evidence cannot be deferred");
});

test("later signature activities sample a word without crediting unseen pieces", () => {
  const section = buildTrailSection("s13", { seed: 13 });
  const task = buildPhysicalTask(section, section.encounters[0], section.encounters[0].beats[0], 0);
  assert.equal(task.mechanic, "dig-and-build");
  assert.ok(task.stages.length <= 4);
  assert.ok(task.learningSequence.length <= 2);
  assert.deepEqual(
    task.learningSequence,
    task.stages.filter(stage => stage.audioCue).map(stage => stage.items.find(item => item.correct)?.value)
  );
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
    const minimumGap = encounter.kind === "broken-bridge" ? 2.8 : 1.35;
    assert.ok(closestItem > minimumGap, `${encounter.id} resident still obscures a choice (${closestItem.toFixed(2)})`);
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
        // The prompt is keyed to the SHAPE OF THE TASK, not to the kind of cue.
        // It used to be keyed to the cue: grapheme cue => "Find the letter...",
        // word cue => "Find the first/next sound in 'sat'". That coupling broke
        // when sequence builds started cueing the actual sound instead of
        // replaying the whole word at every stage (see normaliseStageCue). A
        // bridge stage now plays /a/ AND says "Find the next sound in 'sat'",
        // which is strictly more information than either version gave before.
        if (beat.word) {
          assert.equal(
            stage.prompt,
            stageIndex === 0
              ? `Find the first sound in '${beat.word}'`
              : `Find the next sound in '${beat.word}'`,
            "a word build must tell the child which position it wants"
          );
        } else if (stage.audioCue?.kind === "grapheme") {
          assert.equal(stage.prompt, "Find the letter that matches the sound");
        }
        // A stage that builds a word must ask for one sound at a time, by ear.
        if (beat.word && stage.audioCue) {
          assert.equal(
            stage.audioCue.kind,
            "grapheme",
            `${encounter.id} stage ${stageIndex} replays the whole word instead of the sound it wants`
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
