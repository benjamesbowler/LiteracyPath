import test from "node:test";
import assert from "node:assert/strict";
import { SEEDWAKE_STOP_IDS, seedwakeStopSpec } from "../../src/data/questChapterOne.js";
import { CHAPTER_VERB_RECIPES } from "../../src/data/questChapterMechanics.js";
import {
  CHAPTER_VERB_HANDLERS,
  SEEDWAKE_VERB_HANDLERS,
  advancePhonemeSlotState,
  applyQuestTaskInput,
  applySeedwakeVerbInput,
  createPhonemeSlotState,
  createQuestLocomotionState,
  createSeedwakeVerbState,
  encounterCameraPose,
  isChapterGateOpen,
  projectedRectInsideSafeArea,
  questCameraResponse,
  questCameraTravelTarget,
  questAnalogVector,
  questPointerDestination,
  questPointerObstacleVector,
  questActiveChoiceForwardLimit,
  questPixelAvoidActorOverlap,
  questPixelCameraZoom,
  questPixelChoiceOffsets,
  questPixelEdgeDetailPositions,
  questPixelSortLaneLayout,
  questPixelVerbProfile,
  questGateCrossingReached,
  questChoiceFocusIndex,
  questOptionalRouteCenters,
  questRestoredMemoryPlacement,
  questRouteLaneSelection,
  questMechanicProfile,
  questRhythmPulse,
  resolveQuestObstacleContacts,
  resolveQuestPointerIntent,
  restoreSeedwakeVerbState,
  seedwakeEncounterHudModel,
  seedwakeResidentPerformance,
  sliceSafeArea,
  stepQuestForwardBoundary,
  stepQuestRouteBoundary,
  stepQuestLocomotion
} from "../../src/utils/questSliceSystems.js";

test("Seedwake exposes five unique verb handlers with different observable rules", () => {
  const mechanics = SEEDWAKE_STOP_IDS.map(stopId => seedwakeStopSpec(stopId).mechanic);
  const handlers = mechanics.map(mechanic => SEEDWAKE_VERB_HANDLERS[mechanic]);
  assert.equal(new Set(handlers.map(handler => handler.id)).size, 5);
  assert.equal(new Set(handlers.map(handler => handler.input)).size, 5);
  assert.ok(handlers.every(handler => typeof handler.apply === "function" && typeof handler.create === "function"));

  const find = applySeedwakeVerbInput("sound-hunt", createSeedwakeVerbState("sound-hunt"), {
    type: "search",
    correct: true,
    value: "m"
  });
  assert.equal(find.completed, true);

  const jumpWithoutJumping = applySeedwakeVerbInput("flower-jump", createSeedwakeVerbState("flower-jump"), {
    type: "search",
    correct: true,
    value: "m"
  });
  assert.equal(jumpWithoutJumping.completed, false);

  const picked = applySeedwakeVerbInput("delivery-run", createSeedwakeVerbState("delivery-run"), {
    type: "pick-up",
    correct: true,
    value: "parcel-m"
  });
  assert.equal(picked.completed, false);
  assert.equal(picked.state.carrying, "parcel-m");
  const delivered = applySeedwakeVerbInput("delivery-run", picked.state, {
    type: "carry",
    correct: true,
    value: "rook-stone"
  });
  assert.equal(delivered.completed, true);

  const bridge = createSeedwakeVerbState("bridge-build", ["m", "a", "t"]);
  const outOfOrder = applySeedwakeVerbInput("bridge-build", bridge, { type: "lift-plank", correct: true, value: "a" });
  assert.deepEqual(outOfOrder.state.placed, []);
  const liftedPlank = applySeedwakeVerbInput("bridge-build", bridge, { type: "lift-plank", correct: true, value: "m" });
  assert.equal(liftedPlank.state.held, "m");
  assert.deepEqual(liftedPlank.state.placed, []);
  const firstPlank = applySeedwakeVerbInput("bridge-build", liftedPlank.state, { type: "place-plank", correct: true, value: "slot-m" });
  assert.equal(firstPlank.state.held, null);
  assert.deepEqual(firstPlank.state.placed, ["m"]);

  const chorus = createSeedwakeVerbState("gate-chorus", ["m", "a"]);
  const wrongBeat = applySeedwakeVerbInput("gate-chorus", chorus, { type: "choose-note", correct: false, value: "a" });
  assert.equal(wrongBeat.cue, "chorus-recue");
  const selectedNote = applySeedwakeVerbInput("gate-chorus", chorus, { type: "choose-note", correct: true, value: "m" });
  assert.equal(selectedNote.state.selected, "m");
  const earlyBeat = applySeedwakeVerbInput("gate-chorus", selectedNote.state, { type: "conduct", correct: true, value: "m", onBeat: false });
  assert.equal(earlyBeat.recordAttempt, false);
  assert.deepEqual(earlyBeat.state.notes, []);
  const rightBeat = applySeedwakeVerbInput("gate-chorus", selectedNote.state, { type: "conduct", correct: true, value: "m", onBeat: true });
  assert.deepEqual(rightBeat.state.notes, ["m"]);
});

