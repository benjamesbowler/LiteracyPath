import { test } from "node:test";
import assert from "node:assert/strict";
import { getGameAmbienceTrack, getGameAudioMix, getGameMusicTrack } from "../../src/utils/audio/gameMusic.js";

let runtimeSerial = 0;
async function delayedMusicRuntime(t) {
  const previous = { window: globalThis.window, Audio: globalThis.Audio };
  const timers = new Map(), listeners = new Map(); let serial = 0;
  class DelayedAudio {
    constructor(src = "") { this.src = src; this.volume = 1; this.currentTime = 0; this.paused = true; this.requests = []; }
    canPlayType() { return "probably"; }
    play() {
      this.paused = false;
      return new Promise((resolve, reject) => this.requests.push({ resolve, reject }));
    }
    pause() { this.paused = true; }
  }
  globalThis.window = {
    setInterval: fn => { const id = ++serial; timers.set(id, fn); return id; }, clearInterval: id => timers.delete(id),
    addEventListener: (event, fn) => { if (!listeners.has(event)) listeners.set(event, new Set()); listeners.get(event).add(fn); },
    removeEventListener: (event, fn) => listeners.get(event)?.delete(fn)
  };
  globalThis.Audio = DelayedAudio;
  const music = await import(`../../src/utils/audio/gameMusic.js?delayed-owner=${++runtimeSerial}`);
  t.after(() => {
    music.stopGameMusic({ fadeSeconds: 0 }); music.stopGameAmbience({ fadeSeconds: 0 });
    Object.assign(globalThis, previous);
  });
  const settle = () => { for (let i = 0; i < 40; i++) for (const [id, fn] of [...timers]) if (timers.has(id)) fn(); };
  const finishPlay = async audio => { audio.requests.at(-1).resolve(); await Promise.resolve(); await Promise.resolve(); settle(); };
  return { music, settle, finishPlay, listeners };
}

test("delayed music and ambience play completion retain active voice duck ownership", async t => {
  const { music, settle, finishPlay } = await delayedMusicRuntime(t), first = {}, second = {};
  const score = await music.startGameMusic("drum-trail");
  const ambience = music.startGameAmbience("seedwake-meadow");
  music.duckGameMusic(first); settle();
  await finishPlay(score.audio); await finishPlay(ambience.audio);
  assert.ok(Math.abs(score.audio.volume - score.targetVolume * .24) < 1e-9);
  assert.ok(Math.abs(ambience.audio.volume - ambience.targetVolume * .16) < 1e-9);
  music.duckGameMusic(second); music.duckGameMusic(second); music.restoreGameMusic(); music.restoreGameMusic(first); settle();
  assert.ok(Math.abs(score.audio.volume - score.targetVolume * .24) < 1e-9, "legacy or older voice release cannot clear the second owner");
  music.setGameMusicVolume(.3); settle();
  assert.ok(Math.abs(score.audio.volume - .3 * .24) < 1e-9);
  music.restoreGameMusic(second); settle();
  assert.equal(score.audio.volume, .3); assert.equal(ambience.audio.volume, ambience.targetVolume);
  music.restoreGameMusic(first); settle(); assert.equal(score.audio.volume, .3, "stale release is inert");
});

test("duck ownership survives music restart, suspension and legacy cue release", async t => {
  const { music, settle, finishPlay } = await delayedMusicRuntime(t), voice = {};
  music.duckGameMusic(voice);
  const first = await music.startGameMusic("lantern-lagoon"); await finishPlay(first.audio);
  music.duckGameMusic(); music.duckGameMusic(); music.restoreGameMusic(); settle();
  assert.ok(Math.abs(first.audio.volume - first.targetVolume * .24) < 1e-9);
  music.stopGameMusic({ fadeSeconds: 0 });
  const restarted = await music.startGameMusic("lantern-lagoon"); await finishPlay(restarted.audio);
  assert.ok(Math.abs(restarted.audio.volume - restarted.targetVolume * .24) < 1e-9);
  music.setGameAudioSuspended(true); assert.equal(restarted.audio.paused, true);
  music.setGameAudioSuspended(false); await finishPlay(restarted.audio);
  assert.ok(Math.abs(restarted.audio.volume - restarted.targetVolume * .24) < 1e-9);
  music.restoreGameMusic(voice); settle(); assert.equal(restarted.audio.volume, restarted.targetVolume);
});

