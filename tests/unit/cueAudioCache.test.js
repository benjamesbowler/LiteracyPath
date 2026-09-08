import test from "node:test";
import assert from "node:assert/strict";

async function withAudio(run, canonical = false) {
  const originalAudio = globalThis.Audio;
  const originalWindow = globalThis.window;
  const instances = [];
  const failures = new Set();
  const pending = new Set();
  class AudioDouble {
    constructor() {
      this.src = "";
      this.listeners = new Map();
      this.paused = true;
      this.playCount = 0;
      instances.push(this);
    }
    addEventListener(type, callback) {
      const listeners = this.listeners.get(type) || new Set();
      listeners.add(callback);
      this.listeners.set(type, listeners);
    }
    removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
    emit(type) { [...(this.listeners.get(type) || [])].forEach(callback => callback()); }
    load() {
      if (this.src && !pending.has(this.src)) this.emit(failures.has(this.src) ? "error" : "canplay");
    }
    play() { this.playCount += 1; this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
    removeAttribute(name) { if (name === "src") this.src = ""; }
  }
  globalThis.Audio = AudioDouble;
  globalThis.window = { setTimeout, clearTimeout, speechSynthesis: { cancel() {} } };
  const cue = await import(`../../src/utils/audio/cuePlayer.js${canonical ? "" : `?cache=${Date.now()}-${Math.random()}`}`);
  try { await run({ cue, instances, failures, pending }); }
  finally {
    cue.stopCueAudio();
    globalThis.Audio = originalAudio;
    globalThis.window = originalWindow;
  }
}

test("hundreds of unowned cues stay bounded and an evicted source warms a fresh element", () => withAudio(async ({ cue, instances }) => {
  for (let index = 0; index < 300; index += 1) assert.equal(await cue.preloadCueAudio(`/stress/${index}.mp3`), true);
  assert.equal(instances.filter(audio => audio.src).length, cue.MAX_IDLE_WARMED_CUES);
  assert.equal(instances[0].src, "");
  assert.equal([...instances[0].listeners.values()].reduce((sum, listeners) => sum + listeners.size, 0), 0);
  await cue.preloadCueAudio("/stress/0.mp3");
  cue.playCueAudio("/stress/0.mp3");
  assert.equal(instances.at(-1).playCount, 1);
  assert.equal(instances.filter(audio => audio.src).length, cue.MAX_IDLE_WARMED_CUES);
}));

test("overlapping current/next windows release only after their final owner, and preserve active speech", () => withAudio(async ({ cue, instances }) => {
  const first = cue.retainCueAudioSources(["/current.mp3", "/next.mp3"]);
  const second = cue.retainCueAudioSources(["/next.mp3"]);
  await cue.preloadCueAudio("/current.mp3");
  await cue.preloadCueAudio("/next.mp3");
  cue.playCueAudio("/current.mp3");
  first(); first();
  assert.equal(instances[0].paused, false);
  assert.equal(instances[1].src, "/next.mp3");
  second();
  assert.equal(instances[1].src, "");
  instances[0].emit("ended");
  assert.equal(instances[0].src, "");
}));

test("queued cues survive pressure and window disposal, then cancellation releases them without replay", () => withAudio(async ({ cue, instances }) => {
  const release = cue.retainCueAudioSources(["/first.mp3", "/second.mp3"]);
  await cue.preloadCueAudio("/first.mp3");
  await cue.preloadCueAudio("/second.mp3");
  cue.playCueSequence(["/first.mp3", "/second.mp3"], { gapMs: 5 });
  release();
  for (let index = 0; index < 100; index += 1) await cue.preloadCueAudio(`/pressure/${index}.mp3`);
  assert.equal(instances[0].paused, false);
  assert.equal(instances[1].src, "/second.mp3");
  instances[0].emit("ended");
  cue.stopCueAudio();
  await new Promise(resolve => setTimeout(resolve, 15));
  assert.equal(instances[1].playCount, 0);
  assert.equal(instances[0].src, "");
  assert.equal(instances[1].src, "");
}));

test("disposing a pending preload settles it and permits a fresh later request", () => withAudio(async ({ cue, instances, pending }) => {
  pending.add("/pending.mp3");
  const release = cue.retainCueAudioSources(["/pending.mp3"]);
  const promise = cue.preloadCueAudio("/pending.mp3");
  release();
  assert.equal(await promise, false);
  assert.equal(instances[0].src, "");
  pending.clear();
  assert.equal(await cue.preloadCueAudio("/pending.mp3"), true);
  assert.equal(instances.length, 2);
}));

test("question preloads retry synchronous failures and do not remember evicted success", () => withAudio(async ({ cue, instances, failures }) => {
  const { preloadAudio } = await import("../../src/utils/preloadQuestionMedia.js");
  failures.add("/retry.mp3");
  assert.equal(await preloadAudio("/retry.mp3"), false);
  assert.equal(instances[0].src, "");
  failures.clear();
  assert.equal(await preloadAudio("/retry.mp3"), true);
  const recovered = instances.at(-1);
  cue.playCueAudio("/retry.mp3");
  assert.equal(recovered.playCount, 1);
  cue.stopCueAudio();
  for (let index = 0; index < 100; index += 1) await preloadAudio(`/outer/${index}.mp3`);
  assert.equal(recovered.src, "");
  await preloadAudio("/retry.mp3");
  cue.playCueAudio("/retry.mp3");
  assert.equal(instances.at(-1).playCount, 1);
  assert.notEqual(instances.at(-1), recovered);
}, true));


test("a delayed preload failure retires its listeners and can recover", () => withAudio(async ({ cue, instances, pending }) => {
  pending.add("/delayed.mp3");
  const promise = cue.preloadCueAudio("/delayed.mp3");
  const failed = instances[0];
  failed.emit("error");
  assert.equal(await promise, false);
  assert.equal(failed.src, "");
  assert.equal([...failed.listeners.values()].reduce((sum, listeners) => sum + listeners.size, 0), 0);
  pending.clear();
  assert.equal(await cue.preloadCueAudio("/delayed.mp3"), true);
  cue.playCueAudio("/delayed.mp3");
  assert.equal(instances[1].playCount, 1);
}));