test("chorus rhythm has a visible forgiving pulse window", () => {
  assert.equal(questRhythmPulse(0).open, false);
  assert.equal(questRhythmPulse(460).open, true);
  assert.ok(questRhythmPulse(460).intensity > questRhythmPulse(0).intensity);
});

test("mid-action checkpoints restore carried, held and selected state", () => {
  const delivery = restoreSeedwakeVerbState("delivery-run", ["m"], [{
    playerAction: "pick-up",
    items: [{ value: "m", correct: true }]
  }, {
    playerAction: "carry",
    items: [{ value: "marker", correct: true }]
  }], 1);
  assert.equal(delivery.carrying, "m");

  const bridge = restoreSeedwakeVerbState("bridge-build", ["m"], [{
    playerAction: "lift-plank",
    items: [{ value: "m", correct: true }]
  }, {
    playerAction: "place-plank",
    items: [{ value: "slot", correct: true }]
  }], 1);
  assert.equal(bridge.held, "m");

  const chorus = restoreSeedwakeVerbState("gate-chorus", ["m"], [{
    playerAction: "choose-note",
    items: [{ value: "m", correct: true }]
  }, {
    playerAction: "conduct",
    items: [{ value: "m", correct: true }]
  }], 1);
  assert.equal(chorus.selected, "m");
});

test("ordinary chapter mechanics accept correct world actions without Seedwake state", () => {
  const accepted = applyQuestTaskInput({
    chapterAuthored: false,
    mechanic: "echo-sequence",
    state: null,
    input: { correct: true, value: "m" }
  });
  assert.equal(accepted.accepted, true);
  assert.equal(accepted.completed, true);
  assert.equal(applyQuestTaskInput({
    chapterAuthored: false,
    mechanic: "word-delivery",
    input: { correct: false }
  }).accepted, false);
});

