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
