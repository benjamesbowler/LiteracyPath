import test from "node:test";
import assert from "node:assert/strict";
import { createHopAndStopMediaPlayer } from "../../src/utils/hopAndStopMedia.js";

class Recording extends EventTarget {
  constructor(src) { super(); this.src = src; this.currentTime = 0; this.paused = true; this.playCount = 0; }
  play() { this.paused = false; this.playCount += 1; return Promise.resolve(); }
  pause() { this.paused = true; }
  emit(type) { this.dispatchEvent(new Event(type)); }
}

function harness() {
  const recordings = [], statuses = [];
  const player = createHopAndStopMediaPlayer({
    makeAudio: src => { const audio = new Recording(src); recordings.push(audio); return audio; },
    onStatus: state => statuses.push(state)
  });
  return { recordings, statuses, player };
}

test("recordings are never constructed before a user play request and delivery requires the end event", async () => {
  const { player, recordings, statuses } = harness();
  assert.equal(recordings.length, 0);
  const delivered = player.play("/hop.mp3");
  assert.equal(recordings[0].playCount, 1);
  recordings[0].emit("playing");
  assert.equal(statuses.at(-1).status, "playing");
  recordings[0].emit("ended");
  assert.equal(await delivered, "completed");
});

test("a page change or newer request pauses old media and settles old waiters as interrupted", async () => {
  const { player, recordings, statuses } = harness();
  const first = player.play("/page-01.mp3");
  const second = player.play("/hop.mp3");
  assert.equal(await first, "interrupted");
  assert.equal(recordings[0].paused, true);
  const count = statuses.length;
  recordings[0].emit("playing");
  recordings[0].emit("ended");
  assert.equal(statuses.length, count, "late media events cannot claim stale delivery");
  player.stop();
  assert.equal(await second, "interrupted");
  assert.equal(recordings[1].paused, true);
  assert.equal(recordings[1].currentTime, 0);
});

test("missing recordings and blocked playback report unavailable without completed delivery", async () => {
  const { player, recordings, statuses } = harness();
  const missing = player.play("/missing.mp3");
  recordings[0].emit("error");
  assert.equal(await missing, "unavailable");
  assert.equal(recordings[0].paused, true);
  assert.equal(statuses.some(item => item.status === "completed"), false);

  const blocked = createHopAndStopMediaPlayer({ makeAudio: () => ({
    addEventListener() {}, removeEventListener() {}, pause() {},
    play: () => Promise.reject(new Error("Playback blocked"))
  }) });
  assert.equal(await blocked.play("/stop.mp3"), "unavailable");
});

test("the startup guard does not cut off a full song after playback begins", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const { player, recordings, statuses } = harness();
  const song = player.play("/hop-and-stop.mp3");
  recordings[0].emit("playing");
  context.mock.timers.tick(76000);
  assert.equal(recordings[0].paused, false);
  assert.equal(statuses.at(-1).status, "playing");
  recordings[0].emit("ended");
  assert.equal(await song, "completed");
});