test("all later chapters expose real stateful physical verbs", () => {
  assert.equal(Object.keys(CHAPTER_VERB_RECIPES).length, 35);
  assert.deepEqual(Object.keys(CHAPTER_VERB_HANDLERS).sort(), Object.keys(CHAPTER_VERB_RECIPES).sort());
  assert.deepEqual(new Set(Object.values(CHAPTER_VERB_RECIPES).map(recipe => recipe.pattern)), new Set(["delivery", "assembly", "pursuit", "route", "sort", "tool", "turn", "steer", "signal", "climb", "rhythm"]));

  const ferry = CHAPTER_VERB_RECIPES["ferry-delivery"];
  const ferryStart = createSeedwakeVerbState("ferry-delivery", ["m"]);
  const boarded = applySeedwakeVerbInput("ferry-delivery", ferryStart, { type: ferry.actions[0], correct: true, value: "m" });
  assert.equal(boarded.state.selected, "m");
  const firstGate = applySeedwakeVerbInput("ferry-delivery", boarded.state, { type: ferry.actions[1], correct: true, value: "gate-1", stage: 1 });
  assert.equal(firstGate.state.gates, 1);
  const secondGate = applySeedwakeVerbInput("ferry-delivery", firstGate.state, { type: ferry.actions[1], correct: true, value: "gate-2", stage: 2 });
  const docked = applySeedwakeVerbInput("ferry-delivery", secondGate.state, { type: ferry.actions[1], correct: true, value: "gate-3", stage: 3 });
  assert.equal(docked.state.gates, 3);
  for (const step of [boarded, firstGate, secondGate, docked]) {
    assert.equal("completed" in step, false, "steer progress is completed by the renderer's real stage list");
  }

  const forge = CHAPTER_VERB_RECIPES["machine-sequence"];
  const machine = createSeedwakeVerbState("machine-sequence", ["m", "a"]);
  const wrongGear = applySeedwakeVerbInput("machine-sequence", machine, { type: forge.actions[0], correct: true, value: "a" });
  assert.equal(wrongGear.accepted, false);
  const liftedGear = applySeedwakeVerbInput("machine-sequence", machine, { type: forge.actions[0], correct: true, value: "m" });
  const fittedGear = applySeedwakeVerbInput("machine-sequence", liftedGear.state, { type: forge.actions[1], correct: true, value: "slot" });
  assert.deepEqual(fittedGear.state.placed, ["m"]);

  const signal = CHAPTER_VERB_RECIPES["pass-signal"];
  const beacon = createSeedwakeVerbState("pass-signal", ["m"]);
  const selected = applySeedwakeVerbInput("pass-signal", beacon, { type: signal.actions[0], correct: true, value: "m" });
  const firstRelay = applySeedwakeVerbInput("pass-signal", selected.state, { type: signal.actions[1], correct: true, value: "relay-1", stage: 1 });
  const sent = applySeedwakeVerbInput("pass-signal", firstRelay.state, { type: signal.actions[1], correct: true, value: "relay-2", stage: 2 });
  assert.equal(sent.state.relays, 2);
  for (const step of [selected, firstRelay, sent]) {
    assert.equal("completed" in step, false, "signal progress does not claim a magic stage threshold");
  }

  const route = CHAPTER_VERB_RECIPES["track-sort"];
  const trail = createSeedwakeVerbState("track-sort", ["m"]);
  const chosenTrail = applySeedwakeVerbInput("track-sort", trail, { type: route.actions[0], correct: true, value: "m" });
  assert.equal(chosenTrail.completed, false);

  const climb = CHAPTER_VERB_RECIPES["cliff-route"];
  const cliff = createSeedwakeVerbState("cliff-route", ["m"]);
  const chosenCliff = applySeedwakeVerbInput("cliff-route", cliff, { type: climb.actions[0], correct: true, value: "m" });
  const firstHold = applySeedwakeVerbInput("cliff-route", chosenCliff.state, { type: climb.actions[1], correct: true, value: "hold-1", stage: 1 });
  const secondHold = applySeedwakeVerbInput("cliff-route", firstHold.state, { type: climb.actions[1], correct: true, value: "hold-2", stage: 2 });
  const cliffTop = applySeedwakeVerbInput("cliff-route", secondHold.state, { type: climb.actions[1], correct: true, value: "hold-3", stage: 3 });
  assert.equal(cliffTop.state.holds, 3);
  for (const step of [chosenCliff, firstHold, secondHold, cliffTop]) {
    assert.equal("completed" in step, false, "climb progress does not claim a magic stage threshold");
  }
  assert.equal(chosenTrail.state.selected, "m");
  const crossedTrail = applySeedwakeVerbInput("track-sort", chosenTrail.state, { type: route.actions[1], correct: true, value: "marker" });
  assert.equal(crossedTrail.completed, true);
  assert.equal(crossedTrail.state.travelled, true);

  const sort = CHAPTER_VERB_RECIPES["ore-sort"];
  const ore = createSeedwakeVerbState("ore-sort", ["m"]);
  const rejectedOre = applySeedwakeVerbInput("ore-sort", ore, { type: sort.actions[0], correct: false, value: "n" });
  assert.equal(rejectedOre.accepted, false);
  const chosenOre = applySeedwakeVerbInput("ore-sort", ore, { type: sort.actions[0], correct: true, value: "m" });
  assert.equal(chosenOre.completed, false);
  assert.equal(chosenOre.state.selected, "m");
  const sortedOre = applySeedwakeVerbInput("ore-sort", chosenOre.state, { type: sort.actions[1], correct: true, value: "hopper" });
  assert.equal(sortedOre.completed, true);
  assert.equal(sortedOre.state.sorted, 1);

  const pursuit = CHAPTER_VERB_RECIPES["fish-rescue"];
  const fish = createSeedwakeVerbState("fish-rescue", ["m"]);
  const spottedFish = applySeedwakeVerbInput("fish-rescue", fish, { type: pursuit.actions[0], correct: true, value: "m" });
  assert.equal(spottedFish.completed, false);
  const caughtFish = applySeedwakeVerbInput("fish-rescue", spottedFish.state, { type: pursuit.actions[1], correct: true, value: "fish" });
  assert.equal(caughtFish.completed, true);
  assert.equal(caughtFish.state.caught, true);

  const tool = CHAPTER_VERB_RECIPES["bone-hunt"];
  const fossil = createSeedwakeVerbState("bone-hunt", ["m"]);
  const chosenFossil = applySeedwakeVerbInput("bone-hunt", fossil, { type: tool.actions[0], correct: true, value: "m" });
  assert.equal(chosenFossil.completed, false);
  assert.equal(chosenFossil.state.selected, "m");
  const brushedFossil = applySeedwakeVerbInput("bone-hunt", chosenFossil.state, { type: tool.actions[1], correct: true, value: "m" });
  assert.equal(brushedFossil.completed, true);
  assert.equal(brushedFossil.state.worked, true);

  const turn = CHAPTER_VERB_RECIPES["observatory-turn"];
  const observatory = createSeedwakeVerbState("observatory-turn", ["m"]);
  const chosenOrbit = applySeedwakeVerbInput("observatory-turn", observatory, { type: turn.actions[0], correct: true, value: "m", stage: 0 });
  const firstTurn = applySeedwakeVerbInput("observatory-turn", chosenOrbit.state, { type: turn.actions[1], correct: true, value: "node-1", stage: 1 });
  const secondTurn = applySeedwakeVerbInput("observatory-turn", firstTurn.state, { type: turn.actions[1], correct: true, value: "node-2", stage: 2 });
  const finalTurn = applySeedwakeVerbInput("observatory-turn", secondTurn.state, { type: turn.actions[1], correct: true, value: "node-3", stage: 3 });
  assert.equal(finalTurn.state.turns, 3);
  for (const step of [chosenOrbit, firstTurn, secondTurn, finalTurn]) {
    assert.equal("completed" in step, false, "turn progress does not claim a magic stage threshold");
  }
});

