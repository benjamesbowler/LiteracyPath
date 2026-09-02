import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { SOUND_SEEKERS_BIOME_KITS } from "../../src/features/soundSeekers/content/biomeKits.js";
import { readSoundSeekersV2AssetManifest } from "../../tools/lib/soundSeekersV2AssetManifest.mjs";
import {
  assertSoundSeekersVisualSemantics,
  validateSoundSeekersVisualAuthorities
} from "../../tools/checkSoundSeekersVisualSemantic.mjs";
import { buildSoundSeekersV2AuthoritySnapshot } from "../../tools/checkSoundSeekersV2Content.mjs";

test("raster review truth stays byte-bound and disjoint from code-native DOM truth", () => {
  const manifest = readSoundSeekersV2AssetManifest();
  assert.equal(manifest.assets.length, 8);
  assert.equal(manifest.assets.flatMap(asset => asset.cropReview.profiles).length, 24);
  assert.equal(assertSoundSeekersVisualSemantics(), true);
  for (let index = 0; index < SOUND_SEEKERS_BIOME_KITS.length; index += 1) {
    const kit = SOUND_SEEKERS_BIOME_KITS[index];
    const asset = manifest.assets[index];
    assert.equal(asset.path, kit.background.src);
    const bytes = readFileSync(path.join(process.cwd(), "public", asset.path.slice(1)));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.final.sha256);
    assert.deepEqual(asset.task4.backdropReviewSemanticIds, kit.backdropReviewSemanticIds);
    assert.deepEqual(asset.cropReview.profiles.map(profile => profile.targetSize), [
      [568, 320], [1194, 834], [320, 568]
    ]);
    assert.deepEqual(kit.backdropReviewSemanticIds.filter(id => kit.codeNativeSemanticIds.includes(id)), []);
  }
});

test("every cloned visual authority family fails closed on drift", () => {
  assert.equal(validateSoundSeekersVisualAuthorities(
    structuredClone(buildSoundSeekersV2AuthoritySnapshot())
  ), true);
  for (const [label, mutate] of [
    ["biome", value => { value.biomeKits[0].codeNativeSemanticIds.pop(); }],
    ["scene", value => { value.sceneRenderSpecs[0].optionSemanticIds.pop(); }],
    ["option", value => { value.optionVisuals[0].accessibleLabel = "drift"; }],
    ["meaning", value => { value.meaningVisuals[0].accessibleLabel = "drift"; }],
    ["route", value => { value.routeSpecs[0].stopId = "s40"; }],
    ["landmark", value => { value.landmarkBindings[0].sceneId = "scene-s40"; }],
    ["character", value => { value.characterVisuals[0].characterId = "drift"; }],
    ["player", value => { value.playerVisual.characterId = "drift"; }],
    ["creator", value => { value.creatorOptions.bodyShapes.pop(); }],
    ["pose", value => { value.poseIds.pop(); }],
    ["asset", value => { value.assetManifest.assets[0].path = "/drift.webp"; }]
  ]) {
    const snapshot = structuredClone(buildSoundSeekersV2AuthoritySnapshot());
    mutate(snapshot);
    assert.throws(() => validateSoundSeekersVisualAuthorities(snapshot), undefined, label);
  }
});
