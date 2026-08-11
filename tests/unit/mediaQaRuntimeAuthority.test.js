import test from "node:test";
import assert from "node:assert/strict";

import { initialSoundWordBank } from "../../src/content/initialSounds/initialSoundWordBank.js";
import { getInitialSoundRoundPlan } from "../../src/content/initialSounds/initialSoundSelector.js";
import { getMediaQaId, isMediaQaRuntimeAllowed } from "../../src/data/mediaQaManifest.js";

test("legacy device-local QA drafts cannot block released assessment media", () => {
  const apple = initialSoundWordBank.find(item => item.id === "fs_a_apple_l1");
  const storage = new Map([
    ["lpMediaQaOverridesV2", JSON.stringify({
      [getMediaQaId("image", apple.imageUrl)]: { status: "blocked" },
      [getMediaQaId("audio", apple.audioUrl)]: { status: "rejected" }
    })]
  ]);
  const previousLocalStorage = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value))
  };

  try {
    assert.equal(isMediaQaRuntimeAllowed(apple.imageUrl, "image"), true);
    assert.equal(isMediaQaRuntimeAllowed(apple.audioUrl, "audio"), true);
    const plan = getInitialSoundRoundPlan({ level: 1, seed: 11 });
    assert.equal(plan.items.length, 15);
    assert.deepEqual(plan.meta.blockedLetters, []);
  } finally {
    if (previousLocalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousLocalStorage;
  }
});
