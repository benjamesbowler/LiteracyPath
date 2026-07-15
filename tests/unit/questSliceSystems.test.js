import test from "node:test";
import assert from "node:assert/strict";
import { SEEDWAKE_STOP_IDS, seedwakeStopSpec } from "../../src/data/questChapterOne.js";
import {
  SEEDWAKE_VERB_HANDLERS,
  advancePhonemeSlotState,
  applySeedwakeVerbInput,
  createPhonemeSlotState,
  createQuestLocomotionState,
  createSeedwakeVerbState,
  encounterCameraPose,
  isChapterGateOpen,
  projectedRectInsideSafeArea,
  seedwakeEncounterHudModel,
  seedwakeResidentPerformance,
  sliceSafeArea,
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
  const outOfOrder = applySeedwakeVerbInput("bridge-build", bridge, { type: "build", correct: true, value: "a" });
  assert.deepEqual(outOfOrder.state.placed, []);
  const firstPlank = applySeedwakeVerbInput("bridge-build", bridge, { type: "build", correct: true, value: "m" });
  assert.deepEqual(firstPlank.state.placed, ["m"]);

  const chorus = createSeedwakeVerbState("gate-chorus", ["m", "a"]);
  const wrongBeat = applySeedwakeVerbInput("gate-chorus", chorus, { type: "conduct", correct: false, value: "a" });
  assert.equal(wrongBeat.cue, "chorus-recue");
  const rightBeat = applySeedwakeVerbInput("gate-chorus", chorus, { type: "conduct", correct: true, value: "m" });
  assert.deepEqual(rightBeat.state.notes, ["m"]);
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