test("each Seedwake verb has its own camera and movement feel", () => {
  const mechanics = ["sound-hunt", "flower-jump", "delivery-run", "bridge-build", "gate-chorus"];
  const profiles = mechanics.map(questMechanicProfile);
  assert.equal(new Set(profiles.map(profile => profile.fov)).size, mechanics.length);
  assert.equal(new Set(profiles.map(profile => `${profile.distance}:${profile.elevation}:${profile.side}`)).size, mechanics.length);
  assert.equal(new Set(profiles.map(profile => `${profile.speed}:${profile.collision}`)).size, mechanics.length);
});

test("locomotion accelerates, banks into a turn, then decelerates to a settle", () => {
  let motion = createQuestLocomotionState(0);
  const speeds = [];
  for (let frame = 0; frame < 8; frame += 1) {
    motion = stepQuestLocomotion(motion, { desiredZ: 1, dt: 0.05 });
    speeds.push(motion.speed);
  }
  assert.ok(speeds.every((speed, index) => index === 0 || speed > speeds[index - 1]));
  const turning = stepQuestLocomotion(motion, { desiredX: 1, desiredZ: 0, dt: 0.05 });
  assert.ok(turning.heading > motion.heading);
  assert.ok(turning.bank > 0);

  motion = turning;
  const slowing = [];
  for (let frame = 0; frame < 12; frame += 1) {
    motion = stepQuestLocomotion(motion, { dt: 0.05 });
    slowing.push(motion.speed);
  }
  assert.ok(slowing.every((speed, index) => index === 0 || speed <= slowing[index - 1]));
  assert.equal(motion.settled, true);
});

test("analog movement preserves direction, dead-zone stability and proportional speed", () => {
  assert.deepEqual(questAnalogVector({ x: 0.1, y: -0.1 }), { x: 0, y: 0, magnitude: 0 });

  const left = questAnalogVector({ x: -1, y: 0 });
  const right = questAnalogVector({ x: 1, y: 0 });
  assert.equal(left.x, -1);
  assert.equal(right.x, 1);
  assert.equal(left.y, 0);
  assert.equal(right.y, 0);

  const partial = questAnalogVector({ x: 0.61, y: 0 });
  assert.ok(partial.magnitude > 0 && partial.magnitude < 1);
  assert.equal(partial.x, partial.magnitude);

  const diagonal = questAnalogVector({ x: 1, y: 1 });
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 1) < 0.000001);
  assert.ok(diagonal.x > 0 && diagonal.y > 0);
});

test("pixel corridor edges brake progressively without frame-rate-dependent camera drift", () => {
  const inside = stepQuestRouteBoundary({ x: 400, center: 320, velocityX: 70, dt: 1 / 60 });
  assert.deepEqual(inside, { x: 400, velocityX: 70, pressure: 0 });

  const edge = stepQuestRouteBoundary({ x: 425, center: 320, velocityX: 70, dt: 1 / 60 });
  assert.ok(edge.pressure > 0 && edge.pressure < 1);
  assert.ok(edge.velocityX < 70 && edge.velocityX > 0);

  const outside = stepQuestRouteBoundary({ x: 450, center: 320, velocityX: 70, dt: 1 / 60 });
  assert.equal(outside.x, 432);
  assert.equal(outside.velocityX, 0);

  const forward = stepQuestForwardBoundary({ y: 108, limit: 100, velocityY: -90, dt: 1 / 60 });
  assert.ok(forward.pressure > 0);
  assert.ok(forward.velocityY > -90);
  const stopped = stepQuestForwardBoundary({ y: 96, limit: 100, velocityY: -90, dt: 1 / 60 });
  assert.equal(stopped.y, 100);
  assert.equal(stopped.velocityY, 0);

  const oneFrame = questCameraResponse(16.7, 86);
  const twoHalfFrames = 1 - Math.pow(1 - questCameraResponse(8.35, 86), 2);
  assert.ok(Math.abs(oneFrame - twoHalfFrames) < 0.000001);

  assert.deepEqual(questPointerDestination({
    x: 520,
    y: 60,
    routeCenterX: 320,
    forwardLimit: 100,
    corridorRadius: 100
  }), { x: 420, y: 100 });

  assert.equal(questActiveChoiceForwardLimit({
    residentLimit: 426,
    choices: [
      { y: 304, radius: 19 },
      { y: 188, radius: 24 },
      { y: 304, radius: 19 }
    ]
  }), 210, "an authored answer beyond the resident boundary remains physically reachable");
  assert.equal(questActiveChoiceForwardLimit({ residentLimit: 426 }), 426);
});