test("stale track play promises cannot change a replacement track or register playback retries", async t => {
  const { music, settle, finishPlay, listeners } = await delayedMusicRuntime(t), voice = {};
  const old = await music.startGameMusic("drum-trail");
  const oldAmbience = music.startGameAmbience("seedwake-meadow");
  const next = await music.startGameMusic("lantern-lagoon");
  const nextAmbience = music.startGameAmbience("glass-marsh");
  music.duckGameMusic(voice); await finishPlay(next.audio); await finishPlay(nextAmbience.audio);
  old.audio.requests[0].resolve(); oldAmbience.audio.requests[0].reject(new Error("late old failure"));
  await Promise.resolve(); await Promise.resolve(); settle();
  assert.ok(Math.abs(next.audio.volume - next.targetVolume * .24) < 1e-9);
  assert.ok(Math.abs(nextAmbience.audio.volume - nextAmbience.targetVolume * .16) < 1e-9);
  assert.equal([...listeners.values()].reduce((total, set) => total + set.size, 0), 0);
  music.restoreGameMusic(voice);
});

test("Sound Seekers has a distinct new soundtrack for every world", () => {
  const worlds = ["meadow", "dino", "moonwood"];
  const tracks = worlds.map(world => getGameMusicTrack(world));

  assert.equal(new Set(tracks.map(track => track.title)).size, worlds.length);
  assert.equal(new Set(tracks.map(track => track.sources[0])).size, worlds.length);
  for (const track of tracks) {
    assert.match(track.sources[0], /^\/audio\/music\/quest\/.+-loop\.mp3$/);
    assert.ok(track.volume >= 0.18 && track.volume <= 0.22, `${track.title} needs an audible child-safe mix`);
    assert.match(track.sources[1], /^\/audio\/music\/.+-loop\.mp3$/, `${track.title} needs a legacy fallback`);
  }
});

test("each Sound Seekers chapter resolves to its own score identity", () => {
  const ids = [
    "seedwake-ramble",
    "river-garden-paddle",
    "fossil-ridge-march",
    "forge-yard-stomp",
    "glass-marsh-drift",
    "storm-coast-skip",
    "lantern-forest-prowl",
    "star-reach-finale"
  ];
  const tracks = ids.map(id => getGameMusicTrack(id));

  assert.equal(new Set(tracks.map(track => track.title)).size, ids.length);
  assert.equal(new Set(tracks.map(track => track.sources[0])).size, ids.length);
  tracks.forEach(track => {
    assert.ok(track.volume >= 0.18 && track.volume <= 0.22);
    assert.match(track.sources[0], /^\/audio\/music\/quest\/.+-loop\.mp3$/, `${track.title} still borrows an arcade score`);
  });
});

test("Seedwake travel, encounter, and ceremony use distinct motif-matched arrangements", () => {
  const ids = ["seedwake-ramble", "seedwake-ramble-action", "seedwake-ramble-ceremony"];
  const tracks = ids.map(id => getGameMusicTrack(id));

  assert.equal(new Set(tracks.map(track => track.sources[0])).size, ids.length);
  assert.deepEqual(
    tracks.map(track => track.sources[0]),
    [
      "/audio/music/quest/meadow-morning-loop.mp3",
      "/audio/music/quest/seedwake-action-loop.mp3",
      "/audio/music/quest/seedwake-ceremony-loop.mp3"
    ]
  );
  tracks.forEach(track => assert.ok(track.volume >= 0.18 && track.volume <= 0.22));
});

test("every quest chapter has its own quiet environmental soundscape", () => {
  const ids = [
    "seedwake-meadow", "river-gardens", "fossil-canyon", "forge-settlement",
    "glass-marsh", "storm-coast", "lantern-forest", "star-reach"
  ];
  const tracks = ids.map(getGameAmbienceTrack);
  assert.ok(tracks.every(Boolean));
  assert.equal(new Set(tracks.map(track => track.source)).size, ids.length);
  tracks.forEach(track => {
    assert.match(track.source, /^\/audio\/music\/quest\/.+-ambience-loop\.mp3$/);
    assert.ok(track.volume >= 0.07 && track.volume <= 0.09);
  });
});

test("quest travel, encounter, and ceremony mixes preserve cue headroom", () => {
  assert.deepEqual(getGameAudioMix("travel"), { music: 1, ambience: 1 });
  assert.deepEqual(getGameAudioMix("encounter"), { music: 0.8, ambience: 0.58 });
  assert.deepEqual(getGameAudioMix("ceremony"), { music: 0.92, ambience: 0.46 });
  assert.equal(getGameAudioMix("unknown"), getGameAudioMix("travel"));
  // Encounters are the phoneme-discrimination moment: the music must sit DOWN
  // in the mix there, below travel — it used to be 6% LOUDER, eating the very
  // headroom this test's name promises.
  assert.ok(getGameAudioMix("encounter").music < getGameAudioMix("travel").music);
  assert.ok(getGameAudioMix("ceremony").ambience < getGameAudioMix("encounter").ambience);
});
