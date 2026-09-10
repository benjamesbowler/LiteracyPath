import test from "node:test";
import assert from "node:assert/strict";
import { createWordClimbSession } from "../../src/utils/wordClimbLevels.js";
import { createClimbWorld, reachableClimbPlatforms, jumpToClimbPlatform, advanceClimbWorld, CLIMB_ROW_HEIGHT } from "../../src/components/learn/games/games/wordClimbWorld.js";

function settle(world, steer = 0) {
  const events = [];
  for (let frame = 0; frame < 480; frame++) {
    advanceClimbWorld(world, 1 / 60, steer);
    if (world.event) events.push(world.event.type);
    if (["grounded", "landed"].includes(world.state) || world.completed) return events;
  }
  assert.fail(`Climb did not settle: ${world.state} at ${world.x}, ${world.y}`);
}

for (const difficulty of ["easy", "medium", "hard"]) {
  test(`${difficulty}: the entire ascent lands on persistent solid shelves with rising camera`, () => {
    const world = createClimbWorld(createWordClimbSession(difficulty, () => .4));
    const geometry = JSON.stringify(world.platforms);
    for (let row = 1; row <= world.summit; row++) {
      const target = reachableClimbPlatforms(world).find(p => p.correct);
      assert.ok(jumpToClimbPlatform(world, target.id));
      assert.equal(world.step, row - 1, "launching is not learning evidence");
      const events = settle(world);
      assert.ok(events.includes(row === world.summit ? "summit" : "correct"));
      assert.equal(world.y, row * CLIMB_ROW_HEIGHT);
      assert.equal(world.standingId, target.id);
      assert.equal(world.step, row);
      const height = world.y;
      for (let i = 0; i < 90; i++) advanceClimbWorld(world, 1 / 60);
      assert.equal(world.y, height, "height persists after the landing animation");
      assert.ok(world.camera > (row - 1) * CLIMB_ROW_HEIGHT - 115);
      assert.equal(JSON.stringify(world.platforms), geometry, "answering never moves shelves");
    }
    assert.equal(world.completed, true);
  });
}

test("wrong holds physically land, identify the error and return to the last safe shelf", () => {
  const world = createClimbWorld(createWordClimbSession("hard", () => .4), 5);
  const safeId = world.safeId;
  const bad = reachableClimbPlatforms(world).find(p => !p.correct);
  jumpToClimbPlatform(world, bad.id);
  const events = settle(world);
  assert.ok(events.includes("wrong"));
  assert.ok(events.includes("recovered"));
  assert.equal(world.wrong, 1);
  assert.equal(world.step, 5);
  assert.equal(world.y, 5 * CLIMB_ROW_HEIGHT);
  assert.equal(world.standingId, safeId);
  assert.equal(world.motorFalls, 0);
  jumpToClimbPlatform(world, reachableClimbPlatforms(world).find(p => p.correct).id);
  settle(world);
  assert.equal(world.step, 6);
});

test("an air-steering miss uses the safety vine without inventing a literacy error", () => {
  const world = createClimbWorld(createWordClimbSession("medium", () => .4), 3);
  jumpToClimbPlatform(world, reachableClimbPlatforms(world).at(-1).id);
  const events = settle(world, 1);
  assert.ok(events.includes("fall"));
  assert.equal(world.motorFalls, 1);
  assert.equal(world.wrong, 0);
  assert.equal(world.step, 3);
  assert.equal(world.y, 3 * CLIMB_ROW_HEIGHT);
});

test("pause freezes physics and recovery; resume continues from exact position", () => {
  const world = createClimbWorld(createWordClimbSession("easy", () => .4));
  const target = reachableClimbPlatforms(world).find(p => p.correct);
  jumpToClimbPlatform(world, target.id);
  advanceClimbWorld(world, .1);
  world.paused = true;
  const state = JSON.stringify(world);
  for (let i = 0; i < 90; i++) advanceClimbWorld(world, 1 / 60, 1);
  assert.equal(JSON.stringify(world), state);
  assert.equal(jumpToClimbPlatform(world, target.id), false);
  world.paused = false;
  settle(world);
  assert.equal(world.step, 1);
});

test("checkpoint restart places the hero on the corresponding solid shelf", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const session = createWordClimbSession(difficulty, () => .4);
    for (let step = 0; step < session.summit; step++) {
      const world = createClimbWorld(session, step);
      assert.equal(world.y, step * CLIMB_ROW_HEIGHT);
      assert.ok(world.platforms.some(p => p.id === world.standingId && p.y === world.y && Math.abs(world.x - p.x) < p.width / 2));
      jumpToClimbPlatform(world, reachableClimbPlatforms(world).find(p => p.correct).id);
      settle(world);
      assert.equal(world.step, step + 1);
    }
  }
});

test("the same shelves remain reachable at low and high simulation frame rates", () => {
  for (const hz of [15, 30, 60, 120]) {
    const world = createClimbWorld(createWordClimbSession("hard", () => .4), 0, () => .72);
    for (let row = 1; row <= world.summit; row++) {
      jumpToClimbPlatform(world, reachableClimbPlatforms(world).find(p => p.correct).id);
      for (let frame = 0; frame < hz * 3 && world.step < row; frame++) advanceClimbWorld(world, 1 / hz);
      assert.equal(world.step, row, `${hz} Hz can reach shelf ${row}`);
      assert.equal(world.y, row * CLIMB_ROW_HEIGHT);
    }
  }
});

test("pausing the safety vine retains its exact recovery and counts a wrong hold once", () => {
  const world = createClimbWorld(createWordClimbSession("easy", () => .4));
  jumpToClimbPlatform(world, reachableClimbPlatforms(world).find(p => !p.correct).id);
  for (let i = 0; i < 120 && world.state !== "clinging"; i++) advanceClimbWorld(world, 1 / 60);
  assert.equal(world.state, "clinging");
  world.paused = true;
  const position = [world.x, world.y, world.landingTime, world.wrong];
  for (let i = 0; i < 120; i++) advanceClimbWorld(world, 1 / 60);
  assert.deepEqual([world.x, world.y, world.landingTime, world.wrong], position);
  world.paused = false;
  settle(world);
  assert.equal(world.wrong, 1);
  assert.equal(world.y, 0);
});
