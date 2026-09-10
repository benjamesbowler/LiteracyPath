import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { normalizeAudioPreferences } from "../../src/utils/audio/audioPreferences.js";

test("old automatic music-on saves migrate off without changing speech", () => {
  for (const raw of [{}, { musicEnabled: true }, { musicEnabled: false }, { quietSoundscape: false }, { soundEnabled: false, musicEnabled: true }]) {
    const next = normalizeAudioPreferences(raw);
    assert.equal(next.musicEnabled, false);
    assert.equal(next.soundEnabled, raw.soundEnabled !== false);
    assert.equal(next.musicPreferenceVersion, 1);
    assert.deepEqual(normalizeAudioPreferences(next), next);
  }
});

test("every music-playing child surface exposes music separately from spoken audio", () => {
  const home = fs.readFileSync("src/components/ChildHomeMusicControl.jsx", "utf8");
  const arcade = fs.readFileSync("src/components/learn/games/GameArcadeHub.jsx", "utf8");
  const player = fs.readFileSync("src/components/learn/games/GamePlayer.jsx", "utf8");
  const soundBeat = fs.readFileSync("src/components/learn/games/games/Ps1ArcadeGame.jsx", "utf8");
  const quest = fs.readFileSync("src/components/quest/QuestRoot.jsx", "utf8");
  const questSettings = fs.readFileSync("src/components/quest/QuestSettingsDialog.jsx", "utf8");
  const questMap = fs.readFileSync("src/components/quest/TrailMap.jsx", "utf8");
  const questShop = fs.readFileSync("src/components/quest/TradingPost.jsx", "utf8");
  const renderers = [
    "src/components/quest/world/QuestHub.jsx",
    "src/components/quest/world/QuestPixelWorld.jsx",
    "src/components/quest/world/QuestTrail2D.jsx"
  ].map(path => fs.readFileSync(path, "utf8"));

  assert.match(home, /Turn music off/);
  assert.doesNotMatch(arcade, /musicEnabled=\{progress\.musicEnabled\}/);
  assert.match(player, /useActivityMusic/);
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
  assert.match(quest, /view === VIEW\.CREATOR[\s\S]*?<MusicToggle/);
  assert.match(questMap, /<MusicToggle/);
  assert.match(questShop, /<MusicToggle/);
  for (const renderer of renderers) {
    assert.match(renderer, /<MusicToggle/);
    assert.match(renderer, /onMusicEnabledChange/);
  }
});

test("music opt-in survives normalization in every settings model", async () => {
  const { normalizeAllowlistedSettings } = await import("../../src/features/soundSeekers/engine/stateV2.js");
  const { normalizeQuestSettings } = await import("../../src/utils/questPerformance.js");
  for (const normalize of [normalizeAudioPreferences, normalizeAllowlistedSettings, normalizeQuestSettings]) {
    assert.equal(normalize({}).musicEnabled, false);
    assert.equal(normalize({ musicEnabled: true }).musicEnabled, false);
    assert.equal(normalize({}).soundEnabled, true);
    assert.equal(normalize({ musicPreferenceVersion: 1, musicEnabled: true }).musicEnabled, true);
    assert.equal(normalize({ musicEnabled: false }).musicEnabled, false);
  }
  assert.equal(normalizeAllowlistedSettings({ ...normalizeAllowlistedSettings({}), music: true }).music, true);
  assert.equal(normalizeAllowlistedSettings({}).music, false);
  assert.equal(normalizeAllowlistedSettings({ music: true }).music, false);
});

test("stale cloud music cannot inherit a new local migration marker", async () => {
  const { computeHydratedValue } = await import("../../src/utils/progressMerge.js");
  for (const enabled of [false, true]) {
    const local = { ...normalizeAudioPreferences({}), musicEnabled: enabled, games: {} };
    const merged = computeHydratedValue("learn_games", "__all__", local, { musicEnabled: true, games: {} });
    assert.equal(normalizeAudioPreferences(merged).musicEnabled, enabled);
  }
});

test("an existing Arcade save migrates, keeps progress, and remembers a fresh opt-in", async () => {
  const storage = new Map();
  globalThis.window = { localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } };
  try {
    const { loadLearnGamesProgress, saveLearnGamesSettings } = await import("../../src/utils/learnGamesProgress.js");
    const key = "literacy-guide-learn-games:music-regression";
    storage.set(key, JSON.stringify({ soundEnabled: true, musicEnabled: true, games: { "rocket-run": { stars: 3 } } }));
    const migrated = loadLearnGamesProgress("music-regression");
    assert.equal(migrated.musicEnabled, false);
    assert.equal(migrated.soundEnabled, true);
    assert.equal(migrated.games["rocket-run"].stars, 3);
    saveLearnGamesSettings("music-regression", { musicEnabled: true });
    assert.equal(loadLearnGamesProgress("music-regression").musicEnabled, true);
    saveLearnGamesSettings("music-regression", { musicEnabled: false });
    assert.equal(loadLearnGamesProgress("music-regression").musicEnabled, false);
  } finally { delete globalThis.window; }
});
