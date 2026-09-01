import assert from "node:assert/strict";
import test from "node:test";

import {
  CUE_DELIVERY_STATUSES,
  createAudioDelivery,
  reduceAudioDelivery
} from "../../src/features/soundSeekers/engine/audioDelivery.js";

test("audio-dependent evidence accepts completed delivery only", () => {
  let state = createAudioDelivery("cue-1");
  for (const event of ["loading", "started", "interrupted", "failed"]) {
    state = reduceAudioDelivery(state, { id: "cue-1", session: 1, type: event });
    assert.notEqual(state.status, "completed");
  }
  assert.equal(reduceAudioDelivery(createAudioDelivery("cue-2"), { id: "cue-2", session: 1, type: "completed" }).status, "unavailable");
});

test("delivery records truthful lifecycle times and ignores a stale cue event", () => {
  const loading = reduceAudioDelivery(createAudioDelivery("cue-1"), { id: "cue-1", session: 2, type: "loading", at: 10 });
  const started = reduceAudioDelivery(loading, { id: "cue-1", session: 2, type: "started", at: 12 });
  const completed = reduceAudioDelivery(started, { id: "cue-1", session: 2, type: "completed", at: 18 });
  assert.deepEqual(completed, {
    id: "cue-1",
    status: "completed",
    session: 2,
    startedAt: 12,
    completedAt: 18
  });
  assert.equal(reduceAudioDelivery(completed, { id: "different-cue", session: 2, type: "failed" }).status, "completed");
  assert.equal(reduceAudioDelivery(completed, { id: "cue-1", session: 1, type: "failed" }).status, "completed");
});

test("the delivery status vocabulary is closed", () => {
  assert.deepEqual(CUE_DELIVERY_STATUSES, ["unavailable", "loading", "started", "completed", "interrupted", "failed"]);
  assert.equal(reduceAudioDelivery(createAudioDelivery("cue-1"), { id: "cue-1", session: 1, type: "made-up" }).status, "unavailable");
});

test("cue playback reports started, interruption, and completion for its active cue", async () => {
  const originalWindow = globalThis.window;
  const originalAudio = globalThis.Audio;
  const instances = [];
  class FakeAudio {
    constructor() { this.listeners = new Map(); this.history = new Map(); this.currentTime = 0; instances.push(this); }
    addEventListener(type, listener) {
      this.listeners.set(type, listener);
      const history = this.history.get(type) || [];
      history.push(listener);
      this.history.set(type, history);
    }
    removeEventListener(type, listener) { if (this.listeners.get(type) === listener) this.listeners.delete(type); }
    pause() {}
    load() {}
    play() { return Promise.resolve(); }
    emit(type) { this.listeners.get(type)?.(); }
  }
  globalThis.window = { speechSynthesis: { cancel() {} } };
  globalThis.Audio = FakeAudio;
  let cue;
  try {
    cue = await import(`../../src/utils/audio/cuePlayer.js?delivery=${Date.now()}`);
    const first = [];
    const second = [];
    cue.playCueAudio("/audio/first.mp3", { cueId: "first", onDelivery: event => first.push(event) });
    await Promise.resolve();
    cue.playCueAudio("/audio/second.mp3", { cueId: "second", onDelivery: event => second.push(event) });
    await Promise.resolve();
    // A queued terminal event from the first playback must not own the reused element.
    instances[0].history.get("ended")[0]();
    assert.deepEqual(second.map(event => event.type), ["loading", "started"]);
    instances[0].emit("ended");
    instances[0].emit("error");
    instances[0].emit("ended");
    assert.deepEqual(first.map(event => event.type), ["loading", "started", "interrupted"]);
    assert.deepEqual(second.map(event => event.type), ["loading", "started", "completed"]);
    assert.ok(first.every(event => event.id === "first" && Number.isInteger(event.session)));
    assert.ok(second.every(event => event.id === "second" && Number.isInteger(event.session)));
  } finally {
    cue?.stopCueAudio();
    globalThis.window = originalWindow;
    globalThis.Audio = originalAudio;
  }
});

