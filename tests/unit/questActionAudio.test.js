import test from "node:test";
import assert from "node:assert/strict";
import {
  QUEST_ACTION_SFX,
  QUEST_CHAPTER_MATERIAL_SFX,
  questCeremonySfxSequence,
  questActionSfxEntry,
  questActionSfxId,
  questActionSfxMixScale,
  questChapterMaterialSfxEntry,
  setQuestActionSfxInstructionActive
} from "../../src/utils/questActionAudio.js";

test("physical verb families have distinct action sound identities", () => {
  assert.equal(questActionSfxId({ verbPattern: "search", playerAction: "search" }), "discover");
  assert.equal(questActionSfxId({ verbPattern: "jump", playerAction: "step-lily" }), "hop");
  assert.equal(questActionSfxId({ verbPattern: "single", playerAction: "choose-path" }), "interact");
  assert.equal(questActionSfxId({ verbPattern: "delivery", playerAction: "lift-crate" }), "lift");
  assert.equal(questActionSfxId({ verbPattern: "delivery", playerAction: "dock-crate" }), "place");
  assert.equal(questActionSfxId({ verbPattern: "assembly", playerAction: "fit-lens" }), "build");
  assert.equal(questActionSfxId({ verbPattern: "pursuit", playerAction: "net-fish" }), "discover");
  assert.equal(questActionSfxId({ verbPattern: "route", playerAction: "follow-track" }), "hop");
  assert.equal(questActionSfxId({ verbPattern: "sort", playerAction: "sort-ore" }), "place");
  assert.equal(questActionSfxId({ verbPattern: "tool", playerAction: "brush-fossil" }), "interact");
  assert.equal(questActionSfxId({ verbPattern: "turn", playerAction: "turn-orbit" }), "interact");
  assert.equal(questActionSfxId({ verbPattern: "steer", playerAction: "steer-ferry" }), "place");
  assert.equal(questActionSfxId({ verbPattern: "signal", playerAction: "send-signal" }), "pulse");
  assert.equal(questActionSfxId({ verbPattern: "climb", playerAction: "climb-route" }), "hop");
  assert.equal(questActionSfxId({ verbPattern: "rhythm", playerAction: "ring-bell" }), "pulse");
});

test("timing retries are neutral and errors do not masquerade as action success", () => {
  assert.equal(questActionSfxId({ kind: "wait", verbPattern: "rhythm" }), "wait");
  assert.equal(questActionSfxId({ kind: "wrong", verbPattern: "rhythm" }), null);
  assert.equal(questActionSfxEntry({ kind: "wrong" }), null);
});

test("instructional audio keeps physical feedback below the phonics cue", () => {
  setQuestActionSfxInstructionActive(false);
  assert.equal(questActionSfxMixScale(), 1);
  assert.equal(setQuestActionSfxInstructionActive(true), true);
  assert.equal(questActionSfxMixScale(), 0.12);
  assert.equal(questActionSfxMixScale({ instructionActive: false }), 1);
  assert.equal(setQuestActionSfxInstructionActive(false), false);
});

test("every action sound exports a stable Phaser key and public source", () => {
  assert.deepEqual(Object.keys(QUEST_ACTION_SFX), [
    "discover", "hop", "interact", "lift", "place", "build", "pulse", "wait"
  ]);
  for (const [id, entry] of Object.entries(QUEST_ACTION_SFX)) {
    assert.equal(entry.key, `quest-action-${id}`);
    assert.equal(entry.src, `/game-assets/quest-pixel/seedwake/audio/action-${id}.wav`);
  }
});

test("each chapter layers a distinct material identity under physical actions", () => {
  assert.equal(Object.keys(QUEST_CHAPTER_MATERIAL_SFX).length, 8);
  assert.equal(new Set(Object.values(QUEST_CHAPTER_MATERIAL_SFX).map(entry => entry.src)).size, 8);
  for (const [chapterId, entry] of Object.entries(QUEST_CHAPTER_MATERIAL_SFX)) {
    assert.equal(questChapterMaterialSfxEntry(chapterId), entry);
    assert.match(entry.key, /^quest-material-/);
    assert.match(entry.src, /^\/game-assets\/quest-pixel\/seedwake\/audio\/material-/);
  }
  assert.equal(questChapterMaterialSfxEntry("unknown"), null);
});

test("chapter ceremonies score gathering, relic lift, material, and landing", () => {
  const seedwake = questCeremonySfxSequence("seedwake-meadow");
  assert.deepEqual(seedwake.map(cue => cue.role), ["open", "gather", "lift", "material", "land"]);
  assert.deepEqual(seedwake.map(cue => cue.delay), [0, 120, 460, 460, 850]);
  assert.equal(seedwake.find(cue => cue.role === "material").key, "quest-material-meadow");
  assert.equal(seedwake.at(-1).key, "seedwake-success");

  const fossil = questCeremonySfxSequence("fossil-canyon");
  assert.equal(fossil.find(cue => cue.role === "material").key, "quest-material-fossil");
  assert.notEqual(
    fossil.find(cue => cue.role === "material").key,
    seedwake.find(cue => cue.role === "material").key
  );

  const reduced = questCeremonySfxSequence("seedwake-meadow", { reducedMotion: true });
  assert.deepEqual(reduced.map(cue => cue.delay), [0, 0, 50, 50, 150]);
  assert.ok(reduced.every(cue => cue.volume > 0 && cue.volume < 0.3));
});
