import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { playCvcSoundSequence, cvcStepEvidence } from "../../src/components/learn/phonics/cvc/cvcHelpers.js";

const wordModel = { word: "cat", letters: ["c", "a", "t"], audio: "/cat.mp3" };
const family = { rime: "at", vowel: "a" };

test("CVC sequence reports delivery explicitly and cancels between letter cues", async () => {
  let current = true;
  const calls = [];
  const result = await playCvcSoundSequence({ wordModel, family,
    playCue: async src => { calls.push(src); return "ended"; },
    isCurrent: () => current, wait: async () => { current = false; }
  });
  assert.deepEqual(result, { audioDelivery: "interrupted" });
  assert.equal(calls.length, 1);
});

test("failed CVC audio cannot report a heard model; a fresh attempt can recover", async () => {
  let calls = 0;
  const failed = await playCvcSoundSequence({ wordModel, family,
    playCue: async () => { calls += 1; return calls === 2 ? "blocked" : "ended"; }, wait: async () => {}
  });
  assert.equal(failed.audioDelivery, "unavailable");
  assert.equal(calls, 2);
  const recovered = await playCvcSoundSequence({ wordModel, family, playCue: async () => "ended", wait: async () => {} });
  assert.equal(recovered.audioDelivery, "delivered");
});

test("scaffolded and modeled steps never mint independent evidence", () => {
  const firstResponse = { word: "cat", slot: 0, selected: "b" };
  const evidence = cvcStepEvidence("build", [
    { firstResponse, attempts: 2, audioDelivery: "delivered", supportUsed: ["authored_ghost"] },
    { attempts: 3, audioDelivery: "unavailable", supportUsed: ["correction"] }
  ]);
  assert.deepEqual(evidence, { step: "build", completionKind: "supported", audioDelivery: "unavailable",
    firstResponse, attempts: 5, supportUsed: ["authored_ghost", "correction"], independent: false });
  assert.equal(cvcStepEvidence("magic", [{ audioDelivery: "delivered" }]).independent, false);
  assert.equal(cvcStepEvidence("hear", [{ audioDelivery: "delivered" }]).completionKind, "exposure");
});

function audioHarness() {
  const instances = [];
  const timers = new Map();
  let timerId = 0;
  const Howler = { _muted: false, volume: () => 1, stop: () => instances.forEach(howl => howl.stop()) };
  class Howl {
    constructor() { this.listeners = new Map(); this._muted = false; this.unloaded = false; instances.push(this); }
    on(event, fn) { const handlers = this.listeners.get(event) || new Set(); handlers.add(fn); this.listeners.set(event, handlers); }
    off(event, fn) { this.listeners.get(event)?.delete(fn); }
    emit(event, id = 1) { [...(this.listeners.get(event) || [])].forEach(fn => fn(id)); }
    play() { this.emit("play"); return 1; }
    stop() { this.emit("stop"); }
    unload() { this.unloaded = true; this.stop(); }
    volume() { return 1; }
  }
  const source = readFileSync(new URL("../../src/hooks/usePhonicsAudio.js", import.meta.url), "utf8")
    .replace(/^import .*;\n/gm, "").replace(/export /g, "");
  // Evaluate the shipped imperative player with only its media/timer dependencies replaced.
  const api = new Function("Howl", "Howler", "AUDIO_PHONEME_PATHS", "setTimeout", "clearTimeout",
    `${source}\nreturn {playPhonicsAudio, stopPhonicsAudio, preloadPhonicsAudio};`)(
    Howl, Howler, new Set(), fn => { timers.set(++timerId, fn); return timerId; }, id => timers.delete(id)
  );
  return { api, Howler, Howl, instances, timers };
}

const source = "/audio/production/en-US/word.mp3";
test("phonics load failure retires on retry and successful replay finishes", async () => {
  const { api, instances } = audioHarness();
  const first = api.playPhonicsAudio(source);
  instances[0].emit("loaderror");
  assert.equal(await first, "unavailable");
  const retry = api.playPhonicsAudio(source);
  assert.equal(instances[0].unloaded, true);
  assert.equal(instances.length, 2);
  instances[1].emit("end");
  assert.equal(await retry, "ended");
});

test("owned cancellation cannot stop its replacement or finish twice", async () => {
  const { api, instances } = audioHarness();
  const finishes = [];
  const first = api.playPhonicsAudio(source, { onFinish: status => finishes.push(status) });
  const second = api.playPhonicsAudio("/audio/production/en-US/next.mp3");
  assert.equal(await first, "superseded");
  first.cancel();
  instances[0].emit("end");
  instances[1].emit("end");
  assert.equal(await second, "ended");
  assert.deepEqual(finishes, ["superseded"]);
});

test("muted, blocked and never-started playback settle without a delivered model", async () => {
  const { api, Howler, Howl, instances, timers } = audioHarness();
  Howler._muted = true;
  assert.equal(await api.playPhonicsAudio(source), "unavailable");
  Howler._muted = false;
  const blocked = api.playPhonicsAudio(source);
  instances[0].emit("playerror");
  assert.equal(await blocked, "blocked");
  Howl.prototype.play = () => 1;
  const stalled = api.playPhonicsAudio(source);
  [...timers.values()].forEach(fn => fn());
  assert.equal(await stalled, "unavailable");
  const retry = api.playPhonicsAudio(source);
  instances[0].emit("end");
  assert.equal(await retry, "ended");
});


test("global stop during the silent CVC gap prevents queued phonemes restarting", async () => {
  const { api, instances } = audioHarness();
  const calls = [];
  const result = await playCvcSoundSequence({ wordModel, family,
    playCue: src => {
      calls.push(src);
      const promise = api.playPhonicsAudio("/audio/production/en-US/" + calls.length + ".mp3");
      instances.at(-1).emit("end");
      return promise;
    },
    wait: async () => api.stopPhonicsAudio()
  });
  assert.equal(result.audioDelivery, "interrupted");
  assert.equal(calls.length, 1);
});

test("late retired-source errors and another sound ID cannot fail a recovered cue", async () => {
  const { api, instances } = audioHarness();
  const first = api.playPhonicsAudio(source);
  const retiredCallbacks = [...instances[0].listeners.get("loaderror")];
  instances[0].emit("loaderror");
  await first;
  const finishes = [];
  const retry = api.playPhonicsAudio(source, { onFinish: status => finishes.push(status) });
  retiredCallbacks.forEach(callback => callback(1));
  instances[1].emit("stop", 999);
  instances[1].emit("playerror", 999);
  assert.deepEqual(finishes, []);
  instances[1].emit("end");
  assert.equal(await retry, "ended");
  const next = api.playPhonicsAudio(source);
  assert.equal(instances.length, 2, "late old errors did not poison the replacement cache entry");
  instances[1].emit("end");
  assert.equal(await next, "ended");
});
