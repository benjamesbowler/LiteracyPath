import test from "node:test";
import assert from "node:assert/strict";

test("an active phonics cue pauses and resumes from the same place", async () => {
  const originalWindow = globalThis.window;
  const originalAudio = globalThis.Audio;
  const instances = [];
  let cue = null;

  class FakeAudio {
    constructor(source = "") {
      this.src = source;
      this.currentTime = 0;
      this.paused = true;
      this.playCount = 0;
      this.listeners = new Map();
      instances.push(this);
    }

    addEventListener(type, handler) {
      this.listeners.set(type, handler);
    }

    removeEventListener(type, handler) {
      if (this.listeners.get(type) === handler) this.listeners.delete(type);
    }

    play() {
      this.paused = false;
      this.playCount += 1;
      return Promise.resolve();
    }

    pause() {
      this.paused = true;
    }
  }

  globalThis.window = {
    speechSynthesis: { cancel() {} }
  };
  globalThis.Audio = FakeAudio;

  try {
    cue = await import(`../../src/utils/audio/cuePlayer.js?lifecycle=${Date.now()}`);
    cue.playCueAudio("/audio/phonics/b.mp3");
    await Promise.resolve();
    const audio = instances[0];
    audio.currentTime = 4.75;
    assert.equal(audio.paused, false);

    assert.equal(cue.setCueAudioSuspended(true), true);
    assert.equal(audio.paused, true);
    assert.equal(audio.currentTime, 4.75);

    assert.equal(cue.setCueAudioSuspended(false), false);
    await Promise.resolve();
    assert.equal(audio.paused, false);
    assert.equal(audio.currentTime, 4.75);
    assert.equal(audio.playCount, 2);
  } finally {
    cue?.stopCueAudio();
    globalThis.window = originalWindow;
    globalThis.Audio = originalAudio;
  }
});

test("preloaded cues reuse the warmed media element for immediate playback", async () => {
  const originalWindow = globalThis.window;
  const originalAudio = globalThis.Audio;
  const instances = [];
  let cue = null;

  class FakeAudio {
    constructor() {
      this.src = "";
      this.currentTime = 0;
      this.paused = true;
      this.playCount = 0;
      this.listeners = new Map();
      instances.push(this);
    }

    addEventListener(type, handler) {
      const handlers = this.listeners.get(type) || [];
      handlers.push(handler);
      this.listeners.set(type, handlers);
    }

    removeEventListener(type, handler) {
      const handlers = this.listeners.get(type) || [];
      this.listeners.set(type, handlers.filter(candidate => candidate !== handler));
    }

    emit(type) {
      for (const handler of this.listeners.get(type) || []) handler();
    }

    load() { this.emit("canplay"); }
    play() { this.paused = false; this.playCount += 1; return Promise.resolve(); }
    pause() { this.paused = true; }
  }

  globalThis.window = { speechSynthesis: { cancel() {} } };
  globalThis.Audio = FakeAudio;

  try {
    cue = await import(`../../src/utils/audio/cuePlayer.js?warmed=${Date.now()}`);
    assert.equal(await cue.preloadCueAudio("/audio/warmed.mp3"), true);
    assert.equal(instances.length, 1);

    cue.playCueAudio("/audio/warmed.mp3");
    await Promise.resolve();

    assert.equal(instances.length, 1);
    assert.equal(instances[0].src, "/audio/warmed.mp3");
    assert.equal(instances[0].playCount, 1);
  } finally {
    cue?.stopCueAudio();
    globalThis.window = originalWindow;
    globalThis.Audio = originalAudio;
  }
});

test("playback waits for a pending preload to reach canplay", async () => {
  const originalWindow = globalThis.window;
  const originalAudio = globalThis.Audio;
  const instances = [];
  const deliveries = [];
  let cue = null;

  class FakeAudio {
    constructor() {
      this.src = "";
      this.currentTime = 0;
      this.paused = true;
      this.playCount = 0;
      this.listeners = new Map();
      instances.push(this);
    }

    addEventListener(type, handler) {
      const handlers = this.listeners.get(type) || [];
      handlers.push(handler);
      this.listeners.set(type, handlers);
    }

    removeEventListener(type, handler) {
      const handlers = this.listeners.get(type) || [];
      this.listeners.set(type, handlers.filter(candidate => candidate !== handler));
    }

    emit(type) {
      for (const handler of this.listeners.get(type) || []) handler();
    }

    load() {}
    play() { this.paused = false; this.playCount += 1; return Promise.resolve(); }
    pause() { this.paused = true; }
  }

  globalThis.window = { speechSynthesis: { cancel() {} } };
  globalThis.Audio = FakeAudio;

  try {
    cue = await import(`../../src/utils/audio/cuePlayer.js?pending=${Date.now()}`);
    const preload = cue.preloadCueAudio("/audio/pending.mp3");
    assert.equal(instances.length, 1);

    cue.playCueAudio("/audio/pending.mp3", {
      onDelivery: event => deliveries.push(event.type)
    });
    await Promise.resolve();

    assert.equal(instances[0].playCount, 0);
    assert.deepEqual(deliveries, ["loading"]);

    instances[0].emit("canplay");
    assert.equal(await preload, true);
    await Promise.resolve();
    await Promise.resolve();

    assert.equal(instances[0].playCount, 1);
    assert.ok(deliveries.includes("started"));
  } finally {
    cue?.stopCueAudio();
    globalThis.window = originalWindow;
    globalThis.Audio = originalAudio;
  }
});