test("cue playback reports a truthful failed lifecycle", async () => {
  const originalWindow = globalThis.window;
  const originalAudio = globalThis.Audio;
  const instances = [];
  class FakeAudio {
    constructor() { this.listeners = new Map(); instances.push(this); }
    addEventListener(type, listener) { this.listeners.set(type, listener); }
    removeEventListener(type, listener) { if (this.listeners.get(type) === listener) this.listeners.delete(type); }
    pause() {}
    load() {}
    play() { return Promise.resolve(); }
    emit(type) { this.listeners.get(type)?.(); }
  }
  globalThis.window = { speechSynthesis: { cancel() {} } };
  globalThis.Audio = FakeAudio;
  let cue;
  try {
    cue = await import(`../../src/utils/audio/cuePlayer.js?failed-delivery=${Date.now()}`);
    const lifecycle = [];
    cue.playCueAudio("/audio/unavailable.mp3", { cueId: "failed", onDelivery: event => lifecycle.push(event) });
    await Promise.resolve();
    instances[0].emit("error");
    assert.deepEqual(lifecycle.map(event => event.type), ["loading", "started", "failed"]);
    assert.ok(lifecycle.every(event => event.id === "failed" && Number.isInteger(event.session)));
  } finally {
    cue?.stopCueAudio();
    globalThis.window = originalWindow;
    globalThis.Audio = originalAudio;
  }
});

test("a sequence exposes per-item lifecycle ownership that the reducer can complete", async () => {
  const originalWindow = globalThis.window;
  const originalAudio = globalThis.Audio;
  const instances = [];
  class FakeAudio {
    constructor() { this.listeners = new Map(); instances.push(this); }
    addEventListener(type, listener) { const values = this.listeners.get(type) || []; values.push(listener); this.listeners.set(type, values); }
    removeEventListener(type, listener) { this.listeners.set(type, (this.listeners.get(type) || []).filter(value => value !== listener)); }
    pause() {}
    load() {}
    play() { return Promise.resolve(); }
    emit(type) { for (const listener of this.listeners.get(type) || []) listener(); }
  }
  globalThis.window = { speechSynthesis: { cancel() {} }, setTimeout(callback) { callback(); return 1; }, clearTimeout() {} };
  globalThis.Audio = FakeAudio;
  let cue;
  try {
    cue = await import(`../../src/utils/audio/cuePlayer.js?sequence-delivery=${Date.now()}`);
    const events = [];
    cue.playCueSequence(["/audio/one.mp3", "/audio/two.mp3"], { cueId: "lesson", gapMs: 0, onDelivery: event => events.push(event) });
    await Promise.resolve();
    instances[0].emit("ended");
    await Promise.resolve();
    let state = createAudioDelivery("lesson:1");
    for (const event of events.filter(event => event.id === "lesson:1")) state = reduceAudioDelivery(state, event);
    assert.equal(state.status, "completed");
    assert.ok(events.some(event => event.id === "lesson:2" && event.type === "loading"));
  } finally {
    cue?.stopCueAudio();
    globalThis.window = originalWindow;
    globalThis.Audio = originalAudio;
  }
});

test("suspension cannot complete or revive a replaced cue session", async () => {
  const originalWindow = globalThis.window;
  const originalAudio = globalThis.Audio;
  class FakeAudio {
    constructor() { this.listeners = new Map(); }
    addEventListener(type, listener) { this.listeners.set(type, listener); }
    removeEventListener(type, listener) { if (this.listeners.get(type) === listener) this.listeners.delete(type); }
    pause() {}
    load() {}
    play() { return Promise.resolve(); }
  }
  globalThis.window = { speechSynthesis: { cancel() {} } };
  globalThis.Audio = FakeAudio;
  let cue;
  try {
    cue = await import(`../../src/utils/audio/cuePlayer.js?suspension-delivery=${Date.now()}`);
    const first = [];
    const second = [];
    cue.playCueAudio("/audio/first.mp3", { cueId: "first", onDelivery: event => first.push(event) });
    await Promise.resolve();
    cue.setCueAudioSuspended(true);
    cue.playCueAudio("/audio/second.mp3", { cueId: "second", onDelivery: event => second.push(event) });
    cue.setCueAudioSuspended(false);
    await Promise.resolve();
    assert.equal(first.at(-1).type, "interrupted");
    assert.equal(first.some(event => event.type === "completed"), false);
    assert.equal(second.some(event => event.type === "completed"), false);
    assert.ok(second.every(event => event.id === "second"));
  } finally {
    cue?.stopCueAudio();
    globalThis.window = originalWindow;
    globalThis.Audio = originalAudio;
  }
});
