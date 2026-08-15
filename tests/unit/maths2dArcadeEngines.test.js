import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  MATHS_2D_ENGINE_VERSION,
  advanceArcadePosition,
  countCarryEvidence,
  createCountCarryWorld,
  createGlimpseGardenWorld,
  deliveredInGroup,
  glimpseGardenEvidence,
  nextWaitingParcel
} from "../../src/maths/games/maths2dArcadeEngine.js";

const glimpseRound = Object.freeze({
  id: "glimpse-4-contract",
  model: { capacity: 5, parts: [2, 2], pattern: "dice", total: 4 },
  options: [3, 5, 4]
});

const carryRound = Object.freeze({
  id: "carry-14-contract",
  model: { rows: [10, 4], total: 14 },
  options: [13, 14, 15]
});

test("Glimpse Garden world generation is deterministic and preserves the authored structured quantity", () => {
  const first = createGlimpseGardenWorld(glimpseRound);
  const second = createGlimpseGardenWorld(glimpseRound);
  assert.deepEqual(first, second);
  assert.equal(first.layout.total, 4);
  assert.deepEqual(first.layout.parts, [2, 2]);
  assert.equal(first.layout.slots.filter(slot => slot.occupied).length, 4);
  assert.ok(Math.abs(first.playerX - first.gateX) > first.interactionRadius, "exploration begins away from the gate");
});

test("Glimpse evidence records the rendered pattern, access path and reveal history without speed scoring", () => {
  const world = createGlimpseGardenWorld(glimpseRound);
  const evidence = glimpseGardenEvidence(world, { accessMode: "untimed_counting", optionSlot: 2, revealCount: 3 });
  assert.equal(evidence.engineVersion, MATHS_2D_ENGINE_VERSION);
  assert.equal(evidence.accessMode, "untimed_counting");
  assert.equal(evidence.renderedPattern, "dice");
  assert.equal(evidence.layoutSignature, world.layout.signature);
  assert.equal(evidence.renderedSlots.filter(slot => slot.occupied).length, 4);
  assert.deepEqual(evidence.parts, [2, 2]);
  assert.equal(evidence.revealCount, 3);
  assert.equal("responseTime" in evidence, false);
  assert.equal("score" in evidence, false);
});

test("Count and Carry creates a traversable continuous route with non-overlapping parcel landmarks", () => {
  const world = createCountCarryWorld(carryRound, "ten_and_more");
  const positions = world.parcels.map(parcel => parcel.x);
  assert.equal(world.parcels.length, 14);
  assert.deepEqual(world.layout.layoutRows, [10, 4]);
  assert.equal(world.layout.layoutMode, "ten_then_extras");
  assert.ok(positions.every((position, index) => index === 0 || position - positions[index - 1] >= 12));
  assert.ok(world.worldMaximum > positions.at(-1));
  assert.ok(world.playerX < positions[0]);
  assert.equal(deliveredInGroup(9, world.groups[1], 1, world.groups), 0, "extras fill before ten is complete");
  assert.equal(deliveredInGroup(10, world.groups[1], 1, world.groups), 0);
  assert.equal(deliveredInGroup(11, world.groups[1], 1, world.groups), 1);
});

test("Count and Carry routing always selects an uncounted parcel and never invents a duplicate", () => {
  const world = createCountCarryWorld(carryRound, "ten_and_more");
  const first = nextWaitingParcel(world, [], null, world.playerX);
  const second = nextWaitingParcel(world, [first.index], null, first.x);
  assert.notEqual(second.index, first.index);
  const none = nextWaitingParcel(world, world.parcels.map(parcel => parcel.index), null, first.x);
  assert.equal(none, null);
});

test("Count and Carry evidence is state-derived and only validates a complete one-to-one delivery", () => {
  const world = createCountCarryWorld(carryRound, "ten_and_more");
  const incomplete = countCarryEvidence(world, { deliveredIndexes: [0, 0, 1], selectedPlan: "ten_and_more" });
  assert.equal(incomplete.oneToOneValid, false);
  assert.deepEqual(incomplete.movedItemIndexes, [0, 1]);
  const invented = countCarryEvidence(world, { deliveredIndexes: [...world.parcels.slice(0, -1).map(parcel => parcel.index), 99], selectedPlan: "ten_and_more" });
  assert.equal(invented.oneToOneValid, false);

  const complete = countCarryEvidence(world, {
    deliveredIndexes: world.parcels.map(parcel => parcel.index).reverse(),
    optionSlot: 1,
    options: carryRound.options,
    selectedPlan: "ten_and_more"
  });
  assert.equal(complete.oneToOneValid, true);
  assert.deepEqual(complete.layoutRows, [10, 4]);
  assert.equal(complete.layoutMode, "ten_then_extras");
  assert.deepEqual(complete.movedItemIndexes, world.parcels.map(parcel => parcel.index));
  assert.equal(complete.optionSlot, 1);
});

test("continuous movement clamps long frames and world boundaries", () => {
  assert.equal(advanceArcadePosition(5, -1, 1000, { minimum: 5, maximum: 95, speed: 40 }), 5);
  assert.equal(advanceArcadePosition(94, 1, 1000, { minimum: 5, maximum: 95, speed: 40 }), 95);
  assert.equal(advanceArcadePosition(50, 1, 25, { minimum: 5, maximum: 95, speed: 40 }), 51);
});

test("both engines expose touch, keyboard, pause, access and evidence contracts", () => {
  const glimpseSource = readFileSync(new URL("../../src/maths/games/GlimpseGardenArcade2D.jsx", import.meta.url), "utf8");
  const carrySource = readFileSync(new URL("../../src/maths/games/CountCarryArcade2D.jsx", import.meta.url), "utf8");
  const motionSource = readFileSync(new URL("../../src/maths/games/useArcadeXAxis.js", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../../src/styles/maths-arcade-2d-engines.css", import.meta.url), "utf8");

  for (const source of [glimpseSource, carrySource]) {
    assert.match(source, /disabled = false, onAnswer, paused = false, round/);
    assert.match(source, /aria-live="polite"/);
    assert.match(source, /data-answer-slot/);
    assert.doesNotMatch(source, /countdown|leaderboard|lives|time bonus/i);
  }
  assert.match(glimpseSource, /Keep it open so I can count/);
  assert.match(glimpseSource, /glimpseGardenEvidence/);
  assert.match(carrySource, /countCarryEvidence/);
  assert.match(carrySource, /one parcel loaded/i);
  assert.match(motionSource, /ArrowLeft/);
  assert.match(motionSource, /ArrowRight/);
  assert.match(motionSource, /onPointerCancel/);
  assert.match(motionSource, /onLostPointerCapture/);
  assert.match(styles, /min-height:\s*56px/);
  assert.match(styles, /min-width:\s*56px/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
  assert.match(styles, /env\(safe-area-inset-bottom\)/);
});
