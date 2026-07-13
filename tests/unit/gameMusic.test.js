import { test } from "node:test";
import assert from "node:assert/strict";
import { getGameMusicTrack } from "../../src/utils/audio/gameMusic.js";

test("Sound Seekers has a distinct new soundtrack for every world", () => {
  const worlds = ["meadow", "dino", "moonwood"];
  const tracks = worlds.map(world => getGameMusicTrack(world));

  assert.equal(new Set(tracks.map(track => track.title)).size, worlds.length);
  assert.equal(new Set(tracks.map(track => track.sources[0])).size, worlds.length);
  for (const track of tracks) {
    assert.match(track.sources[0], /^\/audio\/music\/quest\/.+-loop\.mp3$/);
    assert.ok(track.volume <= 0.16, `${track.title} is too loud beneath phonics prompts`);
    assert.match(track.sources[1], /^\/audio\/music\/.+-loop\.mp3$/, `${track.title} needs a legacy fallback`);
  }
});