test("restored-world residents stay reachable while their landmark remains on the verge", () => {
  for (let index = 0; index < 4; index += 1) {
    const placement = questRestoredMemoryPlacement(index);
    assert.ok(Math.abs(placement.landmarkLateral) > 112, "the repaired landmark lost its path-side staging");
    assert.ok(Math.abs(placement.cameoLateral) <= 112, "the returning resident is outside the movement boundary");
    assert.equal(Math.sign(placement.cameoLateral), placement.side);
  }
});

test("gate crossing uses the visible opening instead of an unreachable radial trigger", () => {
  assert.equal(questGateCrossingReached({
    playerX: 360,
    playerY: 202,
    gateX: 320,
    gateY: 190
  }), true, "a child following the curved trail should cross through the visible gate opening");
  assert.equal(questGateCrossingReached({
    playerX: 380,
    playerY: 202,
    gateX: 320,
    gateY: 190
  }), false, "walking beside the gate should not complete the stop");
  assert.equal(questGateCrossingReached({
    playerX: 320,
    playerY: 224,
    gateX: 320,
    gateY: 190
  }), false, "the ceremony should not start before the child reaches the threshold");
});

test("visible route branches are stable, selectable travel lanes", () => {
  assert.deepEqual(questOptionalRouteCenters({
    main: 320,
    topology: "branching-grove",
    progress: 0.3,
    stopIndex: 21
  }), [320]);
  const groveFork = questOptionalRouteCenters({
    main: 320,
    topology: "branching-grove",
    progress: 0.51,
    stopIndex: 21
  });
  assert.equal(groveFork[0], 320);
  assert.ok(groveFork[1] > 440, "the optional grove lane must read as a separate path");
  const islandFork = questOptionalRouteCenters({
    main: 320,
    topology: "island-loop",
    progress: 0.51,
    stopIndex: 22
  });
  assert.ok(islandFork[1] > 420, "the island loop must open enough room for exploration");

  assert.deepEqual(questRouteLaneSelection({ x: 320, centers: [320] }), {
    center: 320,
    index: 0,
    count: 1
  });

  const main = questRouteLaneSelection({ x: 326, centers: [320, 416] });
  assert.equal(main.center, 320);
  const branch = questRouteLaneSelection({ x: 400, centers: [320, 416] });
  assert.equal(branch.center, 416);

  const retained = questRouteLaneSelection({
    x: 366,
    centers: [320, 416],
    previousIndex: 1,
    switchMargin: 12
  });
  assert.equal(retained.index, 1, "a near-tie must not make the avatar vibrate between paths");

  const steered = questRouteLaneSelection({ x: 366, centers: [320, 416], intentX: -1 });
  assert.equal(steered.index, 0, "manual intent must choose the matching fork");
});

test("accessible answer focus wraps predictably without trapping other keys", () => {
  assert.equal(questChoiceFocusIndex({ currentIndex: 0, count: 3, key: "ArrowLeft" }), 2);
  assert.equal(questChoiceFocusIndex({ currentIndex: 2, count: 3, key: "ArrowRight" }), 0);
  assert.equal(questChoiceFocusIndex({ currentIndex: 1, count: 3, key: "Home" }), 0);
  assert.equal(questChoiceFocusIndex({ currentIndex: 1, count: 3, key: "End" }), 2);
  assert.equal(questChoiceFocusIndex({ currentIndex: 1, count: 3, key: "Tab" }), 1);
  assert.equal(questChoiceFocusIndex({ currentIndex: 0, count: 0, key: "ArrowRight" }), -1);
});

test("pixel scenery blocks movement with sliding contact and pointer avoidance", () => {
  const headOn = resolveQuestObstacleContacts({
    x: 12,
    y: 0,
    velocityX: -70,
    velocityY: 0,
    obstacles: [{ x: 0, y: 0, radius: 10 }]
  });
  assert.equal(headOn.x, 18);
  assert.equal(headOn.velocityX, 0);
  assert.equal(headOn.contacts, 1);

  const sliding = resolveQuestObstacleContacts({
    x: 12,
    y: 0,
    velocityX: -70,
    velocityY: -45,
    obstacles: [{ x: 0, y: 0, radius: 10 }]
  });
  assert.equal(sliding.velocityX, 0);
  assert.equal(sliding.velocityY, -45);

  const clearPointer = questPointerObstacleVector({
    playerX: 0,
    playerY: 0,
    targetX: 0,
    targetY: -100,
    obstacles: [{ x: 45, y: -40, radius: 12 }]
  });
  assert.deepEqual(clearPointer, { x: 0, y: -1, avoided: false });

  const avoidingPointer = questPointerObstacleVector({
    playerX: 0,
    playerY: 0,
    targetX: 0,
    targetY: -100,
    obstacles: [{ x: 0, y: -38, radius: 12 }]
  });
  assert.equal(avoidingPointer.avoided, true);
  assert.ok(avoidingPointer.x > 0);
  assert.ok(avoidingPointer.y < 0);
  assert.ok(Math.abs(Math.hypot(avoidingPointer.x, avoidingPointer.y) - 1) < 0.000001);
});

