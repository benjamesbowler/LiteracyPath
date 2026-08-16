import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

import {
  CHILD_HOME_MUSIC_DEFAULT_ENABLED,
  CHILD_HOME_MUSIC_TRACKS,
  childHomeMusicPreferenceKey,
  nextChildHomeMusicTrackIndex
} from "../../src/data/childHomeMusic.js";

test("child Home ships a quiet, web-ready, registered music track", () => {
  const generatedAudioPaths = readFileSync("src/data/generated/audioFilePaths.generated.js", "utf8");
  assert.equal(CHILD_HOME_MUSIC_DEFAULT_ENABLED, true);
  assert.ok(CHILD_HOME_MUSIC_TRACKS.length >= 1);
  assert.equal(new Set(CHILD_HOME_MUSIC_TRACKS.map(track => track.id)).size, CHILD_HOME_MUSIC_TRACKS.length);

  for (const track of CHILD_HOME_MUSIC_TRACKS) {
    assert.match(track.source, /^\/audio\/music\/child-home\/.+\.mp3$/);
    assert.equal(track.mediaType, "audio/mpeg");
    assert.ok(track.volume > 0 && track.volume <= 0.16, `${track.id} must stay quieter than activity music`);
    assert.match(track.sourceSha256, /^[a-f0-9]{64}$/);
    assert.match(track.assetSha256, /^[a-f0-9]{64}$/);
    const assetPath = `public${track.source}`;
    assert.equal(existsSync(assetPath), true, `${assetPath} must exist`);
    assert.ok(statSync(assetPath).size > 100_000, `${assetPath} must contain a real track`);
    const lastSlash = track.source.lastIndexOf("/");
    assert.ok(generatedAudioPaths.includes(`"${track.source.slice(0, lastSlash)}"`));
    assert.ok(generatedAudioPaths.includes(track.source.slice(lastSlash + 1)));
  }
});

test("the music preference is per child and future tracks form a looping playlist", () => {
  assert.equal(
    childHomeMusicPreferenceKey("reader one"),
    "lp-child-home-music-enabled-v1:reader%20one"
  );
  assert.equal(nextChildHomeMusicTrackIndex(0, 1), 0);
  assert.equal(nextChildHomeMusicTrackIndex(0, 3), 1);
  assert.equal(nextChildHomeMusicTrackIndex(2, 3), 0);
});

test("the Home control exposes truthful states and joins the child audio lifecycle", () => {
  const control = readFileSync("src/components/ChildHomeMusicControl.jsx", "utf8");
  const home = readFileSync("src/components/StudentHomePage.jsx", "utf8");
  const shell = readFileSync("src/components/StudentGlassShell.jsx", "utf8");

  assert.match(control, /data-playback-state=\{playbackState\}/);
  assert.match(control, /Music on/);
  assert.match(control, /Music off/);
  assert.match(control, /Play music/);
  assert.match(control, /STOP_CHILD_AUDIO_EVENT/);
  assert.match(control, /loop=\{CHILD_HOME_MUSIC_TRACKS\.length === 1\}/);
  assert.match(
    home,
    /headerActions=\{<ChildHomeMusicControl key=\{progressScopeKey\} scopeKey=\{progressScopeKey\} \/>\}/
  );
  assert.match(shell, /\{headerActions\}/);
});
