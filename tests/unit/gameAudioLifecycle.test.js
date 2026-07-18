import test from "node:test";
import assert from "node:assert/strict";

test("quest music and ambience resume from the same place after a hidden tab", async () => {
  const originalWindow = globalThis.window;
  const originalAudio = globalThis.Audio;
  const listeners = new Map();
  let music = null;

  class FakeAudio {
    constructor(source = "") {
      this.src = source;
      this.currentTime = 0;
      this.loop = false;
      this.paused = true;
      this.preload = "";
      this.volume = 1;
      this.playCount = 0;
    }

    canPlayType(type) {
      return type === "audio/mpeg" ? "probably" : "";
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
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
    setInterval,
    clearInterval
  };
  globalThis.Audio = FakeAudio;

  try {
    music = await import(`../../src/utils/audio/gameMusic.js?lifecycle=${Date.now()}`);
    const score = await music.startGameMusic("glass-marsh-drift", { mode: "encounter" });
    const ambience = music.startGameAmbience("glass-marsh", { mode: "encounter" });
    await Promise.resolve();

    score.audio.currentTime = 17.25;
    ambience.audio.currentTime = 8.5;
    assert.ok(Math.abs(score.targetVolume - 0.212) < 0.000001);
    assert.ok(Math.abs(ambience.targetVolume - 0.0464) < 0.000001);
    assert.equal(score.audio.paused, false);
    assert.equal(ambience.audio.paused, false);

    assert.equal(music.setGameAudioSuspended(true), true);
    assert.equal(score.audio.paused, true);
    assert.equal(ambience.audio.paused, true);

    assert.equal(music.setGameAudioSuspended(false), false);
    await Promise.resolve();
    assert.equal(score.audio.paused, false);
    assert.equal(ambience.audio.paused, false);
    assert.equal(score.audio.currentTime, 17.25);
    assert.equal(ambience.audio.currentTime, 8.5);
    assert.ok(score.audio.playCount >= 2);
    assert.ok(ambience.audio.playCount >= 2);
  } finally {
    music?.stopGameMusic({ fadeSeconds: 0 });
    music?.stopGameAmbience({ fadeSeconds: 0 });
    globalThis.window = originalWindow;
    globalThis.Audio = originalAudio;
  }
});
