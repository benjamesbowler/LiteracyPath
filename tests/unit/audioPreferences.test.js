import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { normalizeAudioPreferences } from "../../src/utils/audio/audioPreferences.js";

test("music can be disabled without disabling spoken teaching audio", () => {
  assert.deepEqual(normalizeAudioPreferences(), {
    soundEnabled: true,
    musicEnabled: true
  });
  assert.deepEqual(normalizeAudioPreferences({ musicEnabled: false, soundEnabled: true }), {
    soundEnabled: true,
    musicEnabled: false
  });
  assert.deepEqual(normalizeAudioPreferences({ musicEnabled: true, soundEnabled: false }), {
    soundEnabled: false,
    musicEnabled: true
  });
});

test("the retired quiet-soundscape setting migrates to the current music preference", () => {
  assert.deepEqual(normalizeAudioPreferences({ quietSoundscape: true }), {
    soundEnabled: true,
    musicEnabled: false
  });
  assert.equal(
    normalizeAudioPreferences({ quietSoundscape: true, musicEnabled: true }).musicEnabled,
    true,
    "an explicit current preference must outrank the retired inverse field"
  );
  assert.deepEqual(normalizeAudioPreferences({ soundEnabled: false }), {
    soundEnabled: false,
    musicEnabled: false
  }, "a previously muted child must not suddenly hear music after migration");
});

test("every music-playing child surface exposes music separately from spoken audio", () => {
  const home = fs.readFileSync("src/components/ChildHomeMusicControl.jsx", "utf8");
  const arcade = fs.readFileSync("src/components/learn/games/GameArcadeHub.jsx", "utf8");
  const player = fs.readFileSync("src/components/learn/games/GamePlayer.jsx", "utf8");
  const soundBeat = fs.readFileSync("src/components/learn/games/games/Ps1ArcadeGame.jsx", "utf8");
  const quest = fs.readFileSync("src/components/quest/QuestRoot.jsx", "utf8");
  const questSettings = fs.readFileSync("src/components/quest/QuestSettingsDialog.jsx", "utf8");
  const renderers = [
    "src/components/quest/world/QuestHub.jsx",
    "src/components/quest/world/QuestPixelWorld.jsx",
    "src/components/quest/world/QuestTrail2D.jsx"
  ].map(path => fs.readFileSync(path, "utf8"));

  assert.match(home, /Turn music off/);
  assert.match(arcade, /onMusicEnabledChange=\{setMusicEnabled\}/);
  assert.match(arcade, /soundEnabled=\{progress\.soundEnabled\}/);
  assert.match(player, /if \(musicEnabled && game\.id !== "sound-beat"\) startGameMusic/);
  assert.match(player, /if \(!soundEnabled\) cancelSpeech\(\)/);
  assert.match(player, /isMusicEnabled=\{musicEnabled\}/);
  assert.match(soundBeat, /const musicAllowed = \(\) => options\.getMusic/);
  assert.match(soundBeat, /!musicAllowed\(\)/);
  assert.match(quest, /if \(isMusicEnabled\) startGameMusic/);
  assert.match(quest, /if \(isMusicEnabled && musicChapter\?\.id\)/);
  assert.match(questSettings, /Music on \(spoken audio stays on\)/);
  assert.match(questSettings, /Spoken audio and game sounds on/);
  for (const renderer of renderers) {
    assert.match(renderer, /<MusicToggle/);
    assert.match(renderer, /onMusicEnabledChange/);
  }
});