test("pixel travel camera anticipates motion without escaping its lead envelope", () => {
  assert.deepEqual(questCameraTravelTarget({ playerX: 120, playerY: 240 }), {
    x: 120,
    y: 240,
    leadX: 0,
    leadY: 0,
    strength: 0
  });

  const right = questCameraTravelTarget({
    playerX: 120,
    playerY: 240,
    velocityX: 104,
    velocityY: 0
  });
  assert.ok(right.x > 120);
  assert.equal(right.y, 240);

  const upLeft = questCameraTravelTarget({
    playerX: 120,
    playerY: 240,
    velocityX: -400,
    velocityY: -400,
    maxLead: 34
  });
  assert.ok(upLeft.x < 120 && upLeft.y < 240);
  assert.ok(Math.hypot(upLeft.leadX, upLeft.leadY) <= 34.000001);
  assert.equal(upLeft.strength, 1);
});

test("each Seedwake resident has authored success and recovery performances", () => {
  const successes = SEEDWAKE_STOP_IDS.map(stopId => seedwakeResidentPerformance(stopId, "correct"));
  const recoveries = SEEDWAKE_STOP_IDS.map(stopId => seedwakeResidentPerformance(stopId, "wrong"));
  assert.equal(new Set(successes).size, 5);
  assert.equal(new Set(recoveries).size, 5);
  assert.ok(successes.every((clip, index) => clip !== recoveries[index]));
});

test("chapter gate only opens when every encounter is complete", () => {
  const encounters = [{ id: "one" }, { id: "two" }, { id: "three" }];
  assert.equal(isChapterGateOpen(encounters, ["one", "two"]), false);
  assert.equal(isChapterGateOpen(encounters, new Set(["one", "two", "three"])), true);
  assert.equal(isChapterGateOpen([], []), false);
});

test("encounter camera framing is stable and safe-area checks reject clipped choices", () => {
  const items = [
    { x: -2.6, y: 0, z: -20 },
    { x: 0, y: 0, z: -22 },
    { x: 2.6, y: 0, z: -20 }
  ];
  const first = encounterCameraPose(items, { x: 0, z: -1 }, { width: 390, height: 844 });
  const second = encounterCameraPose(items, { x: 0, z: -1 }, { width: 390, height: 844 });
  assert.deepEqual(first, second);
  assert.equal(first.fov, 48);
  assert.ok(first.position.y > first.focus.y);

  const safe = sliceSafeArea(390, 844);
  assert.equal(projectedRectInsideSafeArea({ left: 30, top: 130, right: 360, bottom: 700 }, safe), true);
  assert.equal(projectedRectInsideSafeArea({ left: 8, top: 130, right: 360, bottom: 700 }, safe), false);
});

