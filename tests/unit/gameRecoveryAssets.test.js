import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import sharp from "sharp";
import { GAME_RECOVERY_URLS, loadGameRecoveryBytes, racerKartRecoveryUrl, spellSkaterRecoveryUrl } from "../../src/utils/gameRecoveryAssets.js";
import { GAME_RECOVERY_SOURCES } from "../../src/data/gameRecoverySources.js";
import { createRacerKart } from "../../src/components/learn/games/games/soundRacerKartAsset.js";
import { createSpellSkater } from "../../src/components/learn/games/games/spellSkaterAsset.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

test("browser decompression restores each canonical model without base64 decoding", async t => {
  assert.deepEqual(Object.keys(GAME_RECOVERY_URLS).sort(), Object.keys(GAME_RECOVERY_SOURCES).sort());
  t.mock.method(globalThis, "fetch", async url => new Response(readFileSync(new URL(url))));
  for (const [key, { source }] of Object.entries(GAME_RECOVERY_SOURCES)) {
    const decoded = await loadGameRecoveryBytes(GAME_RECOVERY_URLS[key]);
    assert.deepEqual(Buffer.from(decoded), readFileSync(new URL(`../../public/game-assets/${source}.glb`, import.meta.url)));
  }
});

test("each racing world recovers its own driver and never substitutes legacy Pip", () => {
  assert.equal(racerKartRecoveryUrl('meadow'), GAME_RECOVERY_URLS.kartBouncy);
  assert.equal(racerKartRecoveryUrl('dino'), GAME_RECOVERY_URLS.kartChompy);
  assert.equal(racerKartRecoveryUrl('moonwood'), GAME_RECOVERY_URLS.kartPip);
  assert.equal(racerKartRecoveryUrl(), GAME_RECOVERY_URLS.kartBouncy);
  assert.equal(new Set(['meadow', 'dino', 'moonwood'].map(racerKartRecoveryUrl)).size, 3);
  for (const world of ['meadow', 'dino', 'moonwood']) assert.notEqual(racerKartRecoveryUrl(world), GAME_RECOVERY_URLS.kart);
});

test("each skating world recovers its exported character without substituting the retained skater", () => {
  assert.equal(spellSkaterRecoveryUrl(), GAME_RECOVERY_URLS.skaterBouncy);
  assert.equal(spellSkaterRecoveryUrl('meadow'), GAME_RECOVERY_URLS.skaterBouncy);
  assert.equal(spellSkaterRecoveryUrl('dino'), GAME_RECOVERY_URLS.skaterChompy);
  assert.equal(spellSkaterRecoveryUrl('moonwood'), GAME_RECOVERY_URLS.skaterPip);
  assert.equal(new Set(['meadow', 'dino', 'moonwood'].map(spellSkaterRecoveryUrl)).size, 3);
  for (const world of ['meadow', 'dino', 'moonwood']) assert.notEqual(spellSkaterRecoveryUrl(world), GAME_RECOVERY_URLS.skater);
});

test("a failed primary model restores each world's real skin, UV images and animations", async t => {
  // Node has no browser ImageBitmap. Decode the real embedded pixels for CPU
  // parsing here; actual GPU texture appearance is verified in the native game.
  const globals = ['self', 'createImageBitmap'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  globalThis.self = globalThis;
  globalThis.createImageBitmap = async blob => {
    const { info } = await sharp(Buffer.from(await blob.arrayBuffer())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.ok(info.width > 0 && info.height > 0);
    return { width: info.width, height: info.height, close() {} };
  };
  t.after(() => {
    for (const [key, descriptor] of globals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const originalFetch = globalThis.fetch;
  t.mock.method(globalThis, "fetch", async url => String(url).startsWith('blob:')
    ? originalFetch(url) : new Response(readFileSync(new URL(url))));
  t.mock.method(GLTFLoader.prototype, "loadAsync", async () => { throw new Error("primary unavailable"); });
  const assets = [
    ...['meadow', 'dino', 'moonwood'].map(world => ({ create: () => createRacerKart({ world }), world, kind: 'kart' })),
    ...['meadow', 'dino', 'moonwood'].map(world => ({ create: () => createSpellSkater({ world }), world, kind: 'skater' })),
    { create: createSpellSkater }
  ];
  for (const { create, world, kind } of assets) {
    const asset = create();
    assert.equal(await asset.ready, true, asset.root.userData.assetError);
    assert.equal(asset.root.userData.assetState, "ready");
    assert.equal(asset.root.children.length, 1);
    if (kind === 'kart') {
      assert.equal(asset.root.name, `Canonical${{ meadow: 'Bouncy', dino: 'Chompy', moonwood: 'Pip' }[world]}Kart`);
      assert.equal(asset.snapshot().recoveredAsset, true);
      assert.equal(asset.snapshot().wheelCount, 4);
      assert.deepEqual(asset.snapshot().clips.sort(), ['brake', 'celebrate', 'drive', 'recover', 'turn_left', 'turn_right']);
      let texturedSkins = 0;
      asset.root.traverse(node => {
        if (node.isSkinnedMesh && node.geometry.attributes.uv && node.material.map?.image) texturedSkins += 1;
      });
      assert.ok(texturedSkins > 0, `${world} retains decoded UV material on the actual skin`);
    }
    if (kind === 'skater') {
      assert.equal(asset.root.name, `${{ meadow: 'Bouncy', dino: 'Chompy', moonwood: 'Pip' }[world]}SpellSkater`);
      assert.equal(asset.snapshot().recoveredAsset, true);
      assert.deepEqual(asset.snapshot().clips.sort(), ['coast', 'crouch', 'grind', 'jump', 'land', 'push', 'recover', 'stumble', 'turn_left', 'turn_right']);
      let texturedSkins = 0;
      asset.root.traverse(node => {
        if (node.isSkinnedMesh && node.geometry.attributes.uv && node.material.map?.image) texturedSkins += 1;
      });
      assert.ok(texturedSkins > 0, `${world} retains the actual skating skin and decoded UV material`);
    }
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
