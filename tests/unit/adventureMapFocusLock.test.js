import assert from "node:assert/strict";
import test from "node:test";

import * as childTrailPolicy from "../../src/policy/childTrailPolicy.js";

const { buildAdventureMapScene } = childTrailPolicy;

const cycles = [
  { id: "cycle-1", cycleNumber: 1, title: "Cycle 1" },
  { id: "cycle-2", cycleNumber: 2, title: "Cycle 2" },
  { id: "cycle-3", cycleNumber: 3, title: "Cycle 3" }
];

const points = [[10, 60], [40, 45], [75, 65]];

test("an unavailable teacher-assigned cycle leaves no actionable map space", () => {
  const scene = buildAdventureMapScene({
    cycles,
    landmarks: ["Farm Gate", "Duck Pond", "Big Barn"],
    points,
    activeCycleId: "cycle-99"
  });

  assert.equal(scene.next, null);
  assert.equal(scene.activeCycleAvailable, false);
  assert.deepEqual(scene.stops.filter(stop => stop.state === "next"), []);
  assert.deepEqual(scene.cards.filter(card => card.state === "next"), []);
});

test("a teacher cycle lock resolves only an exact playable cycle id", () => {
  assert.deepEqual(
    childTrailPolicy.resolveAdventureMapCycleLock?.({
      cycles,
      lockedCycleId: "cycle-2"
    }),
    {
      locked: true,
      cycleId: "cycle-2",
      cycle: cycles[1],
      contentAvailable: true
    }
  );

  assert.deepEqual(
    childTrailPolicy.resolveAdventureMapCycleLock?.({
      cycles,
      lockedCycleId: "cycle-20"
    }),
    {
      locked: true,
      cycleId: "cycle-20",
      cycle: null,
      contentAvailable: false
    }
  );

  assert.deepEqual(
    childTrailPolicy.resolveAdventureMapCycleLock?.({ cycles, lockedCycleId: "" }),
    {
      locked: true,
      cycleId: "",
      cycle: null,
      contentAvailable: false
    }
  );
});

test("ordinary Adventure Map mode does not create a cycle lock", () => {
  assert.deepEqual(
    childTrailPolicy.resolveAdventureMapCycleLock?.({ cycles }),
    {
      locked: false,
      cycleId: "",
      cycle: null,
      contentAvailable: true
    }
  );
});

test("only an active student Adventure Map focus consumes the member cycle assignment", () => {
  const adventureSession = {
    target: "adventure_map",
    resolved_config: { cycle_id: " cycle-8 " }
  };

  assert.deepEqual(
    childTrailPolicy.adventureMapFocusLockFor?.({
      isStudentMode: true,
      session: adventureSession
    }),
    { focusLocked: true, lockedCycleId: "cycle-8" }
  );
  assert.deepEqual(
    childTrailPolicy.adventureMapFocusLockFor?.({
      isStudentMode: true,
      session: { ...adventureSession, resolved_config: {} }
    }),
    { focusLocked: true, lockedCycleId: "" }
  );
  assert.deepEqual(
    childTrailPolicy.adventureMapFocusLockFor?.({
      isStudentMode: true,
      session: { target: "assigned_book", resolved_config: { cycle_id: "cycle-8" } }
    }),
    { focusLocked: false, lockedCycleId: null }
  );
  assert.deepEqual(
    childTrailPolicy.adventureMapFocusLockFor?.({
      isStudentMode: false,
      session: adventureSession
    }),
    { focusLocked: false, lockedCycleId: null }
  );
});