test("pixel choice staging clamps long answer art inside a phone camera", () => {
  const phone = questPixelChoiceOffsets("circle", 3, {
    viewportWidth: 390,
    zoom: 390 / 190,
    artHalfWidth: 40,
    safeMargin: 8
  });
  const visibleHalfWidth = 390 / ((390 / 190) * 2);
  assert.ok(phone.every(([x]) => Math.abs(x) + 40 + 8 <= visibleHalfWidth));
  assert.ok(phone.some(([x]) => x < 0));
  assert.ok(phone.some(([x]) => x > 0));

  const desktop = questPixelChoiceOffsets("circle", 3, { viewportWidth: 1280, zoom: 3.2 });
  assert.deepEqual(desktop, [[-96, 30], [0, -84], [96, 30]]);
  assert.ok(desktop.some(([, forward]) => forward < 0), "three choices no longer form a ring around the resident");
  assert.ok(Math.hypot(...desktop[0]) >= 86 && Math.hypot(...desktop[2]) >= 86, "side answers can still merge with a premium resident silhouette");
  assert.ok(desktop.every(([lateral, forward]) => Math.hypot(lateral, forward) >= 58), "an answer can still merge with the resident silhouette");
  assert.ok(desktop.every(([lateral, forward]) => Math.hypot(lateral, forward - 90) >= 64), "an answer can still sit in the player's approach lane");

  const authoredLayouts = ["scatter", "stepping", "delivery", "workshop", "circle"]
    .map(layout => questPixelChoiceOffsets(layout, 3, { viewportWidth: 1280, zoom: 3.2 }));
  assert.equal(
    new Set(authoredLayouts.map(offsets => JSON.stringify(offsets))).size,
    authoredLayouts.length,
    "Seedwake's five physical verbs still collapse into the same answer triangle"
  );
  assert.ok(authoredLayouts.every(offsets => offsets.every((point, index) => (
    offsets.every((other, otherIndex) => otherIndex === index || Math.hypot(point[0] - other[0], point[1] - other[1]) >= 100)
  ))), "three-choice props can still merge into one visual knot");

  assert.deepEqual(
    questPixelChoiceOffsets("tool-work", 1, { viewportWidth: 390, zoom: 1.8 }),
    [[0, 50]],
    "the work station must sit between the resident and the approaching player"
  );

  const sortLane = questPixelChoiceOffsets("sorting-lane", 3, { viewportWidth: 1280, zoom: 2.38 });
  assert.ok(sortLane.every(([, forward]) => forward === 82), "the sorting lane can fall back under the resident");

  const sideBay = questPixelSortLaneLayout({
    resident: { x: 320, y: 420 },
    player: { x: 320, y: 504 },
    forward: { x: 0, y: 1 },
    right: { x: 1, y: 0 },
    choiceLeft: 225,
    choiceRight: 415,
    count: 3
  });
  assert.equal(sideBay.side, -1, "an evenly framed sorting lane should use the stable left bay");
  assert.equal(sideBay.forwardDistance, 42);
  assert.deepEqual(sideBay.points, [
    { x: 228, y: 462 },
    { x: 264, y: 462 },
    { x: 300, y: 462 }
  ]);
  assert.ok(sideBay.points.every(point => Math.hypot(point.x - 320, point.y - 504) >= 46), "a sorting token can still merge with the player");
  assert.ok(sideBay.points.every(point => Math.hypot(point.x - 320, point.y - 420) >= 46), "a sorting token can still merge with the resident");

  const oppositePlayer = questPixelSortLaneLayout({
    resident: { x: 320, y: 420 },
    player: { x: 374, y: 492 },
    forward: { x: 0, y: 1 },
    right: { x: 1, y: 0 },
    choiceLeft: 190,
    choiceRight: 450,
    count: 3
  });
  assert.equal(oppositePlayer.side, -1, "the sorting lane still opens underneath a side-approaching player");

  const fittedPhoneBay = questPixelSortLaneLayout({
    resident: { x: 416.25, y: 785.6 },
    player: { x: 455.76, y: 856.16 },
    forward: { x: 0, y: 1 },
    right: { x: 1, y: 0 },
    choiceLeft: 336.7,
    choiceRight: 495.8,
    count: 3
  });
  assert.equal(fittedPhoneBay.side, -1, "camera fitting moved the Forge lane back underneath the child");
  for (const travel of [-10, 10]) {
    for (const point of fittedPhoneBay.points) {
      const movingPoint = { x: point.x + travel, y: point.y };
      assert.ok(
        Math.hypot(movingPoint.x - 455.76, movingPoint.y - 856.16) - 13.92 >= 22,
        "a moving Forge token can enter the child's safe bay"
      );
      assert.ok(
        Math.hypot(movingPoint.x - 416.25, movingPoint.y - 785.6) - 13.92 >= 22,
        "a moving Forge token can enter the resident's safe bay"
      );
    }
  }

  const edgeBay = questPixelSortLaneLayout({
    resident: { x: 242, y: 420 },
    player: { x: 242, y: 504 },
    forward: { x: 0, y: 1 },
    right: { x: 1, y: 0 },
    choiceLeft: 225,
    choiceRight: 415,
    count: 3
  });
  assert.equal(edgeBay.side, 1, "a sorting lane near the left edge should move into the open bay");
  assert.ok(edgeBay.points.every(point => point.x >= 225 && point.x <= 415));

  const narrowBay = questPixelSortLaneLayout({
    resident: { x: 356, y: 420 },
    player: { x: 356, y: 504 },
    forward: { x: 0, y: 1 },
    right: { x: 1, y: 0 },
    choiceLeft: 280,
    choiceRight: 382,
    count: 3
  });
  assert.ok(narrowBay.points.every(point => point.x >= 280 && point.x <= 382));
  assert.deepEqual(
    narrowBay.points.slice(1).map((point, index) => point.x - narrowBay.points[index].x),
    [36, 36],
    "fitting a sorting lane into a narrow camera must move the formation as one group"
  );
  assert.equal(narrowBay.center.x, narrowBay.points[1].x, "the conveyor must move with its answer tokens");

  const shifted = questPixelAvoidActorOverlap({
    point: { x: 0, y: 42 },
    actor: { x: 0, y: 90 },
    right: { x: 1, y: 0 },
    index: 1
  });
  assert.deepEqual(shifted, { x: 35, y: 42 });
  assert.ok(Math.hypot(shifted.x, shifted.y - 90) >= 58, "an answer can still merge with the Beastie silhouette");
  assert.deepEqual(
    questPixelAvoidActorOverlap({ point: { x: -62, y: 8 }, actor: { x: 0, y: 90 }, index: 0 }),
    { x: -62, y: 8 },
    "a clear answer is moved unnecessarily"
  );
  const leftChoice = questPixelAvoidActorOverlap({
    point: { x: -28, y: -50 },
    actor: { x: 0, y: 0 },
    right: { x: 1, y: 0 },
    index: 1,
    clearance: 66,
    nudge: 42
  });
  assert.ok(leftChoice.x < -28, "a left-hand answer was nudged into the resident instead of away");
  assert.ok(Math.hypot(leftChoice.x, leftChoice.y) >= 66, "a four-choice answer still crowds the resident");
});

