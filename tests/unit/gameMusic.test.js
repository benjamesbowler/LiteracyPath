import { test } from "node:test";
import assert from "node:assert/strict";
import { getGameAmbienceTrack, getGameAudioMix, getGameMusicTrack } from "../../src/utils/audio/gameMusic.js";

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
  assert.deepEqual(getGameAudioMix("encounter"), { music: 1.06, ambience: 0.58 });
  assert.deepEqual(getGameAudioMix("ceremony"), { music: 0.92, ambience: 0.46 });
  assert.equal(getGameAudioMix("unknown"), getGameAudioMix("travel"));
  assert.ok(getGameAudioMix("encounter").music > getGameAudioMix("travel").music);
  assert.ok(getGameAudioMix("ceremony").ambience < getGameAudioMix("encounter").ambience);
});
