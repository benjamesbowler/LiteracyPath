import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { GAME_RECOVERY_URLS, loadGameRecoveryBytes } from "../../src/utils/gameRecoveryAssets.js";
import { createRacerKart } from "../../src/components/learn/games/games/soundRacerKartAsset.js";
import { createSpellSkater } from "../../src/components/learn/games/games/spellSkaterAsset.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

test("browser decompression restores each canonical model without base64 decoding", async t => {
  const files = {
    kart: "sound-racer/models/pip-kart",
    skater: "spell-skate/spell-skater",
    climber: "word-climb/pip-climber"
  };
  t.mock.method(globalThis, "fetch", async url => new Response(readFileSync(new URL(url))));
  for (const [key, source] of Object.entries(files)) {
    const decoded = await loadGameRecoveryBytes(GAME_RECOVERY_URLS[key]);
    assert.deepEqual(Buffer.from(decoded), readFileSync(new URL(`../../public/game-assets/${source}.glb`, import.meta.url)));
  }
});

test("a failed primary model still installs the complete skin and animations", async t => {
  t.mock.method(globalThis, "fetch", async url => new Response(readFileSync(new URL(url))));
  t.mock.method(GLTFLoader.prototype, "loadAsync", async () => { throw new Error("primary unavailable"); });
  for (const create of [createRacerKart, createSpellSkater]) {
    const asset = create();
    assert.equal(await asset.ready, true);
    assert.equal(asset.root.userData.assetState, "ready");
    assert.equal(asset.root.children.length, 1);
    asset.dispose();
    assert.equal(asset.root.children.length, 0);
  }
});

test("HTTP Content-Encoding decoding is not applied a second time", async t => {
  const original = readFileSync(new URL("../../public/game-assets/sound-racer/models/pip-kart.glb", import.meta.url));
  t.mock.method(globalThis, "fetch", async () => new Response(original, { headers: { "Content-Encoding": "gzip" } }));
  assert.deepEqual(Buffer.from(await loadGameRecoveryBytes(GAME_RECOVERY_URLS.kart)), original);
});

test("a failed recovery download or invalid gzip reaches the existing game fallback", async t => {
  const request = t.mock.method(globalThis, "fetch", async () => new Response("missing", { status: 404 }));
  await assert.rejects(loadGameRecoveryBytes(GAME_RECOVERY_URLS.kart), /404/);
  request.mock.mockImplementation(async () => new Response("invalid gzip"));
  await assert.rejects(loadGameRecoveryBytes(GAME_RECOVERY_URLS.kart));
});