test("pixel activity families have distinct movement, framing and performance direction", () => {
  const patterns = ["search", "jump", "single", "delivery", "assembly", "pursuit", "route", "sort", "tool", "turn", "steer", "signal", "climb", "rhythm"];
  const profiles = patterns.map(pattern => questPixelVerbProfile(pattern, `test-${pattern}`));
  assert.equal(new Set(profiles.map(profile => profile.response)).size, patterns.length);
  assert.equal(new Set(profiles.map(profile => profile.zoom)).size, 13);
  assert.equal(new Set(profiles.map(profile => `${profile.speed}:${profile.cameraLead}:${profile.cameraSide}`)).size, patterns.length);
  assert.ok(questPixelVerbProfile("jump", "flower-jump").speed > questPixelVerbProfile("assembly", "bridge-build").speed);
  assert.ok(questPixelVerbProfile("rhythm", "gate-chorus").zoom > questPixelVerbProfile("delivery", "delivery-run").zoom);
});

test("later mechanics retain authored motion signatures inside shared activity families", () => {
  const profiles = Object.entries(CHAPTER_VERB_RECIPES).map(([mechanic, recipe]) => (
    questPixelVerbProfile(recipe.pattern, mechanic)
  ));
  assert.equal(new Set(profiles.map(profile => profile.signature)).size, 35);
  assert.ok(
    new Set(profiles.map(profile => `${profile.speed}:${profile.cameraLead}:${profile.cameraSide}`)).size >= 20,
    "later verbs still collapse to a handful of identical movement profiles"
  );
});

test("pixel camera framing shows more authored world without shrinking phone tasks", () => {
  const desktopTask = questPixelCameraZoom({ width: 1280, height: 720, activeStage: true });
  const desktopTravel = questPixelCameraZoom({ width: 1280, height: 720, activeStage: false });
  const focusedTask = questPixelCameraZoom({ width: 1920, height: 1080, profileZoom: 1.2, activeStage: true });
  const phoneTask = questPixelCameraZoom({ width: 390, height: 844, activeStage: true });
  const smallPhoneTask = questPixelCameraZoom({ width: 320, height: 568, activeStage: true });

  assert.equal(desktopTask, 2.38);
  assert.ok(desktopTravel < desktopTask);
  assert.equal(focusedTask, 2.52);
  assert.equal(phoneTask, 1.56);
  assert.equal(smallPhoneTask, 1.44);
});

test("encounter edge details fill the wider composition without entering the task ring", () => {
  for (let encounterIndex = 0; encounterIndex < 3; encounterIndex += 1) {
    const details = questPixelEdgeDetailPositions({ x: 320, y: 560, encounterIndex });
    assert.equal(details.length, 4);
    assert.ok(details.every(point => point.x >= 28 && point.x <= 612));
    assert.ok(details.every(point => Math.hypot(point.x - 320, point.y - 560) >= 160));
    assert.deepEqual(new Set(details.map(point => point.band)), new Set(["inner", "outer"]));
  }
});

test("encounter taps approach physical choices while chorus taps conduct in place", () => {
  const choice = { id: "letter-m", value: "m" };
  assert.deepEqual(resolveQuestPointerIntent({ encounterActive: true, fieldChoice: choice, mechanic: "sound-hunt" }), {
    type: "approach",
    fieldChoice: choice
  });
  assert.deepEqual(resolveQuestPointerIntent({ encounterActive: true, fieldChoice: choice, mechanic: "gate-chorus" }), {
    type: "activate",
    fieldChoice: choice
  });
  assert.deepEqual(resolveQuestPointerIntent({ encounterActive: true }), { type: "consume" });
  assert.deepEqual(resolveQuestPointerIntent({ encounterActive: false }), { type: "move" });
});

test("phoneme slots fill in order and keep accessible success without motion or sound", () => {
  let slots = createPhonemeSlotState(["m", "a", "t"]);
  assert.equal(slots.graphemes.length, 3);
  slots = advancePhonemeSlotState(slots, "a", false);
  assert.deepEqual(slots.filled, []);
  slots = advancePhonemeSlotState(slots, "m", true);
  slots = advancePhonemeSlotState(slots, "a", true);
  slots = advancePhonemeSlotState(slots, "t", true);
  assert.deepEqual(slots.filled, ["m", "a", "t"]);
  assert.equal(slots.blending, true);
  assert.equal(slots.announcement, "Word complete: mat");
});

test("the encounter HUD contract contains exactly objective and reward", () => {
  const nodes = seedwakeEncounterHudModel({
    objective: "Find the letter that matches the sound",
    rewardLabel: "lantern seeds",
    rewardCount: 2,
    stageIndex: 1,
    stageCount: 3
  });
  assert.deepEqual(nodes.map(node => node.id), ["objective", "reward"]);
  assert.equal(nodes[1].progress, "2 of 3");
});
