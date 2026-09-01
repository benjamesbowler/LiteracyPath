import test from "node:test";
import assert from "node:assert/strict";
import { baseQuestState } from "../../src/utils/questProgress.js";
import {
  loadQuestProgress,
  loadSoundSeekersV2Progress,
  questProgressStorageKey,
  saveQuestProgress,
  saveSoundSeekersV2Progress
} from "../../src/utils/questStore.js";

function installStorageWindow() {
  const values = new Map();
  const previousWindow = globalThis.window;
  globalThis.window = {
    localStorage: {
      getItem(key) { return values.get(key) ?? null; },
      setItem(key, value) { values.set(key, value); },
      removeItem(key) { values.delete(key); }
    },
    dispatchEvent() {}
  };
  return {
    values,
    restore() { globalThis.window = previousWindow; }
  };
}

test("legacy quest store keeps QuestRoot's v1 state shape until cutover", () => {
  const storage = installStorageWindow();
  try {
    const scopeKey = "legacy-route";
    const legacy = {
      ...baseQuestState(),
      hatched: true,
      trail: { ...baseQuestState().trail, stopsDone: ["s1"], routeCursor: 2 }
    };
    storage.values.set(questProgressStorageKey(scopeKey), JSON.stringify(legacy));

    const loaded = loadQuestProgress(scopeKey);
    const saved = saveQuestProgress(scopeKey, loaded, { syncCloud: false });

    assert.equal(loaded.v, 1);
    assert.equal(loaded.hatched, true);
    assert.deepEqual(loaded.trail.stopsDone, ["s1"]);
    assert.equal(saved.v, 1);
    assert.deepEqual(saved.trail.stopsDone, ["s1"]);
  } finally {
    storage.restore();
  }
});

test("explicit v2 store APIs start fresh from v1 and persist v2", () => {
  const storage = installStorageWindow();
  try {
    const scopeKey = "v2-route";
    storage.values.set(questProgressStorageKey(scopeKey), JSON.stringify({
      ...baseQuestState(),
      mastery: { sh: { correct: 99 } },
      checkpoint: { stopId: "s39" },
      assignment: { targets: ["sh"] },
      settings: { quietSoundscape: true }
    }));

    const loaded = loadSoundSeekersV2Progress(scopeKey);
    const saved = saveSoundSeekersV2Progress(scopeKey, {
      ...loaded,
      evidence: [{ id: "v2-event", at: 1 }]
    }, { syncCloud: false });

    assert.equal(loaded.v, 2);
    assert.deepEqual(loaded.evidence, []);
    assert.equal(loaded.settings.music, false);
    assert.deepEqual(saved.evidence, [{ id: "v2-event", at: 1 }]);
    assert.equal(JSON.parse(storage.values.get(questProgressStorageKey(scopeKey))).v, 2);
  } finally {
    storage.restore();
  }
});
