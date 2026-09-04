import assert from "node:assert/strict";
import test from "node:test";

import {
  createSoundSeekersState,
  normalizeSoundSeekersState
} from "../../src/features/soundSeekers/engine/stateV2.js";
import {
  createSoundSeekersProgressController,
  reconcileSoundSeekersHydration
} from "../../src/features/soundSeekers/runtime/soundSeekersProgressController.js";
import { questProgressStorageKey } from "../../src/utils/questStore.js";

class FakeStorageEvent {
  constructor(type, init = {}) {
    this.type = type;
    Object.assign(this, init);
  }
}

class FakeWindow {
  constructor(storage) {
    this.localStorage = storage;
    this.StorageEvent = FakeStorageEvent;
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatchEvent(event) {
    for (const listener of this.listeners.get(event.type) || []) listener(event);
  }

  listenerCount() {
    return [...this.listeners.values()].reduce((total, listeners) => total + listeners.size, 0);
  }
}

function advancedState(base, journeyStep, extra = {}) {
  return normalizeSoundSeekersState({
    ...base,
    ...extra,
    trail: { ...base.trail, journeyStep }
  });
}

function resumableState(base, {
  journeyStep,
  routeCursor,
  stopId,
  settings = {}
}) {
  return normalizeSoundSeekersState({
    ...base,
    trail: { ...base.trail, journeyStep, routeCursor },
    checkpoint: {
      contentVersion: base.contentVersion,
      stopId
    },
    settings: { ...base.settings, ...settings }
  });
}

function harness(initial = createSoundSeekersState()) {
  const storage = {};
  const eventTarget = new FakeWindow(storage);
  let stored = initial;
  const loads = [];
  const saves = [];
  const controller = createSoundSeekersProgressController({
    progressScopeKey: "student-1",
    eventTarget,
    storage,
    load(scopeKey) {
      loads.push(scopeKey);
      return stored;
    },
    save(scopeKey, state) {
      saves.push({ scopeKey, state });
      stored = state;
      return state;
    }
  });
  return {
    controller,
    eventTarget,
    getStored: () => stored,
    loads,
    saves,
    setStored(value) { stored = value; },
    storage
  };
}

test("controller loads once, commits only canonical v2 state, coalesces, and flushes on dispose", async () => {
  const testHarness = harness();
  const { controller, loads, saves } = testHarness;
  assert.deepEqual(loads, ["student-1"]);
  const seen = [];
  const unsubscribe = controller.subscribe(() => seen.push(controller.getSnapshot()));
  const first = advancedState(controller.getSnapshot(), 2);
  controller.commit(first);
  controller.commit(current => advancedState(current, 3));
  assert.equal(saves.length, 0);
  await Promise.resolve();
  assert.equal(saves.length, 1);
  assert.equal(saves[0].state.trail.journeyStep, 3);
  assert.equal(seen.length, 2);
  assert.throws(() => controller.commit({ type: "literacy-answer", correct: true }), /canonical v2 state/u);
  assert.throws(() => controller.commit(first, { flush: true, answer: "forged" }), /commit options/u);
  controller.commit(current => advancedState(current, 4));
  controller.dispose();
  assert.equal(saves.length, 2);
  assert.equal(saves[1].state.trail.journeyStep, 4);
  assert.equal(testHarness.eventTarget.listenerCount(), 0);
  unsubscribe();
});

test("controller attaches global listeners only while it has committed subscribers", () => {
  const testHarness = harness();
  const { controller, eventTarget } = testHarness;
  assert.equal(eventTarget.listenerCount(), 0,
    "construction during an abandoned render must be side-effect free");
  const unsubscribeFirst = controller.subscribe(() => {});
  assert.equal(eventTarget.listenerCount(), 2);
  const unsubscribeSecond = controller.subscribe(() => {});
  assert.equal(eventTarget.listenerCount(), 2);
  unsubscribeFirst();
  assert.equal(eventTarget.listenerCount(), 2);
  unsubscribeSecond();
  assert.equal(eventTarget.listenerCount(), 0,
    "Strict Mode effect cleanup must detach both listeners");
  controller.dispose();
  assert.equal(eventTarget.listenerCount(), 0);
});

test("child commits cannot replace or clear the teacher-owned assignment", async () => {
  const assigned = normalizeSoundSeekersState({
    ...createSoundSeekersState(),
    assignment: {
      targets: ["short_a"],
      note: "Hear and map it",
      assignedAt: "2026-09-03T00:00:00.000Z",
      by: "teacher"
    }
  });
  const testHarness = harness(assigned);
  const { controller } = testHarness;

  controller.commit(normalizeSoundSeekersState({
    ...controller.getSnapshot(),
    trail: { ...controller.getSnapshot().trail, journeyStep: 2 },
    assignment: { targets: ["attacker_target"], note: "replace" }
  }));
  assert.deepEqual(controller.getSnapshot().assignment, assigned.assignment);

  controller.commit(normalizeSoundSeekersState({
    ...controller.getSnapshot(),
    assignment: null
  }));
  assert.deepEqual(controller.getSnapshot().assignment, assigned.assignment);
  await Promise.resolve();
  assert.deepEqual(testHarness.getStored().assignment, assigned.assignment);
  controller.dispose();
});

test("hydration re-reads storage, ignores payload state, reconciles, and teacher reset replaces", () => {
  const testHarness = harness();
  const { controller, eventTarget } = testHarness;
  const unsubscribe = controller.subscribe(() => {});
  controller.commit(advancedState(controller.getSnapshot(), 4), { flush: true });
  testHarness.setStored(advancedState(createSoundSeekersState(), 7, {
    assignment: { targets: ["short_a"], note: "Hear and map it", by: "teacher" }
  }));
  eventTarget.dispatchEvent({
    type: "lp-progress-hydrated",
    detail: {
      studentId: "student-1",
      rows: [{ area: "phonics_quest", key: "__all__" }],
      resetApplied: false,
      stored: advancedState(createSoundSeekersState(), 99)
    }
  });
  assert.equal(controller.getSnapshot().trail.journeyStep, 7);
  assert.deepEqual(controller.getSnapshot().assignment.targets, ["short_a"]);

  const reset = normalizeSoundSeekersState({
    ...createSoundSeekersState(),
    reset: { epoch: 2, at: "2026-09-03T00:00:00.000Z" }
  });
  testHarness.setStored(reset);
  eventTarget.dispatchEvent({
    type: "lp-progress-hydrated",
    detail: { studentId: "student-1", rows: [], resetApplied: true }
  });
  assert.deepEqual(controller.getSnapshot(), reset);
  unsubscribe();
  controller.dispose();
});

test("pristine late hydration adopts stored route, checkpoint, and settings", () => {
  const testHarness = harness();
  const { controller, eventTarget } = testHarness;
  const unsubscribe = controller.subscribe(() => {});
  const stored = resumableState(createSoundSeekersState(), {
    journeyStep: 18,
    routeCursor: 18,
    stopId: "s18",
    settings: { highContrast: true, displayMode: "pixel" }
  });
  testHarness.setStored(stored);
  eventTarget.dispatchEvent({
    type: "lp-progress-hydrated",
    detail: { studentId: "student-1", rows: [], resetApplied: false }
  });
  assert.equal(controller.getSnapshot().trail.routeCursor, 18);
  assert.equal(controller.getSnapshot().checkpoint.stopId, "s18");
  assert.equal(controller.getSnapshot().settings.highContrast, true);
  assert.equal(controller.getSnapshot().settings.displayMode, "pixel");
  assert.equal(testHarness.saves.length, 0,
    "an unchanged authoritative stored state must not be written back");
  unsubscribe();
  controller.dispose();
});

test("dirty local play keeps its route, checkpoint, and settings while merging remote progress", () => {
  const testHarness = harness();
  const { controller, eventTarget } = testHarness;
  const unsubscribe = controller.subscribe(() => {});
  const local = resumableState(controller.getSnapshot(), {
    journeyStep: 4,
    routeCursor: 4,
    stopId: "s4",
    settings: { soundEnabled: false }
  });
  controller.commit(local);
  const stored = resumableState(createSoundSeekersState(), {
    journeyStep: 18,
    routeCursor: 18,
    stopId: "s18",
    settings: { highContrast: true }
  });
  testHarness.setStored(stored);
  eventTarget.dispatchEvent({
    type: "lp-progress-hydrated",
    detail: { studentId: "student-1", rows: [], resetApplied: false }
  });
  assert.equal(controller.getSnapshot().trail.journeyStep, 18,
    "monotonic progress still merges");
  assert.equal(controller.getSnapshot().trail.routeCursor, 4);
  assert.equal(controller.getSnapshot().checkpoint.stopId, "s4");
  assert.equal(controller.getSnapshot().settings.soundEnabled, false);
  assert.equal(controller.getSnapshot().settings.highContrast, false);
  unsubscribe();
  controller.dispose();
});

test("only an exact real storage event and active scope can reconcile", () => {
  const testHarness = harness();
  const { controller, eventTarget, storage } = testHarness;
  const unsubscribe = controller.subscribe(() => {});
  const initial = controller.getSnapshot();
  testHarness.setStored(advancedState(initial, 8));
  const key = questProgressStorageKey("student-1");
  for (const event of [
    { type: "storage", key, storageArea: storage, newValue: "{}" },
    new FakeStorageEvent("storage", { key: `${key}:other`, storageArea: storage, newValue: "{}" }),
    new FakeStorageEvent("storage", { key, storageArea: {}, newValue: "{}" }),
    new FakeStorageEvent("storage", { key, storageArea: storage, newValue: null })
  ]) {
    eventTarget.dispatchEvent(event);
    assert.strictEqual(controller.getSnapshot(), initial);
  }
  eventTarget.dispatchEvent(new FakeStorageEvent("storage", {
    key,
    storageArea: storage,
    newValue: JSON.stringify(testHarness.getStored())
  }));
  assert.equal(controller.getSnapshot().trail.journeyStep, 8);

  testHarness.setStored(advancedState(controller.getSnapshot(), 9));
  eventTarget.dispatchEvent({
    type: "lp-progress-hydrated",
    detail: { studentId: "student-2", rows: [], resetApplied: false }
  });
  assert.equal(controller.getSnapshot().trail.journeyStep, 8);
  unsubscribe();
  controller.dispose();
  eventTarget.dispatchEvent(new FakeStorageEvent("storage", {
    key, storageArea: storage, newValue: "{}"
  }));
  assert.equal(controller.getSnapshot().trail.journeyStep, 8);
});

test("pure hydration reconciliation uses the v2 merge and reset contract", () => {
  const current = advancedState(createSoundSeekersState(), 3);
  const stored = advancedState(createSoundSeekersState(), 6);
  assert.equal(reconcileSoundSeekersHydration(current, stored, {
    resetApplied: false
  }).trail.journeyStep, 6);
  assert.deepEqual(reconcileSoundSeekersHydration(current, stored, {
    resetApplied: true
  }), stored);
  assert.throws(() => reconcileSoundSeekersHydration({}, stored, {
    resetApplied: false
  }), /canonical v2 state/u);
});