test("a failed cue advances to the next recorded clip in a sequence", async () => {
  const originalWindow = globalThis.window;
  const originalAudio = globalThis.Audio;
  const instances = [];
  let cue = null;

  class FakeAudio {
    constructor(source = "") {
      this.src = source;
      this.currentTime = 0;
      this.listeners = new Map();
      instances.push(this);
    }

    addEventListener(type, handler) {
      const handlers = this.listeners.get(type) || [];
      handlers.push(handler);
      this.listeners.set(type, handlers);
    }

    removeEventListener(type, handler) {
      const handlers = this.listeners.get(type) || [];
      this.listeners.set(type, handlers.filter(candidate => candidate !== handler));
    }

    emit(type) {
      for (const handler of this.listeners.get(type) || []) handler();
    }

    play() { return Promise.resolve(); }
    pause() {}
  }

  globalThis.window = {
    speechSynthesis: { cancel() {} },
    setTimeout: callback => { callback(); return 1; }
  };
  globalThis.Audio = FakeAudio;

  try {
    cue = await import(`../../src/utils/audio/cuePlayer.js?sequence=${Date.now()}`);
    cue.playCueSequence(["/audio/first.mp3", "/audio/second.mp3"], { gapMs: 0 });
    assert.equal(instances.length, 1);
    instances[0].emit("error");
    assert.equal(instances.length, 1);
    assert.equal(instances[0].src, "/audio/second.mp3");
  } finally {
    cue?.stopCueAudio();
    globalThis.window = originalWindow;
    globalThis.Audio = originalAudio;
  }
});

test("stopping during a sequence gap prevents the next clip from starting", async () => {
  const originalWindow = globalThis.window;
  const originalAudio = globalThis.Audio;
  const instances = [];
  const timers = [];
  let cue = null;

  class FakeAudio {
    constructor(source = "") {
      this.src = source;
      this.currentTime = 0;
      this.playCount = 0;
      this.listeners = new Map();
      instances.push(this);
    }

    addEventListener(type, handler) {
      const handlers = this.listeners.get(type) || [];
      handlers.push(handler);
      this.listeners.set(type, handlers);
    }

    removeEventListener(type, handler) {
      const handlers = this.listeners.get(type) || [];
      this.listeners.set(type, handlers.filter(candidate => candidate !== handler));
    }

    emit(type) {
      for (const handler of this.listeners.get(type) || []) handler();
    }

    play() {
      this.playCount += 1;
      return Promise.resolve();
    }

    pause() {}
  }

  globalThis.window = {
    speechSynthesis: { cancel() {} },
    setTimeout(callback) {
      timers.push(callback);
      return timers.length;
    },
    clearTimeout() {}
  };
  globalThis.Audio = FakeAudio;

  try {
    cue = await import(`../../src/utils/audio/cuePlayer.js?gap-stop=${Date.now()}`);
    cue.playCueSequence(["/audio/first.mp3", "/audio/second.mp3"], { gapMs: 180 });
    const audio = instances[0];
    assert.equal(audio.src, "/audio/first.mp3");
    assert.equal(audio.playCount, 1);

    audio.emit("ended");
    assert.equal(timers.length, 1);
    cue.stopCueAudio();
    timers[0]();

    assert.equal(audio.src, "/audio/first.mp3");
    assert.equal(audio.playCount, 1);
  } finally {
    cue?.stopCueAudio();
    globalThis.window = originalWindow;
    globalThis.Audio = originalAudio;
  }
});

test("a rejected cue play promise also advances the sequence", async () => {
  const originalWindow = globalThis.window;
  const originalAudio = globalThis.Audio;
  const instances = [];
  let cue = null;

  class FakeAudio {
    constructor(source = "") {
      this.src = source;
      this.listeners = new Map();
      instances.push(this);
    }

    addEventListener(type, handler) {
      const handlers = this.listeners.get(type) || [];
      handlers.push(handler);
      this.listeners.set(type, handlers);
    }

    removeEventListener(type, handler) {
      const handlers = this.listeners.get(type) || [];
      this.listeners.set(type, handlers.filter(candidate => candidate !== handler));
    }

    play() {
      this.playCount = (this.playCount || 0) + 1;
      return this.playCount === 1
        ? Promise.reject(new Error("network failed"))
        : Promise.resolve();
    }

    pause() {}
  }

  globalThis.window = {
    speechSynthesis: { cancel() {} },
    setTimeout: callback => { callback(); return 1; }
  };
  globalThis.Audio = FakeAudio;

  try {
    cue = await import(`../../src/utils/audio/cuePlayer.js?rejection=${Date.now()}`);
    cue.playCueSequence(["/audio/first.mp3", "/audio/second.mp3"], { gapMs: 0 });
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(instances.length, 1);
    assert.equal(instances[0].src, "/audio/second.mp3");
    assert.equal(instances[0].playCount, 2);
  } finally {
    cue?.stopCueAudio();
    globalThis.window = originalWindow;
    globalThis.Audio = originalAudio;
  }
});

