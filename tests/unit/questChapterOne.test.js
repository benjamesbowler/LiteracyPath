import test from "node:test";
import assert from "node:assert/strict";
import {
  SEEDWAKE_STOP_IDS,
  seedwakeSatchel,
  seedwakeStopSpec,
  validateSeedwakeChapter
} from "../../src/data/questChapterOne.js";
import {
  SEEDWAKE_ASSET_ALLOWLIST,
  seedwakeAssetManifest
} from "../../src/data/threeAssetLibrary.js";

test("Seedwake Meadow has five distinct authored mechanics, rewards, and repairs", () => {
  assert.deepEqual(SEEDWAKE_STOP_IDS, ["s1", "s2", "s3", "s4", "s5"]);
  assert.deepEqual(validateSeedwakeChapter(), []);
  assert.equal(new Set(SEEDWAKE_STOP_IDS.map(id => seedwakeStopSpec(id).mechanic)).size, 5);
});

test("the Seedwake satchel derives durable inventory and useful cache unlocks", () => {
  const state = {
    trail: {
      stopsDone: ["s1", "s2", "s3"],
      drops: { s1: 3, s2: 4, s3: 2 }
    }
  };
  const satchel = seedwakeSatchel(state);
  assert.equal(satchel.total, 9);
  assert.equal(satchel.cacheCount, 2);
  assert.equal(satchel.nextCacheAt, 14);
  assert.equal(satchel.repairs.length, 3);
  assert.equal(satchel.sparksBanked, 18);
  assert.equal(satchel.collectionComplete, false);
});

test("empty and corrupt Seedwake inventory is calm", () => {
  assert.deepEqual(seedwakeSatchel(null), {
    pockets: SEEDWAKE_STOP_IDS.map(stopId => ({
      ...seedwakeStopSpec(stopId).collectible,
      stopId,
      count: 0,
      repaired: false,
      repair: seedwakeStopSpec(stopId).repair
    })),
    total: 0,
    repairs: [],
    cacheCount: 0,
    nextCacheAt: 3,
    sparksBanked: 0,
    collectionComplete: false
  });
});

test("every Seedwake model belongs to the explicit, style-matched meadow asset kit", () => {
  const manifest = seedwakeAssetManifest();
  const allowed = new Set(SEEDWAKE_ASSET_ALLOWLIST);
  assert.equal(manifest.kitId, "seedwake-meadow");
  assert.ok(manifest.urls.length >= 12);
  assert.ok(manifest.urls.every(url => allowed.has(url)), "a Seedwake model escaped the declared allowlist");
  assert.ok(
    manifest.urls.every(url => /^\/models\/library\/kaykit\/(medieval|halloween)\//.test(url)),
    "the meadow slice mixes unrelated model authors or visual families"
  );
});
