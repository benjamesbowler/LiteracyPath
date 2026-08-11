import test from "node:test";
import assert from "node:assert/strict";

import { initialSoundWordBank } from "../../src/content/initialSounds/initialSoundWordBank.js";
import { getInitialSoundRoundPlan } from "../../src/content/initialSounds/initialSoundSelector.js";
import { prepareRuntimeQuestionBank } from "../../src/appState/assessmentRuntime.js";
import { loadAssessmentSkillBank } from "../../src/data/loadAssessmentSkillBank.js";
import { getMediaQaId, isMediaQaRuntimeAllowed } from "../../src/data/mediaQaManifest.js";
import { isRuntimeEligibleEarlySkillQuestion } from "../../src/utils/earlySkills/isRuntimeEligibleEarlySkillQuestion.js";

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

test("the production Initial Sounds selector uses the published v3 bank", async () => {
  const publishedBank = prepareRuntimeQuestionBank(
    await loadAssessmentSkillBank("initial_sounds")
  );
  const plan = getInitialSoundRoundPlan({
    level: 1,
    seed: 11,
    itemBank: publishedBank,
    requireImportedMedia: false,
    itemEligibility: item => isRuntimeEligibleEarlySkillQuestion(item, {
      skillId: "initial_sounds",
      level: 1
    })
  });

  assert.equal(plan.items.length, 15);
  assert.deepEqual(plan.meta.blockedLetters, []);
  assert.equal(new Set(plan.items.map(item => item.letter)).size, 15);
  assert.ok(plan.items.every(item => item.source === "skills_rebuild_v3_2026_08"));
  assert.ok(plan.items.every(item => item.imagePath || item.imageCards?.length));
  assert.ok(plan.items.every(item =>
    item.audioPath ||
    item.audioUrl ||
    item.imageCards?.every(card => card.audio || card.audioPath || card.audioUrl)
  ));
});