test("a cue completion callback fires only after recorded playback ends", async () => {
  const originalWindow = globalThis.window;
  const originalAudio = globalThis.Audio;
  let cue = null;
  let audio = null;
  let ended = 0;

  class FakeAudio {
    constructor() {
      this.currentTime = 0;
      this.listeners = new Map();
      audio = this;
    }

    addEventListener(type, handler) {
      const handlers = this.listeners.get(type) || [];
      handlers.push(handler);
      this.listeners.set(type, handlers);
    }

    removeEventListener(type, handler) {
      const handlers = this.listeners.get(type) || [];
      this.listeners.set(type, handlers.filter(candidate => candidate !== handler));
    }

    emit(type) {
      for (const handler of this.listeners.get(type) || []) handler();
    }

    play() { return Promise.resolve(); }
    pause() {}
    load() {}
  }

  globalThis.window = { speechSynthesis: { cancel() {} } };
  globalThis.Audio = FakeAudio;

  try {
    cue = await import(`../../src/utils/audio/cuePlayer.js?ended=${Date.now()}`);
    cue.playCueAudio("/audio/phrase.mp3", { onEnded: () => { ended += 1; } });
    assert.equal(ended, 0);
    audio.emit("ended");
    assert.equal(ended, 1);
  } finally {
    cue?.stopCueAudio();
    globalThis.window = originalWindow;
    globalThis.Audio = originalAudio;
  }
});

test("interrupting a cue reports cancellation without reporting completion", async () => {
  const originalWindow = globalThis.window;
  const originalAudio = globalThis.Audio;
  let cue = null;
  let ended = 0;
  let interrupted = 0;

  class FakeAudio {
    constructor() {
      this.currentTime = 0;
      this.listeners = new Map();
    }

    addEventListener(type, handler) {
      const handlers = this.listeners.get(type) || [];
      handlers.push(handler);
      this.listeners.set(type, handlers);
    }

    removeEventListener(type, handler) {
      const handlers = this.listeners.get(type) || [];
      this.listeners.set(type, handlers.filter(candidate => candidate !== handler));
    }

    play() { return Promise.resolve(); }
    pause() {}
    load() {}
  }

  globalThis.window = { speechSynthesis: { cancel() {} } };
  globalThis.Audio = FakeAudio;

  try {
    cue = await import(`../../src/utils/audio/cuePlayer.js?interrupted=${Date.now()}`);
    cue.playCueAudio("/audio/phrase.mp3", {
      onEnded: () => { ended += 1; },
      onInterrupted: () => { interrupted += 1; }
    });
    cue.playCueAudio("/audio/instructions.mp3");
    assert.equal(interrupted, 1);
    assert.equal(ended, 0);
    cue.stopCueAudio();
    assert.equal(interrupted, 1);
  } finally {
    cue?.stopCueAudio();
    globalThis.window = originalWindow;
    globalThis.Audio = originalAudio;
  }
});

test("a cue that cannot resume after suspension reports interruption", async () => {
  const originalWindow = globalThis.window;
  const originalAudio = globalThis.Audio;
  let cue = null;
  let interrupted = 0;

  class FakeAudio {
    constructor() {
      this.currentTime = 0;
      this.playCount = 0;
      this.listeners = new Map();
    }

    addEventListener(type, handler) {
      const handlers = this.listeners.get(type) || [];
      handlers.push(handler);
      this.listeners.set(type, handlers);
    }

    removeEventListener(type, handler) {
      const handlers = this.listeners.get(type) || [];
      this.listeners.set(type, handlers.filter(candidate => candidate !== handler));
    }

    play() {
      this.playCount += 1;
      return this.playCount === 1
        ? Promise.resolve()
        : Promise.reject(new Error("resume blocked"));
    }

    pause() {}
    load() {}
  }

  globalThis.window = { speechSynthesis: { cancel() {} } };
  globalThis.Audio = FakeAudio;

  try {
    cue = await import(`../../src/utils/audio/cuePlayer.js?resume-failure=${Date.now()}`);
    cue.playCueAudio("/audio/phrase.mp3", {
      onInterrupted: () => { interrupted += 1; }
    });
    cue.setCueAudioSuspended(true);
    cue.setCueAudioSuspended(false);
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(interrupted, 1);
    cue.stopCueAudio();
    assert.equal(interrupted, 1);
  } finally {
    cue?.stopCueAudio();
    globalThis.window = originalWindow;
    globalThis.Audio = originalAudio;
  }
});
